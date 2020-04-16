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
import {initTenants} from './tenants.js';
import {recipes} from './recipe.js';

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
  const arc = new Arc({id, name: 'arcname', composer}); //: tenant.composer});
  tenant.currentArc = arc;
  tenant.arcs[id] = arc;
  return arc;
};

const selectArc = (tenant, id) => {
  const arc = tenant.arcs[id];
  if (arc) {
    if (tenant.currentArc) {
      tenant.currentArc.composer.root.hidden = true;
    }
    tenant.currentArc = arc;
    arc.composer.root.hidden = false;
  }
};

(async () => {
  // initialize tenants
  const tenants = await initTenants();
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
  //createTestArc(tenants[0], 'test-arc', recipe);
  //createTestArc(tenants[1], 'test-arc', recipe);
  // arcs
  createTestArc(tenants[0], 'chat', recipes.chat);
  createTestArc(tenants[0], 'tv', recipes.tv);
  selectArc(tenants[0], 'chat');
  //
  createTestArc(tenants[1], 'chat', recipes.chat);
})();
