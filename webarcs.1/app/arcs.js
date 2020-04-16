/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Arc} from '../arcs/build/core/arc.js';
import {Composer} from '../arcs/build/platforms/dom/xen-dom-composer.js';

export const recipe = {
  // a recipe is an array of slots
  root: [{
    // a slot is an array of either particles or slots
    // `particle` is a keyword: conflicts? maybe use `$<keyword>`?
    // probably keywords should be symbols, but that seems bad for JSON
    particle: 'Frame',
    content: [{
      particle: 'Books'
    }]
  }, {
    particle: 'Frame',
    content: [{
      particle: {
        kind: 'Chat/ChatWrite',
        entries: 'entries',
        userid: {
          share: false
        }
      }
    },{
      particle: {
        kind: 'Chat/ChatList',
        entries: 'entries'
      }
    }]
  }, {
    particle: 'Frame',
    content: [{
      particle: {
        kind: 'TMDBSearch',
        query: 'tmdbQuery',
      }
    }, {
      particle: {
        kind: 'TMDBGrid',
        tmdbResults: 'tmdbResults'
      }
    }, {
      particle: {
        kind: 'TMDBDetail',
        tmdbSelection: 'tmdbSelection'
      }
    }]
  }]
};

export const createArc = async (tenant, id) => {
  // crete arc
  const composer = new Composer(tenant.view);
  const arc = new Arc({id, name: 'arcname', composer});
  // record it
  tenant.arcs[arc.id] = arc;
  return arc;
};

// const createTestArc = async (tenant, recipe) => {
//   const id = `starter-arc`;
//   await createArc(tenant, id, recipe);
//   let store = tenant.arcs[id].stores.find(s => s.name === 'userid');
//   store.change(truth => truth.userid = tenant.persona);
// };
