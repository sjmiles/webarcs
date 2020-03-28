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

const update = (doc, key, value) => Automerge.change(doc, root => root[key] = value);

const fix1 = () => {
  Object.keys(one).forEach(key => {
    const key1 = Automerge.getObjectId(one[key]);
    const key2 = Automerge.getObjectId(two[key]);
    // key1 !== key2 is the wrong test
    if (key1 && key2 && key1 !== key2) {
      console.log(`${key} is in conflict`);
      const merged = one[key].concat(two[key]);
      one = update(one, key, merged);
      two = update(two, key, merged);
    }
  });
};

const fix = (doc) => {
  Object.keys(doc).forEach(key => {
    const conflicts = Automerge.getConflicts(doc, key);
    Automerge.clearConflicts(doc, key);
    if (conflicts) {
      const value = Object.values(conflicts)[0];
      if (Array.isArray(value)) {
        console.log(key, value, conflicts);
        doc = Automerge.change(doc, root => value.forEach(v => root[key].push(v)));
      } else if (typeof value === 'object') {
        console.log(key, value, conflicts);
        doc = Automerge.change(doc, root => Object.keys(value).forEach(prop => root[key][prop] = value[prop]));
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

let one, two;

one = Automerge.init();
two = Automerge.init();
one = Automerge.change(one, doc => {
  doc.flams = [];
  doc.flams.push('a', 'b', 'c');
  doc.shlob = {x: 3};
  doc.num = 4;
});
two = Automerge.change(two, doc => {
  doc.flams = [];
  doc.flams.push('d', 'e', 'f');
  doc.shlob = {y: 4};
  doc.sput = '3532532';
  doc.num = 32;
});

const one_ = nerge(one, two);
const two_ = nerge(two, one);

// const conflicts = Automerge.getConflicts(one_, 'flams');
// console.log(conflicts);

one = one_;
two = two_;

console.log(JSON.stringify(one, null, '  '));
console.log(JSON.stringify(two, null, '  '));
console.log(one, two);

console.log('');

//const test = nerge(one, two);
const test = Automerge.merge(one, two);
console.log(JSON.stringify(test, null, '  '));

