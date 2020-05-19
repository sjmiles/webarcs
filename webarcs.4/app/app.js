/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import './ui/ui.js';

import {makeName} from '../arcs/build/utils/names.js';
import {deepCopy} from '../arcs/build/utils/object.js';
import {logFactory} from '../arcs/build/utils/log.js';
import {Store} from '../arcs/build/data/store.js';
import {Database} from '../arcs/build/data/database.js';
import {Runtime} from '../arcs/build/ergo/runtime.js';
import {Hub} from '../arcs/build/net/hub.js';
import {initParticles} from './particles.js';
import {Planner} from './planner.js';
import {recipes} from './recipes.js';
import {users} from './users.js';
import {Surfaces} from './surfaces/surfaces.js';

// flags
const enableNetwork = false;
// const enablePersistance = false;

// ui objects
const {tenantsView, tenantPages} = window;

// logger
const log = logFactory(true, 'Application', 'firebrick');

// bootstrap
(async () => {
  // initialize particle corpus
  await initParticles();
  // initialize tenants
  const tenants = await initTenants(users);
  // global for debugging only
  window.tenants = tenants;
  // initialize runtime environments (per tenant)
  initRuntime(tenants);
  // bring up ui
  initUi(tenants);
})();

const initTenants = specs => {
  // collate raw material
  return specs.map(({persona, device, peers}) => ({
    device,
    persona,
    peers: peers.reduce((peers, peer) => (peers[peer] = true, peers), {}),
    id: `${persona}:${device}`,
    avataricon: `../assets/users/${persona}.png`,
    deviceicon: `../assets/devices/${device}.png`,
    // arcs mapped here by id
    arcs: {}
  }));
};

const initRuntime = async tenants => {
  await Promise.all(tenants.map(async tenant => initTenant(tenant, tenants)));
};

const initTenant = (tenant, tenants) => {
  // create a DOM node container for tenant-view to install
  tenant.root = Object.assign(document.createElement('div'), {
    id: `${tenant.id}-arcs`,
    style: 'flex: 1; display: flex; flex-direction: column;'}
  );
  // create a runtime environment
  tenant.runtime = new Runtime(tenant);
  // create surface manager
  tenant.runtime.surfaces = new Surfaces();
  // create tenant's database, populate from persistance layer
  initContext(tenant);
  // network
  if (enableNetwork) {
    initNetwork(tenant, tenants);
  }
  // planning
  initPlanner(tenant);
};

const initContext = async tenant => {
  //const {runtime} = tenant;
  // Database (context)
  tenant.context = new Database(`${tenant.id}:context`);
  // bootstrap profile data
  initProfileStore(tenant);
  // bootstrap metadata store for arcs
  initMetadataStore(tenant);
  // bootstrap metadata store for shared arcs
  //initSharedArcStore(tenant);
};

const initProfileStore = tenant => {
  // bootstrap profile data
  const pid = Store.idFromMeta({
    arcid: `basic_profile`,
    name: 'profile',
    type: `BasicProfile`,
    tags: ['public', 'volatile'],
    tenantid: tenant.id
  });
  const data = {
    persona: tenant.persona,
    avataricon: tenant.avataricon
  };
  const profile = tenant.runtime.createStore(pid, {value: data});
  tenant.context.add(profile);
};

const initMetadataStore = async tenant => {
  // bootstrap per-persona metadata store
  const mid = Store.idFromMeta({
    arcid: `${tenant.persona}`, //`${tenant.id.replace(':', '_')}`, // fake, there is no arc :(
    name: 'metadata',
    type: `SystemMetadata`,
    tags: ['personal'],
    tenantid: tenant.id
  });
  // TODO(sjmiles): metadata is of type arcmeta[], but Store.fix doesn't support top-level arrays
  // for stopgap, we translate to/from key/value pairs
  //const entities = metadataToStorable(meta);
  tenant.metadata = tenant.runtime.createStore(mid);
  await tenant.runtime.importMetadata(storableToMetadata(tenant.metadata.data));
  // if we share tenant.metadata, arcs can be manipulated by this persona on other devices
  // we listen for changes in that metadata so we can build/destroy arcs as needed
  tenant.metadata.listen('set-truth', async store => {
    log(`${tenant.id}: metadata set-truth`); //, store.json);
    const meta = storableToMetadata(store.data);
    await tenant.runtime.importMetadata(meta);
  });
  // make it shareable via context database
  tenant.context.add(tenant.metadata);
};

const initPlanner = tenant => {
  tenant.planner = new Planner(tenant);
  window.setInterval(() => tenant.planner.plan(), 500);
};

const initNetwork = (tenant, tenants) => {
  // convert array of peer-specs into array of tenant objects
  tenant.tenants = Object.keys(tenant.peers).map(id => tenants.find(d => d.id === id));
  tenant.hub = new Hub(tenant);
};

const initUi = tenants => {
  // tenant selector
  tenantsView.tenants = tenants;
  // tenant pages
  tenantPages.tenants = tenants;
  // connect selector to pages
  tenantsView.addEventListener('selected', ({detail: tenant}) => {
    tenantPages.selected = tenant;
  });
};

/* */

const createRecipeArc = async (runtime, id, recipe) => {
  const modality = recipe.meta && recipe.meta.modality || 'xen';
  const surface = await runtime.surfaces.requestSurface(modality, runtime.tenant.root);
  if (!surface) {
    alert(`"${modality}" surface is not available on this device.`);
  } else {
    const composer = await surface.createComposer(id);
    const arc = await runtime.createArc(id, composer);
    // instantiate recipe
    await runtime.instantiate(arc, recipe);
    // force lifecycle (needed?)
    arc.updateHosts();
    // update metadata
    updateMetadata(runtime);
    composer.activate();
    return arc;
  }
};

// update metadata store
const updateMetadata = runtime => {
  const meta = runtime.exportMetadata();
  const collection = metadataToStorable(meta);
  log('updateMetadata', collection);
  runtime.tenant.metadata.change(doc => doc.data = collection);
};

const metadataToStorable = meta => {
  // TODO(sjmiles): metadata is of type arcmeta[], but Store.fix doesn't support top-level arrays
  // To make this work at first, we convert to key/value pairs
  const entities = {};
  if (meta) {
    meta.forEach(entry => entities[entry.id] = deepCopy(entry));
  }
  return entities;
};

const storableToMetadata = meta => {
  // TODO(sjmiles): metadata is of type arcmeta[], but Store.fix doesn't support top-level arrays
  // To make this work at first, we convert back from key/value pairs
  return meta ? Object.values(meta) : [];
};

// TODO(sjmiles): hack app-level abilities into Runtime object for ui components to access.

Runtime.prototype.updateMetadata = function() {
  updateMetadata(this);
};

Runtime.prototype.createRecipeArc = async function(recipe) {
  const map = {'school-chat': 'chat', 'lab-chat': 'chat', 'book-club': 'book_club'};
  await createRecipeArc(this, `${recipe}-${makeName()}`, recipes[map[recipe] || recipe]);
  tenantPages._invalidate();
};

Runtime.prototype.importSharedArc = async function(share) {
  await this.importArcMetadata(share);
  this.updateMetadata();
};

