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

const initUi = (tenants) => {
  // tenant selector
  tenantsView.tenants = tenants;
  // tenant pages
  tenantPages.tenants = tenants;
  // connect selector to pages
  tenantsView.addEventListener('selected', ({detail: tenant}) => {
    tenantPages.selected = tenant;
  });
};

const initContext = (tenants) => {
  tenants.forEach(tenant => {
    // bootstrap profile data
    const id = Store.idFromMeta({
      arcid: `basic_profile`,
      name: 'profile',
      type: `BasicProfile`,
      tags: ['shared', 'volatile'],
      tenantid: tenant.id
    });
    const profile = tenant.runtime.createStore(id, tenant.persona);
    tenant.context.add(profile);
    // restore arcs
    tenant.runtime.restoreArcMetas();
  });
};

const initPlanner = (tenants) => {
  tenants.forEach(tenant => {
    tenant.planner = new Planner(tenant);
    window.setInterval(() => tenant.planner.plan(), 500);
  });
};

const createRecipeArc = async (tenant, name, recipe) => {
  const arc = await createArc(tenant, name, recipe);
  // instantiate recipe
  await tenant.runtime.instantiate(arc, recipe);
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

Runtime.prototype.createRecipeArc = function(recipe) {
  const map = {'school-chat': 'chat', 'lab-chat': 'chat', 'book-club': 'book_club'};
  createRecipeArc(this.tenant, recipe, recipes[map[recipe] || recipe]);
  tenantPages._invalidate();
};
