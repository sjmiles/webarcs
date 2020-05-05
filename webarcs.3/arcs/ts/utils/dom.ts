/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

/**
 * @packageDocumentation
 * @module utils
 */

const nob = Object.create(null);
const create = (tag, props?) => Object.assign(document.createElement(tag), props || nob);

export const elt = (tag, props?, parent?) => parent ? parent.appendChild(create(tag, props)) : create(tag, props);
