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
import {Group} from './js/ergo/group.js';
import {irand, prob} from './js/core/utils.js';

import {Runtime} from './js/ergo/runtime.js';
import {Unbus} from './js/devices/unbus.js';
import {Bus} from './js/devices/bus.js';
import {WorkerHub} from './js/devices/worker/worker-hub.js';
import {Host} from './js/devices/host.js';
import {Composer} from './js/devices/dom/xen-dom-composer.js';

import {Noop} from './particles/Noop.js';
import {Books} from './particles/Books.js';
import {Sorter} from './particles/Sorter.js';
import {TMDBSearch} from './particles/TMDBSearch.js';
import {TMDBGrid} from './particles/TMDBGrid.js';
import {TMDBDetail} from './particles/TMDBDetail.js';

const runtime = new Runtime();

// simple main-thread particles
runtime.registerClass('Noop', Noop);
runtime.registerClass('Books', Books);
runtime.registerClass('Sorter', Sorter);
runtime.registerClass('TMDBSearch', TMDBSearch);
runtime.registerClass('TMDBGrid', TMDBGrid);
runtime.registerClass('TMDBDetail', TMDBDetail);

// factory for bus particles
const createHostedParticle = async (id, kind, container, bus) => {
  const host = new Host({id, container, bus});
  await host.createParticle(name, kind);
  return host;
};

// unbus particles
runtime.register('UnbusBooks', async (id, container) => await createHostedParticle(id, Books, container, new Unbus()));

// WorkerHub particles
WorkerHub.init();
WorkerHub.send({msg: 'register', name: 'Info', src: './particles.worker/Info.js'});
runtime.register('Info', async (id, container) => await createHostedParticle(id, 'Info', container, new Bus(WorkerHub)));
WorkerHub.send({msg: 'register', name: 'Container', src: './particles.worker/Container.js'});
runtime.register('Container', async (id, container) => await createHostedParticle(id, 'Container', container, new Bus(WorkerHub)));

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
    particle: 'UnbusBooks'
  }, {
    particle: 'TMDBGrid'
  }, {
    particle: 'TMDBDetail'
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
    particle: 'Books'
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
