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
import {logFactory} from '../../lib/js/utils/log.js';

const log = logFactory(true, 'app', 'magenta');

window.deviceIdElt.innerText = deviceId;

const recipe = {
  // a recipe is an array of slots
  root: [{
    // a slot is an array of either particles or slots
    // `particle` is a keyword: conflicts? maybe use `$<keyword>`?
    // probably keywords should be symbols, but that seems bad for JSON
    particle: 'Books'
  }, {
    particle: {
      // `kind` is a keyword: conflicts? maybe use `$<keyword>`?
      kind: 'TMDBSearch',
      // bind `particle::query` to `arc::tmdbQuery`
      query: 'tmdbQuery',
      tmdbResults: {
        //private: true,
        collection: true
      }
    }
  }, {
    particle: 'Scroller',
    content: [{
      particle: {
        kind: 'TMDBGrid',
        tmdbResults: 'tmdbResults'
      }
    }]
  }, {
    particle: {
      kind: 'TMDBDetail',
      tmdbSelection: 'tmdbSelection'
    }
  }]
};

const app = async () => {
  log(`DEVICE is ${deviceId}`);
  Comms.init(deviceId)
  const runtime = await initContext();
  const arc = new Arc({id: 'multi-arc', name: 'one', composer: new Composer(window.device)});
  const docsChanged = () => {
    const corpus = Object.keys(arc.stores).map(name => ({name, truth: arc.stores[name].truth}));
    dump.innerHTML = JSON.stringify(corpus, null, 2);
    arc.update();
  };
  // if the arc changes, update the docSet
  arc.onchange = () => {
    log('arc::onchange', arc.id);
    Comms.docSet.setDoc(arc.stores.public.id, arc.stores.public.truth);
    //Comms.docSet.setDoc(arc.stores.private.id, arc.stores.private.truth);
    docsChanged();
  };
  // if the docSet changes, update the arc
  Comms.ondocsetchange = (docSet, docId, doc) => {
    log('ondocsetchange');
    if (docId === arc.stores.public.id) {
      log('arc public doc changed at docSet', docId);
      arc.stores.public.truth = doc;
      docsChanged();
    }
  };
  // instantiate our one recipe
  await runtime.instantiate(arc, recipe);
  // kick things off (?)
  arc.update();
};

app();
