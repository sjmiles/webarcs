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
// for debugging only
window.devices = devices;

// mock up an arc store

const createMockStore = () => {
  const n = Math.floor(Math.random() * 10);
  const store = new Store(`mock-arc-store-${n}`);
  store.change(data => {
    data['01-01'] = {name: `foo-${n}`};
    data['01-02'] = {name: `bar-${n}`};
  });
  return store;
};

// build visualizer ui

import {HubView} from './ui/hub-view.js';
window.customElements.define('hub-view', HubView);

devices.forEach(({hub}) => {
  document.body.appendChild(document.createElement('hub-view')).hub = hub;
});

// create a mock Arc store
devices[0].context.add(createMockStore());
devices[2].context.add(createMockStore());
