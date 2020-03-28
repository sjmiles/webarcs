/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Store} from '../../lib/js/core/store.js';
import {Arc} from '../../lib/js/core/arc.js';
import {irand, prob} from '../../lib/js/utils/utils.js';
import {Composer} from '../../lib/js/devices/dom/xen-dom-composer.js';
import {Group} from '../../lib/js/ergo/group.js';
import {initContext} from '../context.js';

const app = async () => {

const runtime = await initContext();

// create some stuff, see what happens

const truth = new Store('truth');
truth.change(doc => {
  doc.list = ['Alpha', 'Beta'];
});

const group = new Group('group', truth);

let arc;

arc = new Arc({name: 'one', composer: new Composer(window.device0)});
group.addArc(arc);
await runtime.instantiate(arc, {
  root: [{
    particle: 'Sorter'
  }, {
    particle: 'Books'
  }, {
    particle: 'Noop'
  }, {
    particle: 'TMDBGrid'
  }]
});

arc = new Arc({name: 'two', composer: new Composer(window.device1)});
group.addArc(arc);
await runtime.instantiate(arc, {
  root: [{
    particle: 'TMDBSearch'
  }, {
    particle: 'Container',
    content: [{
      particle: 'Info',
    }, {
      particle: 'Realms.Books'
    }]
  }]
});

arc = new Arc({name: 'three', composer: new Composer(window.device2)});
group.addArc(arc);
await runtime.instantiate(arc, {
  root: [{
    particle: 'UnbusRecipes'
  }, {
    particle: 'TMDBDetail'
  }]
});

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

window.mutate.onclick = () => mutateRandomStore();
window.mutateN.onclick = () => mutateN(10);

window.arcs = {group};

group.status();
group.sync();

};
app();
