/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Automerge} from '../automerge.js';
import {deepEqual, deepUndefinedToNull} from './utils.js';

export const mergeRawData = (doc, outputs) => {
  let changed = false;
  doc = Automerge.change(doc, doc => {
    Object.keys(outputs).forEach(key => {
      const truth = doc[key];
      let value = outputs[key];
      // if the types have diverged (seems bad?), comparing makes no sense
      if (typeof value === typeof truth) {
        // TODO(sjmiles): perform potentially expensive dirty-checking here
        if (deepEqual(truth, value)) {
          return;
        }
        // downstream APIs, e.g. `automerge` and 'firebase', tend to dislike undefined values
        if (value === undefined) {
          value = null;
        } else {
          // TODO(sjmiles): stopgap: deeply convert undefined values to null
          deepUndefinedToNull(value);
        }
        // if (Array.isArray(value)) {
        //   console.log(`concat'ing arrays`);
        //   const arr = doc[key];
        //   value.forEach(v => arr.push(v));
        //   changed = true;
        //   return;
        // }
      }
      doc[key] = value;
      changed = true;
    });
  });
  return changed ? doc : null;
};
