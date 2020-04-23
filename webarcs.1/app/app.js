/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Arc} from '../arcs/build/core/arc.js';
import {Composer} from '../arcs/build/platforms/dom/xen-dom-composer.js';
import {initCorpus} from './corpus.js';
import {initTenants, getTenant} from './tenants.js';
import {Planner} from './planner.js';
import {recipes} from './recipes.js';

const specs = [{
  device: 'mobile',
  user: 'moe@springfield.com',
  persona: 'moe',
  peers: ['edna:desktop', 'carl:mobile']
}, {
  device: 'desktop',
  user: 'edna@springfield.edu',
  persona: 'edna',
  peers: ['moe:mobile', 'liz:mobile', 'lenny:mobile']
}, {
  device: 'mobile',
  user: 'carl@springfield.com',
  persona: 'carl',
  peers: ['moe:mobile', 'lenny:mobile']
}, {
  device: 'mobile',
  user: 'liz@springfield.edu',
  persona: 'liz',
  peers: ['moe:mobile', 'edna:desktop']
}, {
  device: 'mobile',
  user: 'lenny@springfield.com',
  persona: 'lenny',
  peers: ['carl:mobile', 'edna:desktop']
}, {
  device: 'mobile',
  user: 'frink@labs.com',
  persona: 'frink',
  peers: ['frink:laptop', 'liz:mobile']
}, {
  device: 'laptop',
  user: 'frink@labs.com',
  persona: 'frink',
  peers: ['frink:mobile']
}];

const arcs = [{
  id: 'moe:mobile',
  name: 'book-club',
  recipe: recipes.book_club
},{
  id: 'moe:mobile',
  name: 'tv',
  recipe: recipes.tv
},{
  id: 'edna:desktop',
  name: 'book-club',
  recipe: recipes.book_club
},{
  id: 'edna:desktop',
  name: 'school-chat',
  recipe: recipes.chat
},{
  id: 'carl:mobile',
  name: 'tv',
  recipe: recipes.tv
},{
  id: 'liz:mobile',
  name: 'school-chat',
  recipe: recipes.chat
},{
  id: 'lenny:mobile',
  name: 'tv',
  recipe: recipes.tv
},{
  id: 'lenny:mobile',
  name: 'book-club',
  recipe: recipes.book_club
},{
  id: 'frink:mobile',
  name: 'lab-chat',
  recipe: recipes.chat
},{
  id: 'frink:laptop',
  name: 'lab-chat',
  recipe: recipes.chat
}];

(async () => {
  // initialize particle corpus
  await initCorpus();
  // initialize tenants
  const tenants = await initTenants(specs);
  // for debugging only
  window.tenants = tenants;
  // populate ui
  const {tenantsView, tenantPages} = window;
  // tenant selector
  tenantsView.tenants = tenants;
  // tenant details
  tenantPages.tenants = tenants;
  // use selector to control tenant display
  tenantsView.addEventListener('selected', ({detail: tenant}) => {
    tenantPages.selected = tenant;
  });
  // arcs
  arcs.forEach(({id, name, recipe}) => {
    const tenant = getTenant(id);
    if (tenant) {
      createTestArc(tenant, name, recipe);
    }
  });
  // planning
  tenants.forEach(tenant => {
    tenant.planner = new Planner(tenant);
    setTimeout(() => tenant.planner.plan(), 2000);
  });
})();

const createTestArc = async (tenant, name, recipe) => {
  const arc = await createArc(tenant, name, recipe);
  // instantiate recipe
  await tenant.runtime.instantiate(arc, recipe);
  // bootstrap profile data
  let store = arc.stores.find(s => s.name === 'userid');
  if (store) {
    store.change(truth => truth.userid = tenant.persona);
  }
};

const createArc = async (tenant, id) => {
  // TODO(sjmiles): maybe runtime should own tenant:
  // - keeps tenant as a POJO
  // - keeps runtime as a class
  // - apis take runtimes
  const root = tenant.composer.root;
  tenant.root = root;
  const arcRoot = root.appendChild(document.createElement('div'));
  arcRoot.id = id;
  if (tenant.currentArc) {
    tenant.currentArc.composer.root.hidden = true;
  }
  const composer = new Composer(arcRoot);
  const arc = new Arc({id, name: 'arcname', composer});
  tenant.currentArc = arc;
  tenant.arcs[id] = arc;
  return arc;
};

