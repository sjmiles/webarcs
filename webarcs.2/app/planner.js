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
import {Recipe} from '../arcs/build/ergo/recipe.js';
import {logFactory} from '../arcs/build/utils/log.js';

const log = logFactory(true, 'planner', 'lightgreen');

export class Planner {
  constructor(tenant) {
    this.tenant = tenant;
  }
  async initRecipeStores() {
    this.recipeStores = {};
    Object.keys(recipes).map(name => {
      Recipe.parseStores(recipes[name], this.recipeStores);
    });
    //log(Object.keys(this.recipeStores));
  }
  plan() {
    const {tenant} = this;
    const arcStores = {};
    Object.values(tenant.arcs).forEach(arc => {
      Object.values(arc.stores).forEach(store => {
        arcStores[store.id] = store;
        //log('arc', store.id);
      });
    });
    //log(arcStores);
    // use a dictionary to uniquify keys
    const suggestions = {};
    // suggestions from shared arc data
    Object.values(tenant.context.stores).forEach(store => {
      const arcid = store.id.split(':').shift();
      if (arcid === 'peers') {
        return;
      }
      if (tenant.arcs[arcid]) {
        //log(`context store [${store.id}] matches arc [${arcid}]`);
      } else {
        //log(`context store [${store.id}] matches no arc, making suggestion`);
        const recipe = arcid;
        suggestions[recipe] = {userid: 'system', recipe};
      }
    });
    // suggestions for sui-generis arcs
    suggestions['chat'] = {userid: 'system', recipe: 'chat'};
    if (!tenant.arcs['tv']) {
      suggestions['tv'] = {userid: 'system', recipe: 'tv'};
    }
    // extract values array
    tenant.suggestions = Object.values(suggestions);
  }
}

// const hasArc = (tenant, name) => {
//   return Boolean(tenant.arcs[name]);
//   //Object.values(tenant.arcs).forEach(arc => log(arc));
// };
