
/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

const nar = [];

export class EventEmitter {
  constructor() {
    // map of event name to listener array
    this.listeners = {};
  }
  fire(eventName, event) {
    this.getListeners(eventName).forEach(listener => listener(event));
  }
  getListeners(eventName) {
    return this.listeners[eventName] || nar;
  }
  listen(eventName, listener) {
    const listeners = this.listeners[eventName] || (this.listeners[eventName] = []);
    listeners.push(listener);
    return listener;
  }
  unlisten(eventName, listener) {
    const list = this.getListeners(eventName);
    const index = list.indexOf(listener);
    if (list >= 0) {
      list.splice(index, 1);
    }
  }
}
