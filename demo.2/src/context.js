/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Hub} from './hub.js';

export const Context = class {
  static registerParticle(name, src) {
    Hub.send({msg: 'register', name, src});
  }
};

// handles custom messages from the Hub
Context.dispatcher = {
  // no handlers
};

// initialize particle hub
Hub.init(Context.dispatcher);

