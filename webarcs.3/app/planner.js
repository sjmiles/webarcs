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
  // async initRecipeStores() {
  //   this.recipeStores = {};
  //   Object.keys(recipes).map(name => {
  //     Recipe.parseStores(recipes[name], this.recipeStores);
  //   });
  //   //log(Object.keys(this.recipeStores));
  // }
  plan() {
    const {tenant} = this;
    const {arcs} = tenant;
    // const arcStores = {};
    // // construct a map of stores-by-id for all tenant stores
    // Object.values(arcs).forEach(arc => {
    //   arc.forEachStores(store => {
    //     arcStores[store.id] = store;
    //   });
    // });
    // use a dictionary (not an array) to uniquify keys
    const suggestions = {};
    // suggestions from shared arc data
    Object.values(tenant.context.stores).forEach(store => {
      const arcid = Store.metaFromId(store.id).arcid;
      //const arcid = store.id.split(':').shift();
      // if (arcid === 'peers') {
      //   return;
      // }
      if (arcs[arcid]) {
        //log(`context store [${store.id}] matches arc [${arcid}]`);
      } else if (recipes[arcid]) {
        //log(`context store [${store.id}] matches no arc, making suggestion`);
        const recipe = arcid;
        suggestions[recipe] = {userid: 'system', name: `shared ${recipe}`, recipe};
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

// const hasArc = (tenant, name) => {
//   return Boolean(tenant.arcs[name]);
//   //Object.values(tenant.arcs).forEach(arc => log(arc));
// };
