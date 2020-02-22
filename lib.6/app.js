/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Store} from './js/core/store.js';
import {Arc} from './js/core/arc.js';
import {Particle} from './js/core/particle.js';
import {Group} from './js/ergo/group.js';
import {irand, prob} from './js/core/utils.js';

import {Runtime} from './js/ergo/runtime.js';
import {Unbus} from './js/devices/unbus.js';
import {Bus} from './js/devices/bus.js';
import {WorkerHub} from './js/devices/worker/worker-hub.js';
import {Host} from './js/devices/host.js';
import {Composer} from './js/devices/dom/xen-dom-composer.js';

import {Noop} from './particles/Noop.js';
import {Recipes} from './particles/Recipes.js';
import {Sorter} from './particles/Sorter.js';
import {TMDBSearch} from './particles/TMDBSearch.js';
import {particle as TMDBGrid} from './particles/TMDBGrid.js';
import {TMDBDetail} from './particles/TMDBDetail.js';

import {particle as Books} from './particles/Books.js';

const runtime = new Runtime();

// simple main-thread particles
runtime.registerClass('Noop', Noop);
runtime.registerClass('Sorter', Sorter);
runtime.registerClass('TMDBSearch', TMDBSearch);
runtime.registerClass('TMDBDetail', TMDBDetail);

// factory for import particles
const createImportParticle = async (factory, id, container) => {
  const instance = new (factory({Particle}))();
  // TODO(sjmiles): need a host concept to own privileged particle data
  instance.id = container;
  instance.$container = container;
  return instance;
};

runtime.register('Books', async (id, container) => await createImportParticle(Books, id, container));
runtime.register('TMDBGrid', async (id, container) => await createImportParticle(TMDBGrid, id, container));

// factory for bus particles
const createHostedParticle = async (id, kind, container, bus) => {
  const host = new Host({id, container, bus});
  await host.createParticle(name, kind);
  return host;
};

// unbus particles
runtime.register('UnbusBooks', async (id, container) => await createHostedParticle(id, Recipes, container, new Unbus()));

// WorkerHub particles
WorkerHub.init();

const registerWorkerParticle = (name) => {
  WorkerHub.send({msg: 'register', name, src: `./particles.worker/${name}.js`});
  runtime.register(name, async (id, container) => await createHostedParticle(id, name, container, new Bus(WorkerHub)));
};

registerWorkerParticle('Info');
registerWorkerParticle('Container');

// create some stuff, see what happens

const truth = new Store('truth');
truth.change(doc => {
  doc.list = ['Alpha', 'Beta'];
});

const group = new Group('group', truth);

let arc;

arc = new Arc({name: 'one', composer: new Composer(window.device0)});
group.addArc(arc);
runtime.instantiate(arc, {
  root: [{
    particle: 'Sorter'
  }, {
    particle: 'Books'
  }, {
    particle: 'TMDBGrid'
  }]
});

arc = new Arc({name: 'two', composer: new Composer(window.device1)});
group.addArc(arc);
runtime.instantiate(arc, {
  root: [{
    particle: 'TMDBSearch'
  }, {
    particle: 'Container',
    content: [{
      particle: 'Info'
    }]
  }]
});

arc = new Arc({name: 'three', composer: new Composer(window.device2)});
group.addArc(arc);
runtime.instantiate(arc, {
  root: [{
    particle: 'UnbusBooks'
  }, {
    particle: 'TMDBDetail'
  }]
});

//

// TODO(sjmiles): need idle-state tracking
setTimeout(() => {
  group.status();
  group.sync();
}, 1000);

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

window.mutate.onclick = () => mutateRandomStore();
window.mutateN.onclick = () => mutateN(10);

window.arcs = {group};
