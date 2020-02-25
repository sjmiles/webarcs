/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

// import {Store} from '../../js/core/store.js';
// import {Group} from '../../js/ergo/group.js';
import {Composer} from '../../js/devices/dom/xen-dom-composer.js';
import {Arc} from '../../js/core/arc.js';
import {initContext} from '../context.js';

const app = async () => {
  const runtime = await initContext();

  const arc = new Arc({name: 'one', composer: new Composer(window.device)});
  await runtime.instantiate(arc, {
    root: [{
      particle: 'Books'
    }, {
      particle: {
        kind: 'TMDBSearch',
        query: 'tmdbQuery'
      }
    // }, {
    //   particle: 'Columns',
    //   left: [{
    //     particle: 'TMDBGrid'
    //   }],
    //   right: [{
    //     particle: 'TMDBDetail'
    //   }]
    }, {
      particle: 'Scroller',
      content: [{
        particle: 'TMDBGrid'
      }]
    }, {
      particle: 'TMDBDetail'
    }]
  });
  arc.update();

};

setTimeout(() => app(), 1000);
