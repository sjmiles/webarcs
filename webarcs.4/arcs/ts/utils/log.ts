/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

export const logFlags = {
  any: true,
  arc: true,
  database: false,
  hub: false,
  composer: true,
  render: true,
  ergo: true
};

const _logFactory = (enable, preamble, color, log = 'log') => {
  if (!enable) {
    return () => {};
  }
  if (log === 'dir') {
    return console.dir.bind(console);
  }
  const style = `background: ${color || 'gray'}; color: white; padding: 1px 6px 2px 7px; border-radius: 6px 0 0 6px;`;
  return console[log].bind(console, `%c${preamble}`, style);
};

const logKinds =  ['log', 'warn', 'error', 'group', 'groupCollapsed', 'groupEnd', 'dir'];

// produces
//   log: function(preamble, color)
//   log.<logKinds>: function(preamble, color)

export const logFactory = (enable, preamble: string, color: string = '') => {
  const loggers = {};
  logKinds.forEach(log => loggers[log] = _logFactory(enable, `${preamble}`, color, log));
  const log = loggers['log'];
  Object.assign(log, loggers);
  return log;
};

logFactory.flags = logFlags;
