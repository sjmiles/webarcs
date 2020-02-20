/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {makeId} from '../core/utils.js';

let worker;
let dispatcher;
const nob = {};
const senders = {};
const channels = {};

const flags = {};
const log = (flags.hub) ? console.log.bind(console) : () => {};

export const SimpleHub = class {
  static init() {
  }
  static openChannel(id, receiver) {
    const channel = {
      send: message => {
        message.channelId = id;
        this.send(message);
      },
      receive: receiver,
      close: () => {
        delete channels[id];
      }
    };
    channels[id] = channel;
    return channel;
  }
  static onerror(e) {
    console.error(e.message, e);
  }
  static onmessage(e) {
    this.receive(e.data);
  }
  // TODO(sjmiles): factor sender junk
  static receive(message) {
    log('Hub::receive', message);
    const {msg, tid, channelId} = message;
    if (channelId) {
      const channel = channels[channelId];
      if (channel) {
        channel.receive(message);
      }
      else {
        console.warn('unknown channel: ', message);
      }
    }
    else if (tid) {
      const resolve = senders[tid];
      if (resolve) {
        resolve(message);
        delete senders[tid];
      }
      else {
        console.warn('unknown transaction: ', message);
      }
    }
    else {
      if (dispatcher[msg]) {
        dispatcher[msg](message);
      }
      else {
        console.warn('unknown message type: ', message);
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
