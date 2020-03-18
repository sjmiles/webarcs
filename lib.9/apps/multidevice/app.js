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
import {deviceId} from '../../lib/connect/device.js';
import {Comms} from './comms.js';

window.deviceIdElt.innerText = deviceId;

const recipe = {
  // slot: Array
  root: [{
    // particle: String (shorthand)
    particle: 'Books'
  }, {
    // particle: Object (longhand)
    particle: {
      // particle kinds are registered with runtime
      kind: 'TMDBSearch',
      // binds particle::query to arc::tmdbQuery
      query: 'tmdbQuery'
    }
  }, {
    particle: 'Scroller',
    content: [{
      particle: 'TMDBGrid'
    }]
  }, {
    particle: 'TMDBDetail'
  }]
};

const app = async () => {
  console.log(deviceId);
  Comms.init(deviceId)
  //
  const runtime = await initContext();
  const arc = new Arc({id: 'multi-arc', name: 'one', composer: new Composer(window.device)});
  // if the arc changes, update the docSet
  arc.onchange = () => {
    arc.update();
    Comms.docSet.setDoc(arc.id, arc.truth);
  };
  // if the docSet changes, update the arc
  Comms.ondocsetchange = (docSet, docId, doc) => {
    if (docId === arc.id) {
      console.log('arc doc changed at docSet', docId)
      arc.truth = doc;
      arc.update();
    }
  };
  //
  await runtime.instantiate(arc,recipe);
  arc.update();
};

app();
