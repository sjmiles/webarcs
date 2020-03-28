/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Composer} from '../../lib/js/devices/dom/xen-dom-composer.js';
import {Arc} from '../../lib/js/core/arc.js';
import {initContext} from './context.js';

const app = async () => {
  const runtime = await initContext();
  const arc = new Arc({name: 'one', composer: new Composer(window.device)});
  await runtime.instantiate(arc, {
    // slot: Array
    root: [{
      // particle shorthand
      particle: 'Books'
    }, {
      // particle longhand
      particle: {
        // particle kinds are registered with runtime
        kind: 'TMDBSearch',
        // binds particle::query to arc::tmdbQuery
        query: 'tmdbQuery'
      }
    }, {
      particle: 'Scroller',
      // slot: Array
      content: [{
        particle: 'TMDBGrid'
      }]
    }, {
      particle: 'TMDBDetail'
    }]
  });
  arc.update();
};
app();
