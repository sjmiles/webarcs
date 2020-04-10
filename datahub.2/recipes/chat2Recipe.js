/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Store} from '../db/store.js';

const entriesName = `entries:shared:[Chat2Entry]`;

export const installChat2Recipe = (device, arc, targetId) => {
  // cheat way to get a human-readable-name
  const userid = device.id.split(':').shift();
  // are we already bound to a store?
  if (!targetId) {
    let target = (Object.values(device.chat2s || Object))[0];
    if (target) {
      // if there are any bindable stores, use the first one
      targetId = target.id;
    } else {
      // otherwise, create one
      targetId = arc.requireStore(entriesName);
    }
  }
  // record the store binding
  arc.meta.targetId = targetId;
  arc.addStore(entriesName, targetId);
  //
  const entriesStore = new Store(arc.env.database, targetId);
  //
  // require stores
  //
  //const entriesStore = new Store(arc.env.database, arc.requireStore(entriesName));
  //
  // create particles
  //
  const chatList = document.createElement('chat-list');
  const chatWrite = document.createElement('chat-write');
  //
  // attach data to particles
  //
  const updateHandles = () => {
    chatWrite.userid = userid;
    chatList.entries = Store.serialize(entriesStore.data.entries);
  };
  const loc = arc.onchange;
  arc.onchange = () => {
    updateHandles();
    loc && loc();
  };
  arc.onchange();
  //
  // consume particle output
  //
  chatWrite.onoutput = chatWriteConsumerFactory(arc, entriesStore);
  //
  arc.composer.root.appendChild(chatWrite);
  arc.composer.root.appendChild(chatList);
};

const chatWriteConsumerFactory = (arc, targetStore) => {
  return output => {
    if (output) {
      const {entries} = output;
      if (entries) {
        const keys = Object.keys(entries);
        if (keys.length) {
          targetStore.change(truth => {
            if (!truth.entries) {
              truth.entries = {};
            }
            keys.forEach(key => truth.entries[key] = entries[key]);
          });
          arc.changed();
        }
      }
    }
  };
};
