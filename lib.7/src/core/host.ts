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
 * @module core
 */

export abstract class Particle {
  public id: string;
  public abstract get config()
  public abstract doUpdate(inputs)
  // override instance method to listen here
  public abstract onoutput(outputs?)
};
