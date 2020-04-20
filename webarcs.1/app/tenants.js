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
  user: 'moe@springfield.com',
  persona: 'moe',
  peers: ['edna:mobile', 'carl:mobile']
}, {
  device: 'mobile',
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
  peers: ['moe:mobile', 'edna:mobile']
}, {
  device: 'mobile',
  user: 'lenny@springfield.com',
  persona: 'lenny',
  peers: ['carl:mobile', 'edna:mobile']
}];

// expand specs into tenant objects
const tenants = specs.map(({persona, device, peers}) => ({
  deviceKind: device,
  persona,
  peers: peers.reduce((peers, peer) => (peers[peer] = true, peers), {}),
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
import {Composer} from '../arcs/build/platforms/dom/xen-dom-composer.js';

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
    const db = new Database(`${tenant.id}:context`);
    tenant.context = db;
    tenant.root = document.createElement('div');
    tenant.composer = new Composer(tenant.root);
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
