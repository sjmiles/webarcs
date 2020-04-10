
/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

//import {Database} from './core/database.js';
import {Store} from './core/store.js';
//import {Persona} from './core/persona.js';
//import {Device} from './core/device.js';
import {makeId} from './core/ids.js';

export function createProfileArc(persona) {
  const id = `${persona.id}:${makeId()}`;
  const store = new Store(`${id}:profile`);
  store.change(doc => {
    doc.id = id;
  });
  persona.stores.add(store);
  const meta = createArcMeta({id, stores: [store.id], shares:['larry'], sporks: persona.sporks});
  persona.arcs.add(meta);
  // const arc = {
  //   meta,
  //   stores: [store]
  // };
  // return arc;
}

export function createBankArc(persona) {
  const id = `${persona.id}:${makeId()}:bank`;
  const store = new Store(id);
  store.change(doc => {
    doc.id = id;
  });
  persona.stores.add(store);
  const meta = createArcMeta({id, stores: [store.id], sporks: persona.sporks});
  persona.arcs.add(meta);
}

function createArcMeta({id, shares, stores}) { //}, sporks}) {
  const meta = new Store(`${id}:meta`);
  meta.change(doc => {
    doc.arcId = id;
    doc.shares = shares || [];
    doc.stores = stores || [];
  });
  // sporks.change(doc => {
  //   doc.arcId = id;
  //   doc.shares = shares || [];
  //   doc.stores = stores || [];
  // });
  return meta;
}
