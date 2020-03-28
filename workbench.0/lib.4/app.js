/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Store} from './core/store.js';
import {Composer} from './devices/dom-composer.js';
import {Arc} from './core/arc.js';
import {Group} from './ergo/group.js';
import {Recipe} from './ergo/recipe.js';
import {irand, prob} from './core/utils.js';

import {Noop} from './particles/Noop.js';
import {Books} from './particles/Books.js';
import {Sorter} from './particles/Sorter.js';
import {TMDBSearch} from './particles/TMDBSearch.js';
import {TMDBGrid} from './particles/TMDBGrid.js';

const truth = new Store('truth');
const group = new Group('group', truth);

let arc;

arc = new Arc({name: 'one', composer: new Composer(window.device0)});
group.addArc(arc);
Recipe.instantiate(arc, {
  root: [{
    particle: Sorter
  }, {
  //   particle: Books
  // }, {
    particle: TMDBGrid
  }]
});

arc = new Arc({name: 'two', composer: new Composer(window.device1)});
group.addArc(arc);
Recipe.instantiate(arc, {
  root: [{
    particle: TMDBSearch
  }, {
    particle: Noop
  }]
});

arc = new Arc({name: 'three', composer: new Composer(window.device2)});
group.addArc(arc);
Recipe.instantiate(arc, {
  root: [{
    particle: Books
  }]
});

group.status();

truth.change(doc => {
  doc.list = ['Alpha', 'Beta'];
});
group.sync();

//

const stores = group.arcs;

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
    doc.value = irand(900) + 100;
  });
  store.onchange(store);
};

const mutateRandomStore = () => {
  mutate(stores[irand(stores.length)]);
};

const mutateN = n => {
  for (let i=0; i<n; i++) {
    setTimeout(() => mutateRandomStore(), irand(500) + 40);
  }
};

//mutateN(15);

window.mutate.onclick = () => mutateRandomStore();
window.mutateN.onclick = () => mutateN(10);
