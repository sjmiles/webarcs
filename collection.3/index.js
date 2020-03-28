/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {makeId} from './utils.js';
import {Collection} from './database.js';
import {Device} from './device.js';

const makeReceiver = endpoint => {
  return msg => {
    const send = () => {
      if (endpoint.isOpen) {
        endpoint.receive(msg);
      }
      else {
        setTimeout(send, 100);
      }
    }
    send();
  };
};

const id = makeId();

let local = new Device();
local.db.create(id);

let remote = new Device();
remote.db.create(id);

const localConn = local.connect('local->remote');
const remoteConn = remote.connect('remote->local');

localConn.onsend = makeReceiver(remoteConn);
remoteConn.onsend = makeReceiver(localConn);

// localConn.open();
// remoteConn.open();

class ParticleA {
  static update({collection}) {
    collection.add({name: 'Alpha'});
    collection.add({name: 'Beta'});
  }
};

class ParticleB {
  static update({collection}) {
    collection.add({name: 'Gammer'});
    collection.add({name: 'Delter'});
  }
};

local.db.change(id, data => {
  ParticleA.update({collection: new Collection(data, 'collection')})
  data.num = 4;
});

remote.db.change(id, data => {
  ParticleB.update({collection: new Collection(data, 'collection')})
  data.num = 3;
});

//localConn.open();
//remoteConn.open();

local.db.change(id, data => {
  const c = new Collection(data, 'collection');
  let key = Object.keys(c.data)[0];
  c.data[key].name += `[updated]`;
  c.add({name: 'Omega'});
});
console.warn(`local(${id}): altered item 0, added new item`);

remote.db.change(id, data => {
  const c = new Collection(data, 'collection');
  let key = Object.keys(c.data)[0];
  delete c.data[key];
  key = Object.keys(c.data)[0];
  c.data[key].name += `[updated]`;
});
console.warn(`remote(${id}): removed item 0, modified item 1`);

localConn.open();
remoteConn.open();
