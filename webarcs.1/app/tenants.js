/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

const specs = [{
  device: 'mobile',
  user: 'moe@simpsons.com',
  persona: 'moe',
  peers: {'carl:mobile':1}
}, {
  device: 'mobile',
  user: 'carl@simpsons.com',
  persona: 'carl',
  peers: {'moe:mobile':1, 'lenny:mobile':1}
}, {
  device: 'mobile',
  user: 'lenny@simpsons.com',
  persona: 'lenny',
  peers: {'carl:mobile':1}
}];

const tenants = specs.map(({persona, device, peers}) => ({
  deviceKind: device,
  persona,
  peers,
  id: `${persona}:${device}`,
  avataricon: `../assets/users/${persona}.png`,
  deviceicon: `../assets/devices/${device}.png`,
  // arcs here?
  arcs: {}
}));

/**/

import {Hub} from '../arcs/build/data/hub.js';
import {Database} from '../arcs/build/data/database.js';
import {Runtime} from '../arcs/build/ergo/runtime.js';
import {initContext} from './context.js';

const getTenant = id => tenants.find(d => d.id === id);

const processTenants = async () => {
  const mapTenantsFromPeers = peers => {
    return Object.keys(peers).map(peer => {
      return getTenant(peer);
    });
  };
  await Promise.all(tenants.map(async tenant => {
    // TODO(sjmiles): do we need all these objects?
    const runtime = new Runtime(tenant);
    tenant.runtime = runtime;
    tenant.context = new Database(`${tenant.id}:context`);
    // TODO(sjmiles): rename: registers Particle kinds with runtime
    await initContext(runtime);
    // convert tenant.peers (specs) into tenant.tenants (connections)
    tenant.tenants = mapTenantsFromPeers(tenant.peers);
    tenant.hub = new Hub(tenant);
  }));
};

const initTenants = async () => {
  await processTenants();
  return tenants;
};

export {initTenants};
