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
import {installChatParticle} from './chatRecipe.js';

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
    const chattables = study.chat;
    device.chat2s = study.chat2;
    //
    Object.values(device.arcs).forEach(arc => {
      if (arc.meta.recipe === 'chatRecipe') {
        const viable = chattables.filter(({id}) => Store.meta(id).arcId !== arc.id);
        arc._p = arc._p || {};
        viable.forEach(({id}) => {
          if (!arc._p[id]) {
            arc._p[id] = true;
            installChatParticle(id, arc);
          }
        });
        arc.suggestions = viable.map(({user}) => user);
        arc._view && arc._view._invalidate();
      }
    });
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
}
