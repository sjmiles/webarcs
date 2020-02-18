/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Context} from './src/ergo/context.js';
import {Recipe} from './src/ergo/recipe.js';
import {Group} from './src/ergo/group.js';
import {Arc} from './src/core/arc.js';
import {Data} from './src/core/data.js';
import {irand, prob} from './src/core/utils.js';

// register particles
Context.registerParticles({
  Container: './particles/Container.js',
  Info: './particles/Info.js',
  SortArray: './particles/SortArray.js',
  Restaurants: './particles/Restaurants.js',
  PlacesPhotos: './particles/PlacesPhotos.js',
  TMDBSearch: './particles/TMDBSearch.js'
});

// create persistance storage
const persist = new Data();

// stuff some data in there
persist.change(doc => {
  doc.list = ['Alpha', 'Beta', 'Gamma'];
  doc.sortedJson = '';
});

// create a data-synchronization group
const group = new Group(persist);

// create arcs
const spawn = (name, root, recipe) => {
  const arc = new Arc({name, root});
  group.addArc(arc);
  Recipe.instantiate(arc, recipe);
};

spawn('arc0', window.device0, {
  // [slot]: [particles: {[slot]:...}]
  root: [{
    particle: 'Container',
    content: [{
      particle: 'Info'
    }, {
      particle: 'TMDBSearch'
    }]
  }, {
    particle: 'SortArray'
  }]
});

spawn('arc1', window.device1, {
  root: [{
    particle: 'Info'
  }, {
     particle: 'Restaurants'
  }]
});

spawn('arc2', window.device2, {
  root: [{
    particle: 'Container',
    content: [{
      particle: 'Info'
    }],
  }, {
     particle: 'PlacesPhotos'
  }]
});

// data mutator for testing
const mutate = (arc) => {
  arc.change(doc => {
    // sometimes do nothing
    if (prob(0.9)) {
      // swizzle 'value'
      doc.value = irand(9e3) + 1e3;
      // maybe swizzle 'name'
      doc.name = prob(0.5) ? 'Mundo' : 'Nadie';
      // maybe remove an item
      if (prob(0.15)) {
        doc.list.splice(irand(doc.list.length), 1);
      }
      // maybe add an item
      if (prob(0.30)) {
        doc.list.push(['Delta', 'Epsilon', 'Iota'][irand(3)]);
      }
    } else {
      console.warn('NO MUTATIONS');
    }
  });
};

const mutateTimes = count => {
  count = count || 0;
  if (count-- > 0) {
    setTimeout(() => {
      const arc = group.arcs[irand(group.arcs.length)];
      mutate(arc);
      mutateTimes(count);
    }, irand(200, 40));
  }
};

// world's worst UI

const dumpTruth = window.dumpTruth = () => {
  window.truth.innerText = JSON.stringify(persist.truth, null, '  ');
};

window.test.onclick = () => mutateTimes(1);
window.testn.onclick = () => mutateTimes(15);
//window.sync.onclick = () => synchronize();
window.dump.onclick = () => dumpTruth();

window.sync.hidden = true;
window.arcs = {persist, group};

//setTimeout(() => mutateTimes(15), 300);

