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
//import {Recipe} from '../arcs/build/ergo/recipe.js';
//import {Store} from '../arcs/build/data/store.js';
import {logFactory} from '../arcs/build/utils/log.js';

const log = logFactory(true, 'planner', 'gold');

export class Planner {
  constructor(tenant) {
    this.tenant = tenant;
  }
  plan() {
    const {tenant} = this;
    // use a dictionary (not an array) to uniquify keys
    const suggestions = {};
    // produce suggestions from shared-arcs-stores
    this.suggestSharedArcs(tenant, suggestions);
    // suggestions for sui-generis arcs
    Object.keys(recipes).forEach(name => suggestions[name] = {userid: 'system', name, recipe: name});
    //suggestions['chat'] = {userid: 'system', name: 'chat', recipe: 'chat'};
    //suggestions['tv'] = {userid: 'system', name: 'tv', recipe: 'tv'};
    // extract values array
    tenant.suggestions = Object.values(suggestions);
  }
  suggestSharedArcs(tenant, suggestions) {
    const {hub} = tenant;
    if (hub) {
      hub.forEachConnection(c => {
        const {data} = c.arcSharesStore;
        if (data) {
          // TODO(sjmiles): persona should be available directly
          const friendPersona = c.endpoint.remoteId.split(':')[0];
          this.suggestionsFromShares(tenant, friendPersona, data, suggestions);
        }
      });
    }
    // const {arcs} = tenant;
    // Object.values(tenant.context.stores).forEach(store => {
    //   const {meta} = store;
    //   if (meta.type === '[ArcShareMetadata]' && meta.persona !== tenant.persona && store.length> 0) {
    //     const shares = store.getProperty();
    //     Object.entries(shares).forEach(([id, share]) => {
    //       if (!arcs[id]) {
    //         const name = share.meta && share.meta.description || id;
    //         //console.warn(`[${tenant.id}]: found ArcShareMetadata from [${meta.persona}]`);
    //         suggestions[id] = {
    //           userid: meta.persona,
    //           msg: `<b>${meta.persona}</b> has shared <b>${name}</b>`,
    //           share
    //         };
    //       }
    //     });
    //   }
    // });
  }
  suggestionsFromShares(tenant, friend, shares, suggestions) {
    const {arcs} = tenant;
    Object.entries(shares).forEach(([id, share]) => {
      if (!arcs[id]) {
        const name = share.meta && share.meta.description || id;
        //console.warn(`[${tenant.id}]: found ArcShareMetadata from [${friend}]`);
        suggestions[id] = {
          userid: friend,
          msg: `<b>${friend}</b> has shared <b>${name}</b>`,
          share
        };
      }
    });
  }
}
