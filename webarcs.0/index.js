/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Store} from './core/store.js';
import {Hub} from './connection/hub.js';
import {Device} from './core/device.js';
import './ui/ui.js';

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

const devices = specs.map(spec => {
  const device = new Device(spec);
  device.hub = new Hub(device);
  return device;
});

const getDevice = id => devices.find(d => d.id === id);

// for debugging only
window.devices = devices;

// in theory, format above is easy to read/write; here we make it ready to consume

const tenants = specs.map(({persona, device, peers}) => ({
  id: `${persona}:${device}`,
  avatar: `../assets/users/${persona}.png`,
  device: `../assets/devices/${device}.png`,
  peers,
  dev: getDevice(`${persona}:${device}`)
}));

const getTenant = id => tenants.find(d => d.id === id);

const adaptInnerPeers = peers => {
  return Object.keys(peers).map(peer => {
    return getTenant(peer);
  });
};

tenants.forEach(tenant => {
  tenant.peers = adaptInnerPeers(tenant.peers);
});

// for debugging only
window.tenants = tenants;

const {peersView, peerView} = window;
peersView.peers = tenants;
peersView.addEventListener('select', ({detail: peer}) => {
  peerView.peer = peer;
});

// mock up arc stores

const createMockStore = () => {
  const n = Math.floor(Math.random() * 10);
  const store = new Store(`mock-arc-store-${n}`);
  store.change(data => {
    data['01-01'] = {name: `foo-${n}`};
    data['01-02'] = {name: `bar-${n}`};
  });
  return store;
};

devices[0].context.add(createMockStore());
devices[2].context.add(createMockStore());
