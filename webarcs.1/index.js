/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Database} from './arcs/build/data/database.js';
import {Runtime} from './arcs/build/ergo/runtime.js';
import {initTenants} from './app/tenants.js';
import {recipe} from './app/arcs.js';
import {createArc} from './app/arcs.js';
import {initContext} from './app/context.js';

(async () => {
  // initialize tenants
  const tenants = await initTenants();
  // for debugging only
  window.tenants = tenants;
  // populate ui
  const {tenantsView, tenantPages} = window;
  // tenant selector
  tenantsView.tenants = tenants;
  // UI for each tenant
  tenantPages.tenants = tenants;
  // use selector to control tenant display
  tenantsView.addEventListener('selected', ({detail: tenant}) => {
    tenantPages.selected = tenant;
  });
  // arcs
  await Promise.all(tenants.map(async tenant => {
    // TODO(sjmiles): do we need all these objects?
    const runtime = new Runtime(tenant);
    tenant.runtime = runtime;
    tenant.context = new Database(`${tenant.id}:context`);
    // TODO(sjmiles): rename: registers Particle kinds with runtime
    await initContext(runtime);
  }));
  createTestArc(tenants[0], recipe);
  createTestArc(tenants[1], recipe);
})();

const createTestArc = async (tenant, recipe) => {
  const id = `starter-arc`;
  const arc = await createArc(tenant, id, recipe);
  // instantiate recipe
  await tenant.runtime.instantiate(arc, recipe);
  // TODO(sjmiles): create stores after instantiating recipe for update effects
  let store = arc.stores.find(s => s.name === 'userid');
  store.change(truth => truth.userid = tenant.persona);
};
