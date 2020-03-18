/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import {Params} from '../js/utils/params.js';
import {makeId} from './utils.js';

// device identification

let deviceId = Params.getParam('device');
if (!deviceId) {
  deviceId = makeId();
  Params.setParam('device', deviceId);
}
Params.prefix = `${deviceId}:`;

export {deviceId};