/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import {prob} from './utils.js';

export const installChatRecipe = arc => {
  arc.chatWrite = arc.composer.root.appendChild(document.createElement('chat-write'));
  arc.chatWrite.userid = arc.id;
  arc.chatRead = arc.composer.root.appendChild(document.createElement('chat-read'));
  arc.chatWrite.onoutput = output => {
    if (output) {
      const {entries} = output;
      console.log(entries);
      //addEntries(entries);
      //addEntries(['allo mate']);
      arc.stores.persistent.mutate(truth => {
        if (!truth.entries) {
          truth.entries = {};
        }
        if (truth.entries) {
          Object.keys(entries).forEach(key => truth.entries[key] = entries[key]);
        }
        //truth.entries = entries;
      });
      arc.changed();
    }
  };
  // setInterval(() => {
  //   if (prob(0.2)) {
  //     addEntries(['allo mate']);
  //   }
  // }, 5000);
  const addEntries = (entries) => {
    const json = arc.stores.persistent.truth.entries;
    const stored = json ? JSON.parse(json) : [];
    stored.push(...entries);
    arc.stores.persistent.mutate(truth => {
      truth.entries = JSON.stringify(stored);
    });
    updateHandles();
    // TODO(sjmiles): knowing when to signal changes is important
    arc.changed();
  };
  const updateHandles = () => {
    const json = arc.stores.persistent.truth.entries;
    //arc.chatRead.entries = arc.stores.persistent.truth.entries.slice();
    arc.chatRead.entries = json ? JSON.parse(json) : null;
  };
  //updateHandles();
};

export const installChatRecipe1 = (arc) => {
  arc.chatWrite = arc.composer.root.appendChild(document.createElement('chat-write'));
  arc.chatRead = arc.composer.root.appendChild(document.createElement('chat-read'));
  arc.chatWrite.onoutput = output => {
    if (output) {
      const {entries} = output;
      addEntries(entries);
      addEntries(['allo mate']);
    }
  };
  // setInterval(() => {
  //   if (prob(0.2)) {
  //     addEntries(['allo mate']);
  //   }
  // }, 5000);
  const addEntries = (entries) => {
    const json = arc.stores.persistent.truth.entries;
    const stored = json ? JSON.parse(json) : [];
    stored.push(...entries);
    arc.stores.persistent.mutate(truth => {
      truth.entries = JSON.stringify(stored);
    });
    updateHandles();
    // TODO(sjmiles): knowing when to signal changes is important
    arc.changed();
  };
  const updateHandles = () => {
    const json = arc.stores.persistent.truth.entries;
    //arc.chatRead.entries = arc.stores.persistent.truth.entries.slice();
    arc.chatRead.entries = json ? JSON.parse(json) : null;
  };
  updateHandles();
};
