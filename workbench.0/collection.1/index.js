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
import {Automerge} from '../automerge.js';

const update = (doc, key, value) => Automerge.change(doc, root => root[key] = value);

const fix = doc => {
  Object.keys(doc).forEach(key => {
    const conflicts = Automerge.getConflicts(doc, key);
    Automerge.clearConflicts(doc, key);
    if (conflicts) {
      const value = Object.values(conflicts)[0];
      if (Array.isArray(value)) {
        console.log(`array conflict for [${key}]`, value, conflicts);
        doc = Automerge.change(doc, root => value.forEach(v => root[key].push(v)));
      } else if (typeof value === 'object') {
        console.log(`object conflict for [${key}]`, value, conflicts);
        doc = Automerge.change(doc, root => {
          const collection = root[key];
          Object.keys(value).forEach(id => collection[id] = {...value[id]});
        });
      }
    }
  });
  return doc;
};

const nerge = (one, two) => {
  one = Automerge.merge(one, two);
  one = fix(one);
  return one;
};

class Store {
  constructor() {
    this.truth = Automerge.init();
    this.old = this.truth;
  }
  change(mutator) {
    this.truth = Automerge.change(this.truth, mutator);
  }
  merge(remote) {
    this.truth = nerge(this.truth, remote);
  }
  log(preamble) {
    console.log(`${preamble||''}${JSON.stringify(this.truth, null, '  ')}`);
  }
  consumeChanges() {
    const changes = Automerge.getChanges(this.old, this.truth);
    this.old = this.truth;
    return changes;
  }
}

class Collection {
  constructor(data, name) {
    if (!data[name]) {
      data[name] = {};
    }
    this.data = data[name];
  }
  add(item) {
    this.data[makeId()] = item;
  }
}

class Connection {
  constructor() {
    this.docSet = new Automerge.DocSet();
    this.docSet.registerHandler((id, doc) => this.onchange(id, doc));
    this.connect = new Automerge.Connection(this.docSet, msg => this.send(msg));
  }
  open() {
    this.connect.open();
  }
  send(msg) {
    console.log(msg);
  }
  receive(msg) {
    this.connect.receiveMsg(msg);
    this.onreceive(msg);
  }
  onchange(id, doc) {
  }
  onreceive(msg) {
  }
}

let here = new Store();
let there = new Store();

const localConn = new Connection();
//localConn.docSet.setDoc('0000', here.truth);
localConn.onreceive = (msg) => {
  console.log('localConn::onreceive', msg);
  here.truth = fix(localConn.docSet.getDoc('0000'));
  here.log('here: ');
};
localConn.onchange = (id, doc) => {
  //here.truth = fix(localConn.docSet.getDoc('here'));
};
localConn.send = msg => {
  console.log('localConn::send', msg);
  remoteConn.receive(msg);
};

const remoteConn = new Connection();
//remoteConn.docSet.setDoc('0000', there.truth);
remoteConn.onreceive = (msg) => {
  console.log('remoteConn::onreceive', msg);
  there.truth = fix(remoteConn.docSet.getDoc('0000'));
  there.log('there: ');
};
remoteConn.onchange = (id, doc) => {
};
remoteConn.send = msg => {
  console.log('remoteConn::send', msg);
  localConn.receive(msg);
};

localConn.open();
remoteConn.open();

here.change(data => {
  const c = new Collection(data, 'collection');
  c.add({name: 'Alpha'});
  c.add({name: 'Beta'});
  data.num = 4;
});
localConn.docSet.setDoc('0000', here.truth);

there.change(data => {
  const c = new Collection(data, 'collection');
  c.add({name: 'Gammer'});
  c.add({name: 'Delter'});
  data.num = 3;
});
remoteConn.docSet.setDoc('0000', there.truth);

// const napply = (changes, there) => {
//   here.truth = Automerge.applyChanges(there.truth, changes);
//   here.truth = fix(here.truth);
//   return here;
// };

// const comm = (here, there) => {
//   here.log();
//   // changes from `here` arrive ...
//   const changes = here.consumeChanges();
//   // ... apply them to `there`
//   there = napply(changes, there);
//   there.log();
// };

// const comm2 = () => {
//   console.group('here -> there');
//   comm(here, there);
//   console.groupEnd();

//   //console.group('there -> here');
//   //comm(there, here);
//   //console.groupEnd();
// }

here.change(data => {
  const c = new Collection(data, 'collection');
  let key = Object.keys(c.data)[0];
  c.data[key].name += `[updated]`;
  c.add({name: 'Omega'});
});
localConn.docSet.setDoc('0000', here.truth);

there.change(data => {
  const c = new Collection(data, 'collection');
  let key = Object.keys(c.data)[0];
  delete c.data[key];
  key = Object.keys(c.data)[0];
  c.data[key].name += `[updated]`;
  //c.add({name: 'Omega'});
});
remoteConn.docSet.setDoc('0000', there.truth);

// //comm(here, there);
// //comm(there, here);
// comm2();
// //comm2();

window.localConn = localConn;
window.here = here;
window.there = there;
