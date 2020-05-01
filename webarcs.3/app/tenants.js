/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Hub} from '../arcs/build/net/hub.js';
import {Database} from '../arcs/build/data/database.js';
import {Runtime} from '../arcs/build/ergo/runtime.js';
import {Composer} from '../arcs/build/platforms/dom/xen-dom-composer.js';

const enableNetwork = true;

let tenants;

export const initTenants = async (specs) => {
  tenants = specsToTenants(specs);
  await processTenants();
  return tenants;
};

export const getTenant = id => tenants.find(d => d.id === id);

// expand specs into tenant objects
const specsToTenants = specs => specs.map(({persona, device, peers}) => ({
  deviceKind: device,
  persona,
  peers: peers.reduce((peers, peer) => (peers[peer] = true, peers), {}),
  id: `${persona}:${device}`,
  avataricon: `../assets/users/${persona}.png`,
  deviceicon: `../assets/devices/${device}.png`,
  // arcs here?
  arcs: {}
}));

const processTenants = async () => {
  const mapTenantsFromPeers = peers => {
    return Object.keys(peers).map(peer => {
      return getTenant(peer);
    });
  };
  await Promise.all(tenants.map(async tenant => {
    // TODO(sjmiles): do we need all these objects?
    // Runtime
    const runtime = new Runtime(tenant);
    tenant.runtime = runtime;
    // Database (context)
    const db = new Database(`${tenant.id}:context`);
    tenant.context = db;
    // UI Surface
    tenant.root = document.createElement('div');
    tenant.composer = new Composer(tenant.root);
    if (enableNetwork) {
      // Network
      // convert tenant.peers (specs) into tenant.tenants (connections)
      tenant.tenants = mapTenantsFromPeers(tenant.peers);
      tenant.hub = new Hub(tenant);
    }
  }));
};
