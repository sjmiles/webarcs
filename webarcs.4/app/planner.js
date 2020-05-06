/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {recipes} from './recipes.js';
// import {Recipe} from '../arcs/build/ergo/recipe.js';
import {Store} from '../arcs/build/data/store.js';
import {logFactory} from '../arcs/build/utils/log.js';

const log = logFactory(true, 'planner', 'lightgreen');

export class Planner {
  constructor(tenant) {
    this.tenant = tenant;
  }
  plan() {
    const {tenant} = this;
    const {arcs} = tenant;
    // use a dictionary (not an array) to uniquify keys
    const suggestions = {};
    // study context stores
    Object.values(tenant.context.stores).forEach(store => {
      const meta = store.getMeta();
      if (meta.type === '[ArcShareMetadata]' && meta.persona !== tenant.persona && store.length> 0) {
        const shares = store.getProperty();
        Object.entries(shares).forEach(([id, share]) => {
          if (!arcs[id]) {
          //console.warn(`[${tenant.id}]: found ArcShareMetadata from [${meta.persona}]`);
            suggestions[id] = {
              userid: meta.persona,
              msg: `<b>${meta.persona}</b> has shared <b>${id}</b>`,
              share
            };
          }
        });
      }
    });
    // suggestions for sui-generis arcs
    if (!arcs['chat']) {
      suggestions['chat'] = {userid: 'system', name: 'chat', recipe: 'chat'};
    }
    if (!arcs['tv']) {
      suggestions['tv'] = {userid: 'system', name: 'tv', recipe: 'tv'};
    }
    // extract values array
    tenant.suggestions = Object.values(suggestions);
  }
}
