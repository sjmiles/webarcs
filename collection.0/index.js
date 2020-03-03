/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Automerge} from '../automerge.js';

let one = Automerge.change(Automerge.init(), doc => {
  doc.guitars = new Automerge.Table(['make', 'model', 'finish', 'pickups', 'bridge']);
  doc.guitars.add({make: 'Ernie Ball Music Man', model: 'Majesty 6', finish: 'Dark Tobacco', bridge: 'Floating'});
});

let two = Automerge.init();
two = Automerge.merge(two, one);

two = Automerge.change(two, doc => {
  doc.guitars.rows[0].pickups = 'stock';
  doc.guitars.add({make: 'Ibanez Custom Shop', finish: 'Forest', bridge: 'Floating'});
});

one = Automerge.merge(one, two);

console.log(JSON.stringify(one, null, '  '));
console.log(JSON.stringify(two, null, '  '));






