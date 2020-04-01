/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Store} from './db/store.js';

const nameTagsType = `profile:shared:Profile`;

export const installProfileRecipe = (userid, arc) => {
  //
  // require stores
  //
  const storeId = arc.requireStore(nameTagsType);
  const store = new Store(arc.env.database, storeId);
  //
  // create particles
  //
  arc.chatRead = arc.composer.root.appendChild(document.createElement('chat-read'));
  arc.chatWrite = arc.composer.root.appendChild(document.createElement('chat-write'));
  //
  // attach data to particles
  //
  const updateHandles = () => {
    arc.chatWrite.userid = userid;
    arc.chatRead.entries = store.data.entries;
  };
  arc.onchange = updateHandles;
  arc.onchange();
  //
  // consume particle output
  //
  arc.chatWrite.onoutput = output => {
    if (output) {
      const {entries} = output;
      store.change(truth => {
        if (!truth.entries) {
          truth.entries = {};
        }
        if (truth.entries) {
          Object.keys(entries).forEach(key => truth.entries[key] = entries[key]);
        }
      });
      arc.changed();
    }
  };
};
