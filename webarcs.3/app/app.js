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

import {Store} from '../arcs/build/data/store.js';
// import {Arc} from '../arcs/build/core/arc.js';
// import {Composer/*, showSlots*/} from '../arcs/build/platforms/dom/xen-dom-composer.js';
import {Runtime} from '../arcs/build/ergo/runtime.js';
import {initParticles} from './particles.js';
import {initTenants} from './tenants.js';
import {Planner} from './planner.js';
import {recipes} from './recipes.js';
import {users} from './users.js';

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
  // setTimeout(() => {
  //   showSlots();
  // }, 2000);
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
    const pid = Store.idFromMeta({
      arcid: `basic_profile`,
      name: 'profile',
      type: `BasicProfile`,
      tags: ['shared', 'volatile'],
      tenantid: tenant.id
    });
    const data = tenant.persona;
    const profile = runtime.createStore(pid, data);
    tenant.context.add(profile);
    // restore arcs
    const meta = runtime.restoreArcMetas();
    // TODO(sjmiles): metadata is of type arcmeta[], but Store.fix doesn't support top-level arrays
    // To make this work at first, we convert to key/value pairs
    const entities = metadataToStorable(runtime, meta);
    // bootstrap persona metadata store
    const mid = Store.idFromMeta({
      arcid: `${tenant.persona}`, //`${tenant.id.replace(':', '_')}`, // fake, there is no arc :(
      name: 'metadata',
      type: `SystemMetadata`,
      tags: ['shared'],
      tenantid: tenant.id
    });
    tenant.metadata = tenant.runtime.createStore(mid, entities);
    tenant.metadata.listen('set-truth', async store => {
      console.warn(`${tenant.id}: metadata set-truth`, store.json);
      const meta = storableToMetadata(store.getProperty());
      await runtime.importMetadata(meta);
    });
    // // put into context for sharing
    tenant.context.add(tenant.metadata);
    // reify objects
    if (meta) {
      await runtime.importMetadata(meta);
    }
  });
};

const initPlanner = tenants => {
  tenants.forEach(tenant => {
    tenant.planner = new Planner(tenant);
    window.setInterval(() => tenant.planner.plan(), 500);
  });
};

const persistMetadata = runtime => {
  const meta = runtime.exportMetadata();
  const collection = metadataToStorable(runtime, meta);
  runtime.tenant.metadata.change(doc => doc.data = collection);
};

const metadataToStorable = (runtime, meta) => {
  // TODO(sjmiles): metadata is of type arcmeta[], but Store.fix doesn't support top-level arrays
  // To make this work at first, we convert to key/value pairs
  const entities = {};
  if (meta) {
    meta.forEach(entry => entities[entry.id] = entry);
  }
  return entities;
};

const storableToMetadata = (meta) => {
  // TODO(sjmiles): metadata is of type arcmeta[], but Store.fix doesn't support top-level arrays
  // To make this work at first, we convert back from key/value pairs
  return meta ? Object.values(meta) : [];
};

// TODO(sjmiles): hack app-level ability into Runtime object so ui components can access the ability.

Runtime.prototype.createRecipeArc = function(recipe) {
  const map = {'school-chat': 'chat', 'lab-chat': 'chat', 'book-club': 'book_club'};
  createRecipeArc(this, recipe, recipes[map[recipe] || recipe]);
  tenantPages._invalidate();
};

const createRecipeArc = async (runtime, id, recipe) => {
  //const arc = await runtime.createArc(runtime.tenant, name, recipe);
  const arc = await runtime.createArc(id);
  // instantiate recipe
  await runtime.instantiate(arc, recipe);
  // force lifecycle (?)
  arc.updateHosts();
  // persist metadata (including arcs)
  persistMetadata(runtime);
  return arc;
};

