/**
 * @license
 * Copyright 2019 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Arc, Particle, Store} from './lib.js';

const irand = (range, min) => Math.floor(Math.random() * range) + (min || 0);
const prob = probability => Boolean(Math.random() < probability);

const persist = new Store(0);
persist.change(doc => {
  doc.list = ['Alpha', 'Beta', 'Gamma'];
});

export class AParticle extends Particle {
  constructor(name) {
    super();
    this.name = name;
  }
  get template() {
    return Particle.html`
      <div style="padding: 8px;">
        Hola <b>{{name}}</b>
        <div>{{list}}</div>
        <div>{{value}}</div>
      </div>
    `;
  }
  render({name, list, value}, /*state*/) {
    return {
      name,
      list: JSON.stringify(list),
      value
    };
  }
}

const arc0 = new Arc(persist);
arc0.addParticle(new AParticle('particle0'));

const arc1 = new Arc(persist);
arc1.addParticle(new AParticle('particle1'));

const update = (arc) => {
  arc.change(doc => {
    doc.value = irand(9000, 1000);
    doc.name = prob(0.5) ? 'Mundo' : 'Nadie';
    if (prob(0.1)) {
      doc.list.slice(1);
    } else if (prob(0.1)) {
      doc.list.push(['Delta', 'Epsilon', 'Iota'][irand(3)]);
    }
  });
};

const test = (iteration) => {
  iteration = iteration || 0;
  if (iteration++ < 25) {
    setTimeout(() => {
      update(prob(0.5) ? arc0 : arc1);
      test(iteration);
    }, irand(200, 40));
  } else {
    setTimeout(() => sync(), 200);
  }
};

// const synchronize = (store, arcs) => {
//   arcs.forEach(arc => {
//     store.apply(arc.changes);
//   });
//   const truth = store.changes;
//   arcs.forEach(arc => {
//     arc.apply(truth);
//   });
// };

const sync = () => {
  persist.synchronize([arc0, arc1]);
};

window.test.onclick = () => test();
window.sync.onclick = () => sync();

test();
sync();
