/**
 * @license
 * Copyright 2019 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Arc, Store} from './lib.js';

const synchronize = (store, arcs) => {
  arcs.forEach(arc => {
    store.apply(arc.changes);
  });
  const truth = store.changes;
  arcs.forEach(arc => {
    arc.apply(truth);
  });
};

const store = new Store(0);
store.change(doc => {
  doc.list = ['Alpha', 'Beta', 'Gamma']
});

const arc = new Arc();
arc.merge(store.truth);
const remoteArc = new Arc();
remoteArc.merge(store.truth);

arc.change(doc => {
  doc.name = 'Mundo';
  doc.list[1] = 'MEAT';
});
remoteArc.change(doc => {
  doc.name = 'Nadie';
  doc.list[1] = 'TEAM';
  doc.list.push('Delta');
});
synchronize(store, [arc, remoteArc]);
