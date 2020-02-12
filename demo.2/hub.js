/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import {makeId} from './utils.js';

let worker;
let dispatcher;
const nob = {};
const senders = {};

export const Hub = class {
  static parse(json) {
    return json ? JSON.parse(json) : nob;
  }
  static init(injectedDispatcher, workerPath) {
    dispatcher = injectedDispatcher;
    worker = new Worker(workerPath || './worker.js');
    worker.onerror = e => this.onerror(e);
    worker.onmessage = e => this.onmessage(e);
  }
  static onerror(e) {
    console.error(e.message, e);
  }
  static onmessage(e) {
    this.receive(e.data);
  }
  static send(message) {
    console.log('Hub::send', message);
    worker.postMessage(message);
  }
  // TODO(sjmiles): factor sender junk
  static receive(message) {
    console.log('Hub::receive', message);
    const {msg, tid} = message;
    if (tid) {
      const resolve = senders[tid];
      if (resolve) {
        resolve(message);
        delete senders[tid];
      }
    } else {
      if (dispatcher[msg]) {
        dispatcher[msg](message);
      } else {
        console.warn('unknown message: ', message);
      }
    }
  }
  static async request(message) {
    message.tid = makeId();
    return new Promise((resolve/*, reject*/) => {
      senders[message.tid] = resolve;
      this.send(message);
      // TODO(sjmiles): reject on timeout?
    });
  }
};
