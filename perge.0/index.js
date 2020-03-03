/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Perge} from './perge.js';
//import * as Stuff from 'https://cdn.jsdelivr.net/npm/perge@0.1.2/dist/index.umd.js';
//console.log(Stuff);
//const {perge: Perge, Automerge: {change}} = window;
const change = window.Automerge.change;

const params = (new URL(document.location)).searchParams;
let id = 'my-peer-one';
let other = 'my-peer-two';
if (params.get('two')) {
  id = 'my-peer-two';
  other = 'my-peer-one';
}
console.log(id);

// instantiate library
const perge = new Perge(id);

// connect to a peer
perge.connect(other);

// subscribe to all docset changes
perge.subscribe((docId, doc) => {
  // logs 'some-document-id', { message: 'Hey!' }
  console.log(docId, doc);
});

// subscribe to a single doc's changes
const unsubscribe = perge.subscribe('some-document-id', doc => {
    // { message: 'Hey!' }
  console.log(doc);
  // unsubscribe this callback
  unsubscribe();
});

// select and change documents
if (id === 'my-peer-two') {
  perge.select('some-document-id')(
    change,
    doc => {
      doc.message = 'Hey!';
    }
  );
}
