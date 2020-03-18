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
 * @module devices
 */

import {Bus} from '../bus.js';
import {createHostedParticle} from '../host.js';
import {makeId} from '../../utils/utils.js';

let worker;
let dispatcher;
const nob = {};
const senders = {};
const channels = {};

const logFlags = {hub: true};
const log = (logFlags.hub) ? console.log.bind(console) : () => {};

export class WorkerHub {
  static async importParticle(kind) {
    await WorkerHub.request({msg: 'register', kind, src: `./particles/${kind}.js`});
    return async () => await createHostedParticle(kind, new Bus(WorkerHub));
  }
  static parse(json) {
    return json ? JSON.parse(json) : nob;
  }
  static init(workerPath, injectedDispatcher) {
    dispatcher = injectedDispatcher;
    workerPath = workerPath || '../../lib/js/devices/worker/worker.js';
    worker = new Worker(workerPath, {type: 'module'});
    worker.onerror = e => this.onerror(e);
    worker.onmessage = e => this.onmessage(e);
  }
  static send(message) {
    log('Hub::send', message);
    // TODO(sjmiles): there could be other remote-hub-clients, subclass details into WorkerHub
    worker.postMessage(message);
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
  static openChannel(id, receiver) {
    const channel = {
      send: message => {
        message.id = id;
        message.channelId = id;
        this.send(message);
      },
      receive: receiver,
      close: () => {
        delete channels[id];
      },
      request: async message => {
        message.id = id;
        message.channelId = id;
        return this.request(message);
      }
    };
    channels[id] = channel;
    return channel;
  }
};
