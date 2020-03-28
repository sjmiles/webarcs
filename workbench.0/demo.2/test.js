/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Data} from './src/core/data.js';
import {irand, prob} from './src/core/utils.js';

// create persistance storage
const persist = new Data();

// stuff some data in there
persist.change(doc => {
  doc.list = ['Alpha', 'Beta', 'Gamma'];
});

const A = new Data();
A.merge(persist.truth);
console.log('A:', A.toString());

const B = new Data();
B.merge(persist.truth);
console.log('B:', B.toString());

console.log('mutating A');
A.change(doc => {
  doc.list.push('foo');
  //doc.list.splice(irand(doc.list.length), 1);
});
console.log('A:', A.toString());

console.log('mutating B');
B.change(doc => {
  //doc.list.push('foo');
  doc.list.splice(irand(doc.list.length), 1);
});
console.log('B:', B.toString());

let changes;

console.log('apply A to persist');
changes = A.changes;
persist.apply(changes);
console.log('persist:', persist.toString());

console.log('apply persist to B');
changes = persist.changes;
B.apply(changes);
console.log('B:', B.toString());

console.log('apply B to persist');
changes = B.changes;
persist.apply(changes);
console.log('persist:', persist.toString());

console.log('apply persist to A');
changes = persist.changes;
A.apply(changes);
console.log('A:', B.toString());

console.log('summary');
console.log('persist:', persist.toString());
console.log('A:', B.toString());
console.log('B:', B.toString());


