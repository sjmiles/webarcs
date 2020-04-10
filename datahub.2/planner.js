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
import {debounce} from './utils.js';
import {installChatParticle} from './recipes/chatRecipe.js';

export class Planner {
  constructor(device) {
    this.device = device;
    // TODO(sjmiles): fix onchange event system; right now we are chaining manually
    this.listen(device.database);
  }
  listen(database) {
    const lastOn = database.onchange;
    const plan = (id, doc) => {
      this.plan();
      lastOn && lastOn(id, doc);
    };
    database.onchange = (id, doc) => {
      this.debounce = debounce(this.debounce, () => plan(id, doc), 1000);
    };
  }
  plan() {
    this.devicePlan(this.device);
  }
  devicePlan(device) {
    const study = this.studyStores(device.database);
    //
    device.chat = study.chat;
    this.studyChats(device);
    //
    device.chat2s = study.chat2;
    this.studyChats2(device);
  }
  studyStores(database) {
    const chattables = new Set();
    const chattables2 = new Set();
    database.storeIds.forEach(id => {
      const meta = Store.meta(id);
      if (meta.type === '[ChatEntry]') {
        const entries = database.get(id).entries;
        if (entries) {
          const entry = Object.values(entries)[0];
          if (entry) {
            chattables.add({user: entry.userid, id});
          }
        }
      }
      if (meta.type === '[Chat2Entry]') {
        const entries = database.get(id).entries;
        if (entries) {
          const entry = Object.values(entries)[0];
          if (entry) {
            chattables2.add({user: entry.userid, id});
          }
        }
      }
    });
    //const result = [...chattables];
    //console.log(result);
    return {chat: [...chattables], chat2: [...chattables2]};
  }
  studyChats(device) {
    Object.values(device.arcs).forEach(arc => {
      if (arc.meta.recipe === 'chatRecipe') {
        const viable = device.chat.filter(({id}) => Store.meta(id).arcId !== arc.id);
        arc._p = arc._p || {};
        viable.forEach(({id}) => {
          if (!arc._p[id]) {
            arc._p[id] = true;
            //console.warn(`${device.id}: ${user} extends invitation to chat`);
            installChatParticle(id, arc);
          }
        });
        arc.suggestions = viable.map(({user}) => user);
        arc._view && arc._view._invalidate();
      }
    });
  }
  studyChats2(device) {
    let hasChat2 = false;
    Object.values(device.arcs).forEach(arc => {
      if (arc.meta.recipe === 'chat2Recipe') {
        hasChat2 = true;
        // array of store-ids used by this arc
        const stores = Object.values(arc.stores);
        // remove candidates that are already in use
        device.chat2s = device.chat2s.filter(({id}) => !stores.includes(id));
      }
    });
    //
    // is there a chat2 activity for this persona on a different device?
    //
    // have to access the list of Arcs for this persona on other devices to answer this question
    // if the chat2 activity was not started by me
    //
    // Need to play for: Activity sharing between Devices for a Persona
    //
    if (!hasChat2) {
      // our persona
      const persona = device.id.split(':').shift();
      console.log(`Planner: studying chats for "${persona}"`);
      // this is wrong, only finds chats started by `persona`, but not chats joined
      const chat2i = device.chat2s.findIndex(({user}) => persona === user.split(':').shift());
      if (chat2i >= 0) {
        const chat2 = device.chat2s[chat2i];
        device.onNotificationClick(chat2);
        device.chat2s.splice(chat2i, 1);
        console.log(`Planner: installing Arc for "${persona}" activity initiated from other device.`);
      }
    }
  }
}
