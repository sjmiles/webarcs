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
import {Arc} from '../arcs/build/core/arc.js';
import {Composer/*, showSlots*/} from '../arcs/build/platforms/dom/xen-dom-composer.js';
import {Runtime} from '../arcs/build/ergo/runtime.js';
import {initCorpus} from './corpus.js';
import {initTenants} from './tenants.js';
import {Planner} from './planner.js';
import {recipes} from './recipes.js';

const specs = [{
  device: 'mobile',
  user: 'moe@springfield.com',
  persona: 'moe',
  peers: ['edna:desktop']
  //peers: ['edna:desktop', 'carl:mobile']
}, {
  device: 'desktop',
  user: 'edna@springfield.edu',
  persona: 'edna',
  peers: ['moe:mobile']
  //peers: ['moe:mobile', 'liz:mobile', 'lenny:mobile']
// }, {
//   device: 'mobile',
//   user: 'carl@springfield.com',
//   persona: 'carl',
//   peers: ['moe:mobile', 'lenny:mobile']
// }, {
//   device: 'mobile',
//   user: 'liz@springfield.edu',
//   persona: 'liz',
//   peers: ['moe:mobile', 'edna:desktop', 'frink:mobile']
// }, {
//   device: 'mobile',
//   user: 'lenny@springfield.com',
//   persona: 'lenny',
//   peers: ['carl:mobile', 'edna:desktop']
// }, {
//   device: 'mobile',
//   user: 'frink@labs.com',
//   persona: 'frink',
//   peers: ['frink:laptop', 'liz:mobile']
// }, {
//   device: 'laptop',
//   user: 'frink@labs.com',
//   persona: 'frink',
//   peers: ['frink:mobile']
}];

// ui objects
const {tenantsView, tenantPages} = window;

(async () => {
  // initialize particle corpus
  await initCorpus();
  // initialize tenants
  const tenants = await initTenants(specs);
  // for debugging only
  window.tenants = tenants;
  // tenant selector
  tenantsView.tenants = tenants;
  // tenant details
  tenantPages.tenants = tenants;
  // use selector to control tenant display
  tenantsView.addEventListener('selected', ({detail: tenant}) => {
    tenantPages.selected = tenant;
  });
  // arcs
  tenants.forEach(tenant => {
    // bootstrap profile data
    const id = Store.idFromMeta({
      arcid: `basic_profile`,
      name: 'profile',
      type: `BasicProfile`,
      tags: ['shared', 'volatile'],
      tenantid: tenant.id
    });
    if (tenant === tenants[0]) {
      const profile = tenant.runtime.createStore(id, tenant.id);
      // const profile = tenant.runtime.createStore(`${tenant.id}:profile`, {
      //   id: `${tenant.id}:profile:store`,
      //   type: `BasicProfile`,
      //   tags: ['shared'],
      //   value: tenant.id
      // });
      tenant.context.add(profile);
    }
    // restore arcs
    tenant.runtime.restoreArcMetas();
  });
  // planning
  tenants.forEach(tenant => {
    tenant.planner = new Planner(tenant);
    window.setInterval(() => tenant.planner.plan(), 500);
  });
  //
  // setTimeout(() => {
  //   showSlots();
  // }, 2000);
})();

const createTestArc = async (tenant, name, recipe) => {
  const arc = await createArc(tenant, name, recipe);
  // instantiate recipe
  await tenant.runtime.instantiate(arc, recipe);
  // bootstrap profile data
  // let store = arc.stores.find(s => s.name === 'userid');
  // if (store) {
  //   store.change(truth => truth.userid = tenant.persona);
  // }
  arc.updateHosts();
  return arc;
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
  const composer = new Composer(arcRoot);
  const arc = new Arc({id, name: 'arcname', composer});
  tenant.runtime.addArc(arc);
  tenant.currentArc = arc;
  return arc;
};

Runtime.prototype.createTestArc = function(recipe) {
  const map = {'school-chat': 'chat', 'lab-chat': 'chat', 'book-club': 'book_club'};
  createTestArc(this.tenant, recipe, recipes[map[recipe] || recipe]);
  tenantPages._invalidate();
};
