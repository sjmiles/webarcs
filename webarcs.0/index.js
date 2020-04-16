/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

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
// for debugging only
window.devices = devices;

const getDevice = id => devices.find(d => d.id === id);

// in theory, format above is easy to read/write; here we make it ready to consume

const tenants = specs.map(({persona, device, peers}) => ({
  id: `${persona}:${device}`,
  persona,
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
  selected.style.display = 'flex';
});

// arcs

const recipe = {
  // a recipe is an array of slots
  root: [{
    // a slot is an array of either particles or slots
    // `particle` is a keyword: conflicts? maybe use `$<keyword>`?
    // probably keywords should be symbols, but that seems bad for JSON
    particle: 'Frame',
    content: [{
      particle: 'Books'
    }]
  }, {
    particle: 'Frame',
    content: [{
      particle: {
        kind: 'Chat/ChatWrite',
        entries: 'entries',
        userid: 'userid'
      }
    },{
      particle: {
        kind: 'Chat/ChatList',
        entries: 'entries'
      }
    }]
  }, {
    particle: 'Frame',
    content: [{
      particle: {
        kind: 'TMDBSearch',
        query: 'tmdbQuery',
      }
    }, {
      particle: {
        kind: 'TMDBGrid',
        tmdbResults: 'tmdbResults'
      }
    }, {
      particle: {
        kind: 'TMDBDetail',
        tmdbSelection: 'tmdbSelection'
      }
    }]
  }]
};

const createArc = async (tenant, id, recipe) => {
  const {view, arcs, runtime} = tenant;
  // crete arc
  const composer = new Composer(view);
  const arc = new Arc({id, name: 'arcname', composer});
  // record it
  arcs[arc.id] = arc;
  // TODO(sjmiles): create stores after instantiating recipe for update effects
  // instantiate recipe
  await runtime.instantiate(arc, recipe);
};

const createTestArc = async (tenant, recipe) => {
  const id = `starter-arc`;
  await createArc(tenant, id, recipe);
  let store = tenant.arcs[id].stores.find(s => s.name === 'userid');
  store.change(truth => truth.userid = tenant.persona);
};

(async () => {
  await Promise.all(tenants.map(async tenant => {
    tenant.runtime = await initContext();
    // TODO(sjmiles): reconcile tenant.device, tenant.dev, tenant.runtime.device
    tenant.runtime.device = tenant.dev;
    //
    // const profile = new Store(`${tenant.dev.id}:store:profile`);
    // tenant.dev.context.add(profile);
    //
  }));
  //
  createTestArc(tenants[0], recipe);
  createTestArc(tenants[1], recipe);
})();
