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
import {initTenants} from './tenants.js';
import {recipes} from './recipes.js';

(async () => {
   // initialize particle corpus
  await initCorpus();
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
  // moe
  createTestArc(tenants[0], 'book-club', recipes.book_club);
  createTestArc(tenants[0], 'tv', recipes.tv);
  // edna
  createTestArc(tenants[1], 'book-club', recipes.book_club);
  createTestArc(tenants[1], 'chat', recipes.chat);
  // carl
  createTestArc(tenants[2], 'tv', recipes.tv);
  // liz
  createTestArc(tenants[3], 'chat', recipes.chat);
  // lenny
  createTestArc(tenants[4], 'book-club', recipes.book_club);
  createTestArc(tenants[4], 'tv', recipes.tv);
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

