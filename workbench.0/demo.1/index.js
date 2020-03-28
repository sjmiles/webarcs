/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Arc, Store} from './arc.js';
import './particles.js';

const irand = (range, min) => Math.floor(Math.random() * range) + (min || 0);
const prob = probability => Boolean(Math.random() < probability);

const persist = new Store(0);
persist.change(doc => {
  doc.list = ['Alpha', 'Beta', 'Gamma'];
  doc.sorted = '';
});

const instantiateRecipe = (arc, recipe, container) => {
  Object.keys(recipe).forEach(key => {
    if (key === 'kind') {
      console.log(`adding ${recipe.kind} particle`);
      arc.addParticle('x', container, recipe[key]);
    } else {
      console.log(`populating [${key}]...`);
      recipe[key].forEach(r => instantiateRecipe(arc, r, key));
    }
  });
};

const arc0 = new Arc(window.device0, persist);
instantiateRecipe(arc0, {
  root: [{
    kind: 'Container',
    content: [{
      kind: 'Info'
    }]
  }, {
    kind: 'SortArray'
  }]
});

const arc1 = new Arc(window.device1, persist);
arc1.addParticle('A', 'root', 'Info');

const update = (arc) => {
  arc.change(doc => {
    doc.value = irand(9000, 1000);
    doc.name = prob(0.5) ? 'Mundo' : 'Nadie';
    if (prob(0.05)) {
      doc.list.splice(irand(doc.list.length), 1);
    }
    if (prob(0.1)) {
      doc.list.push(['Delta', 'Epsilon', 'Iota'][irand(3)]);
    }
  });
};

const test = (iteration) => {
  iteration = iteration || 0;
  if (iteration-- >= 0) {
    setTimeout(() => {
      update(prob(0.5) ? arc0 : arc1);
      test(iteration);
    }, irand(200, 40));
  } else {
    //setTimeout(() => sync(), 300);
  }
};

const sync = () => {
  persist.synchronize([arc0, arc1]);
};

window.test.onclick = () => test(25);
window.sync.onclick = () => sync();

window.dispatchEvent = EventTarget.prototype.dispatchEvent = function(event) {
  console.log(event.type);
};

window.persist = persist;
window.stuff = {persist, arc0, arc1};

test(25);
