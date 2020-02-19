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
import {Arc} from './core/arc.js';
import {Particle} from './pec/particle.js';
import {Group} from './ergo/group.js';
import {Recipe} from './ergo/recipe.js';
import {TMDBSearch} from './particles/TMDBSearch.js';
import {irand, prob} from './core/utils.js';

const Sorter = class extends Particle {
  update({list}) {
    if (list) {
      const sorted = list.slice(0);
      sorted.sort().reverse();
      console.log('Sorter: sending output');
      this.output({sorted});
      // const sortedJSON = JSON.stringify(sorted);
      // this.output({sortedJSON});
    }
  }
};

const Noout = class extends Particle {
  update() {
  }
};

const Movies = class extends Particle {
  update() {
    const movies = ['Snails!', 'Dirt is my Friend', 'The Laundry Dilemma'];
    const moviesJSON = JSON.stringify(movies);
    this.output({moviesJSON});
  }
};

const truth = new Store('truth');
const group = new Group('group', truth);

let arc;
let p;

arc = new Arc('one');
group.addArc(arc);
Recipe.instantiate(arc, {
  root: [{
    particle: Sorter
  }, {
    particle: Movies
  }]
});

// arc = new Arc('two');
// group.addArc(arc);
// Recipe.instantiate(arc, {
//   root: [{
//   //   particle: TMDBSearch
//   // }, {
//     particle: Noout
//   }]
// });

// arc = new Arc('three');
// group.addArc(arc);
// Recipe.instantiate(arc, {
//   root: [{
//     particle: Movies
//   }]
// });

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
