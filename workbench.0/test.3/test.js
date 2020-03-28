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
import {Xen} from '../xen/xen-async.js';
export const debounce = Xen.debounce;

const irand = n => Math.floor(Math.random() * n);
const prob = p => Math.random() < p;

const Store = class {
  constructor(name) {
    this.name = name;
    this.truth = Automerge.init();
    this.old = this.truth;
  }
  toString() {
    return JSON.stringify(this.truth);
  }
  setTruth(truth) {
    this.truth = truth;
    this.update();
  }
  change(mutator) {
    this.truth = Automerge.change(this.truth, mutator);
  }
  apply(changes) {
    this.setTruth(Automerge.applyChanges(this.truth, changes));
  }
  consumeChanges() {
    const changes = Automerge.getChanges(this.old, this.truth);
    this.old = this.truth;
    return changes;
  }
  update() {
    update(this);
  }
};

let changed = [];
const onchange = initiator => {
  if (!changed.includes(initiator)) {
    changed.push(initiator);
    console.log('debouncing changes', changed.length);
    onchange.debounce = debounce(onchange.debounce, () => processChanged(), 100);
  }
};

const processChanged = () => {
  console.log('--- processing changes ---');
  const local = changed;
  changed = [];
  let updated = false;
  local.forEach(store => {
    const changes = store.consumeChanges();
    if (changes.length) {
      console.log('updating truth with changes from:', store.name);
      truth.apply(changes);
      status();
      updated = true;
    } else {
      console.log('no-op changes found in:', store.name);
    }
  });
  if (updated) {
    sync();
  }
};

// fake async particle processing

const delay = (store, mutator, delay) => {
  const update = () => {
    console.log('particle updating', store.name);
    store.change(mutator);
    onchange(store);
  }
  setTimeout(() => update(), delay);
};

const update = store => {
  switch (store.name) {
    case 'A':
      delay(store, Sorted, irand(400) + 50);
      break;
    case 'B':
      delay(store, Places, 1000);
      break;
    case 'C':
      delay(store, Noop, 100);
      delay(store, Noop, 100);
      break;
  }
};

const Sorted = doc => {
  const foo = doc.list.slice(0);
  foo.sort();
  doc.sortedJSON = JSON.stringify(foo);
};

const Places = doc => {
  doc.placesJSON = JSON.stringify(['A', 'B', 'C']);
};

const Noop = doc => {
};

// test

const truth =  new Store('truth');
const stores = ['A', 'B', 'C'].map(name => new Store(name));

const status = () => {
  console.group('status');
  console.log('truth', truth.toString());
  stores.forEach(s => console.log(s.name, s.toString()));
  console.groupEnd();
}
status();

const status2 = () => {
  const tj = truth.toString();
  console.log(
    stores.map(s => `${s.name}: ${tj === s.toString() ? 'true' : 'FALSE'}`)
    .join('; ')
  );
};
status2();

const sync = () => {
  const changes = truth.consumeChanges();
  stores.forEach(s => s.apply(changes));
  status();
  status2();
};

truth.change(doc => {
  doc.list = ['Alpha', 'Beta'];
});
sync();

const mutate = store => {
  console.log('mutating store', store.name);
  store.change(doc => {
    if (prob(0.51)) {
      doc.list.push(['foo', 'bar', 'zot'][irand(3)]);
    } else {
      if (doc.list.length) {
        doc.list.splice(0, 1);
      }
    }
    doc.value = Math.random();
  });
  onchange(store);
};

const mutateRandomStore = () => {
  mutate(stores[irand(stores.length)]);
};

const mutateN = n => {
  for (let i=0; i<n; i++) {
    mutateRandomStore();
  }
};

//mutateN(15);

window.mutate.onclick = () => mutateRandomStore();
window.mutateN.onclick = () => mutateN(10);
