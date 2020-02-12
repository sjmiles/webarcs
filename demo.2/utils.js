/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

export const irand = (range) => Math.floor(Math.random()*range);
export const prob = probability => Boolean(Math.random() < probability);

export const makeId = () => {
  return `${irand(1e2)+1e1}-${irand(1e2)+1e1}`;
  //return `${irand(1e4)+1e3}-${irand(1e4)+1e3}-${irand(1e4)+1e3}-${irand(1e4)+1e3}`;
};

export const shallowMerge = (obj, data) => {
  Object.keys(data).forEach(key => obj[key] = data[key]);
  return obj;
};
