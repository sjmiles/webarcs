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
import {mergeRawData} from '../dataplex.js';

import {ChatList} from '../particles/chat-list.js';
import {ChatWrite} from '../particles/chat-write.js';
import {ChatMerge} from '../particles/chat-merge.js';
window.customElements.define('chat-list', ChatList);
window.customElements.define('chat-write', ChatWrite);
window.customElements.define('chat-merge', ChatMerge);

const entriesName = `entries:shared:[ChatEntry]`;
const mergedName = `merged:local:[ChatEntry]`;

export const installChatRecipe = (userid, arc) => {
  //
  // require stores
  //
  // TODO(sjmiles): ids vs stores is all messed up
  // entries are produced by chatWrite and belong to current Persona
  const entriesStore = new Store(arc.env.database, arc.requireStore(entriesName));
  // merged is the volatile assemblage of entries from multiple sources
  const mergedStore = new Store(arc.env.database, arc.requireStore(mergedName));
  //
  // create particles
  //
  const chatList = arc.composer.root.appendChild(document.createElement('chat-list'));
  const chatWrite = arc.composer.root.appendChild(document.createElement('chat-write'));
  const chatMerge = document.createElement('chat-merge');
  //
  // attach data to particles
  //
  const updateHandles = () => {
    chatWrite.userid = userid;
    const entries = Store.serialize(mergedStore.data.entries);
    chatList.entries = entries;
    chatMerge.entries = entries;
    chatMerge.other = Store.serialize(entriesStore.data.entries);
  };
  arc.onchange = updateHandles;
  arc.onchange();
  //
  // consume particle output
  //
  chatMerge.onoutput = chatMergeConsumerFactory(arc, mergedStore);
  // chatMerge.onoutput = output => {
  //   if (output) {
  //     const {merged} = output;
  //     console.log('merged', merged);
  //     const neo = mergeRawData(mergedStore.data, {entries: merged});
  //     if (neo) {
  //       mergedStore.data = neo;
  //       arc.changed();
  //     }
  //   }
  // };
  chatWrite.onoutput = output => {
    if (output) {
      const {entries} = output;
      if (entries) {
        const keys = Object.keys(entries);
        if (keys.length) {
          entriesStore.change(truth => {
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
  //
  arc.composer.root.appendChild(chatMerge);
};

const chatMergeConsumerFactory = (arc, targetStore) => {
  return output => {
    if (output) {
      const {merged} = output;
      //console.log('merged', merged);
      const neo = mergeRawData(targetStore.data, {entries: merged});
      if (neo) {
        targetStore.data = neo;
        arc.changed();
      }
    }
  };
};

export const installChatParticle = (storeId, arc) => {
  //
  // require stores
  //
  // entries are produced by chatWrite and belong to a Persona
  const entriesStore = new Store(arc.env.database, storeId);
  // merged is the volatile assemblage of entries from multiple sources
  const mergedStore = new Store(arc.env.database, arc.requireStore(mergedName));
  //
  // create particles
  //
  const chatMerge = document.createElement('chat-merge');
  //
  // attach data to particles
  //
  const updateHandles = () => {
    chatMerge.entries = Store.serialize(mergedStore.data.entries);
    chatMerge.other = Store.serialize(entriesStore.data.entries);
  };
  const lastOn = arc.onchange;
  arc.onchange = () => {
    updateHandles();
    lastOn && lastOn();
  };
  arc.onchange();
  //
  // consume particle output
  //
  chatMerge.onoutput = chatMergeConsumerFactory(arc, mergedStore);
  // merge.onoutput = output => {
  //   if (output) {
  //     const {merged} = output;
  //     console.log('merged', merged);
  //     const neo = mergeRawData(store.data, {entries: merged});
  //     if (neo) {
  //       store.data = neo;
  //     }
  //     // store.change(truth => {
  //     //   if (!truth.entries) {
  //     //     truth.entries = {};
  //     //   }
  //     //   if (truth.entries) {
  //     //     //Object.keys(merged).forEach(key => truth.entries[key] = merged[key]);
  //     //     //Object.keys(merged).forEach(key => console.log(merged[key]));
  //     //   }
  //     // });
  //     //arc.changed();
  //   }
  // };
  // install node
  arc.composer.root.appendChild(chatMerge);
};
