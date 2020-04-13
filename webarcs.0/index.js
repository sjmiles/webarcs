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

import {Composer} from './arcs/js/devices/dom/xen-dom-composer.js';
import {Arc} from './arcs/js/core/arc.js';
import {initContext} from './context.js';

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
  dev: getDevice(`${persona}:${device}`),
  arcs: Object.create(null)
}));
// for debugging only
window.tenants = tenants;

const mapTentantsFromPeers = peers => {
  return Object.keys(peers).map(peer => {
    return getTenant(peer);
  });
};
const getTenant = id => tenants.find(d => d.id === id);
tenants.forEach(tenant => {
  tenant.tenants = mapTentantsFromPeers(tenant.peers);
});

const {tenantsView, tenantViews} = window;

tenants.forEach(tenant => {
  tenant.view = tenantViews.appendChild(document.createElement('tenant-view'));
  tenant.view.tenant = tenant;
});

tenantsView.tenants = tenants;

let selected;
tenantsView.addEventListener('select', ({detail: tenant}) => {
  if (selected && selected !== tenant) {
    selected.style.display = '';
  }
  selected = tenant.view;
  selected.style.display = 'block';
});

// arcs

const recipe = {
  // a recipe is an array of slots
  root: [{
    // a slot is an array of either particles or slots
    // `particle` is a keyword: conflicts? maybe use `$<keyword>`?
    // probably keywords should be symbols, but that seems bad for JSON
  //   particle: 'Frame',
  //   content: [{
  //     particle: 'Books'
  //   }]
  // }, {
    particle: 'Frame',
    content: [{
      particle: {
        kind: 'Chat/ChatWrite',
        entries: 'entries'
      }
    },{
      particle: {
        kind: 'Chat/ChatList',
        entries: 'entries'
      }
    }]
  }, {
    particle: {
      // `kind` is a keyword: conflicts? maybe use `$<keyword>`?
      kind: 'TMDBSearch',
  //     // bind `particle::query` to `arc::tmdbQuery`
  //     query: 'tmdbQuery',
  //     tmdbResults: {
  //       //private: true,
  //       collection: true
  //     }
      }
    }, {
  //   // particle: 'Frame',
  //   // content: [{
      particle: {
        kind: 'TMDBGrid',
        tmdbResults: 'tmdbResults'
      }
    // }]
  // }, {
  //   particle: {
  //     kind: 'TMDBDetail',
  //     tmdbSelection: 'tmdbSelection'
  //   }
  }]
};

const buildArcStore = (arc, name, device) => {
  // create a store
  const store = new Store(`${arc.id}:store:${name}`);
  store.name = name;
  // store changes cause host updates
  store.listen('set-truth', () => {
    arc.updateHosts(store.pojo);
  });
  // initialize data
  store.change(data => data[name] = {});
  // add to context
  device.context.add(store);
  return store;
};

(async () => {
  const runtime = await initContext();
  await createmArc(runtime, tenants[0]);
  await createmArc(runtime, tenants[1]);
})();

const createmArc = async (runtime, tenant) => {
  const device = tenant.dev;
  // crete arc
  const composer = new Composer(tenant.view);
  const arc = new Arc({id: 'starter-arc', name: 'arcname', composer});
  tenant.arcs[arc.id] = arc;
  // TODO(sjmiles): create stores after instantiating recipe for update effects
  // instantiate recipe
  await runtime.instantiate(arc, recipe);
  // create stores
  arc.stores.push(buildArcStore(arc, 'tmdbResults', device));
  arc.stores.push(buildArcStore(arc, 'entries', device));
};
