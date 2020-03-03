/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {makeid} from '../lib.8/lib/js/utils.js';
import {Params} from '../params.js';
import {Peer} from './peer.js';

const {log} = window;

let deviceId = Params.getParam('device');
if (!deviceId) {
  deviceId = makeid();
  Params.setParam('device', deviceId);
}

Params.prefix = `{deviceId}:`;
let actorId = Params.fetchValue('actorId');
if (!actorId) {
  actorId = makeid();
  Params.storeValue('actorId', actorId);
}

const msg = msg => {
  console.log(msg);
  log.appendChild(document.createElement('div')).innerText = msg;
};

var peer = new Peer();
peer.on('open', function(id) {
  msg('peer ID is' + id);
});
