/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Host} from '../core/host.js';

export const Runtime = class {
  constructor({hub, composerClass}) {
    this.hub = hub;
    this.composerClass = composerClass;
  }
  async createParticle(id, name, kind, container) {
    const host = new Host({id, container, bus: this.bus});
    await host.createParticle(name, kind);
    return host;
  }
};
