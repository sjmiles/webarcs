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
import {Runtime} from '../arcs/build/ergo/runtime.js';
import {initParticles} from './particles.js';
import {initTenants} from './tenants.js';
import {Planner} from './planner.js';
import {recipes} from './recipes.js';
import {users} from './users.js';

const log = logFactory(true, 'Application', 'firebrick');

// ui objects
const {tenantsView, tenantPages} = window;

(async () => {
  // initialize particle corpus
  await initParticles();
  // initialize tenants (global for debugging only)
  const tenants = window.tenants = await initTenants(users);
  // ui
  initUi(tenants);
  // stores & arcs
  initContext(tenants);
  // planning
  initPlanner(tenants);
})();

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

const initContext = tenants => {
  tenants.forEach(async tenant => {
    const {runtime} = tenant;
    // bootstrap profile data
    initProfileStore(tenant);
    // restore arc metadata (from persistence layer)
    const meta = runtime.restoreArcMetas();
    // bootstrap arc metadata store
    initMetadataStore(tenant, meta);
    // bootstrap shared arcs metadata store
    initSharedArcStore(tenant, meta);
    // reify objects
    if (meta) {
      await runtime.importMetadata(meta);
    }
  });
};

const initProfileStore = tenant => {
  // bootstrap profile data
  const pid = Store.idFromMeta({
    arcid: `basic_profile`,
    name: 'profile',
    type: `BasicProfile`,
    tags: ['shared', 'volatile'],
    tenantid: tenant.id
  });
  const data = {
    persona: tenant.persona,
    avataricon: tenant.avataricon
  };
  const profile = tenant.runtime.createStore(pid, {value: data});
  tenant.context.add(profile);
};

const initMetadataStore = (tenant, meta) => {
  // TODO(sjmiles): metadata is of type arcmeta[], but Store.fix doesn't support top-level arrays
  // To make this work at first, we convert to key/value pairs
  const entities = metadataToStorable(tenant.runtime, meta);
  // bootstrap persona metadata store
  const mid = Store.idFromMeta({
    arcid: `${tenant.persona}`, //`${tenant.id.replace(':', '_')}`, // fake, there is no arc :(
    name: 'metadata',
    type: `SystemMetadata`,
    tags: ['shared'],
    tenantid: tenant.id
  });
  tenant.metadata = tenant.runtime.createStore(mid, {value: entities});
  // if we share tenant.metadata, arcs can be manipulated by this persona on other devices
  // we listen for changes in that metadata so we can build/destroy arcs as needed
  tenant.metadata.listen('set-truth', async store => {
    log(`${tenant.id}: metadata set-truth`); //, store.json);
    const meta = storableToMetadata(store.getProperty());
    await tenant.runtime.importMetadata(meta);
  });
  // make it shareable via context database
  tenant.context.add(tenant.metadata);
};

const initSharedArcStore = (tenant) => {
  // bootstrap shared arc store: arc-metadata that reflects shared-arcs
  // shared-arc metadata turns out to need a mix of information from the store-spec and the realized-store:
  // store-spec for bind to persona-specific data-stores, realized-store for other binding decisions
  const mid = Store.idFromMeta({
    arcid: `${tenant.persona}`, // there is no arc; we should call 'arcid' something else (e.g. 'contextid')
    name: 'arcshare',
    type: `[ArcShareMetadata]`,
    tags: ['shared'],
    tenantid: tenant.id
  });
  tenant.sharedArcs = tenant.runtime.createStore(mid);
  // if we share tenant.sharedArcs, recipients will be able to study the data and offer suggestions to reify
  tenant.sharedArcs.listen('set-truth', async store => {
    log(`${tenant.id}: sharedArcs set-truth: `, Object.keys(store.pojo.data));
  });
  // put into context for sharing
  tenant.context.add(tenant.sharedArcs);
};

const initPlanner = tenants => {
  tenants.forEach(tenant => {
    tenant.planner = new Planner(tenant);
    window.setInterval(() => tenant.planner.plan(), 500);
  });
};

const metadataToStorable = (runtime, meta) => {
  // TODO(sjmiles): metadata is of type arcmeta[], but Store.fix doesn't support top-level arrays
  // To make this work at first, we convert to key/value pairs
  const entities = {};
  if (meta) {
    meta.forEach(entry => entities[entry.id] = deepCopy(entry));
  }
  return entities;
};

const storableToMetadata = (meta) => {
  // TODO(sjmiles): metadata is of type arcmeta[], but Store.fix doesn't support top-level arrays
  // To make this work at first, we convert back from key/value pairs
  return meta ? Object.values(meta) : [];
};

const createRecipeArc = async (runtime, id, recipe) => {
  //const arc = await runtime.createArc(runtime.tenant, name, recipe);
  const arc = await runtime.createArc(id);
  // instantiate recipe
  await runtime.instantiate(arc, recipe);
  // force lifecycle (?)
  arc.updateHosts();
  // update metadata
  updateMetadata(runtime);
  // TODO(sjmiles): hack to make it go: 'chat' recipe is shared
  if (recipe === recipes.chat) {
    log(`detected 'chat' recipe: sharing arc metadata via sharedArcs store`);
    shareArc(runtime, arc);
  }
  return arc;
};

// update sharedArcs store
const shareArc = (runtime, arc) => {
  const meta = runtime.exportArcMetadata(arc);
  runtime.tenant.sharedArcs.change(doc => doc.data[arc.id] = meta);
};

// update metadata store
const updateMetadata = runtime => {
  const meta = runtime.exportMetadata();
  const collection = metadataToStorable(runtime, meta);
  runtime.tenant.metadata.change(doc => doc.data = collection);
};

// TODO(sjmiles): hack app-level abilities into Runtime object for ui components to access.

Runtime.prototype.createRecipeArc = function(recipe) {
  const map = {'school-chat': 'chat', 'lab-chat': 'chat', 'book-club': 'book_club'};
  createRecipeArc(this, `${recipe}-${makeName()}`, recipes[map[recipe] || recipe]);
  tenantPages._invalidate();
};

Runtime.prototype.importSharedArc = async function(share) {
  await this.importArcMetadata(share);
  this.persistArcMetas();
  updateMetadata(this);
};
