/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Particle} from '../core/particle.js';

export const Sorter = class extends Particle {
  update({list}) {
    if (list) {
      const sorted = list.slice(0);
      sorted.sort().reverse();
      this.output({sorted});
    }
  }
};
