/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {deviceId} from '../../connect/device.js';

export const logFlags = {all: true, groupStatus: true, render: true, comms: true, ergo: true};

const _logFactory = (nonoop, preamble, color, log = 'log') => {
  if (!nonoop) {
    return () => {};
  }
  const style = `background: ${color || 'gray'}; color: white; padding: 1px 6px 2px 7px; border-radius: 6px 0 6px 0;`;
  return console[log].bind(console, `%c${preamble}`, style);
};

const logKinds =  ['log', 'warn', 'error', 'group', 'groupCollapsed', 'groupEnd'];

// produces
//   log: function(preamble, color)
//   log.[log|warn|error|group...]: function(preamble, color)

export const logFactory = (nonoop, preamble: string, color: string = '') => {
  const loggers = {};
  logKinds.forEach(log => loggers[log] = _logFactory(nonoop, `[${deviceId}]:${preamble}`, color, log));
  const log = loggers['log'];
  Object.assign(log, loggers);
  return log;
};

logFactory.flags = logFlags;
