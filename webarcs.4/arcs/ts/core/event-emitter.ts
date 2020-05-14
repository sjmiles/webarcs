
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
  // map of event name to listener array
  listeners = {};
  getEventListeners(eventName) {
    return this.listeners[eventName] || (this.listeners[eventName] = []);
  }
  fire(eventName, event?) {
    this.getEventListeners(eventName).forEach(listener => listener(event));
  }
  listen(eventName, listener) {
    const listeners = this.getEventListeners(eventName);
    listeners.push(listener);
    return listener;
  }
  unlisten(eventName, listener) {
    const list = this.getEventListeners(eventName);
    const index = list.indexOf(listener);
    if (index >= 0) {
      list.splice(index, 1);
    }
  }
}
