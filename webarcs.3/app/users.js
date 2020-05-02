/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

export const users = [{
  device: 'mobile',
  user: 'moe@springfield.com',
  persona: 'moe',
  peers: ['edna:desktop', 'carl:mobile']
}, {
  device: 'desktop',
  user: 'edna@springfield.edu',
  persona: 'edna',
  peers: ['moe:mobile', 'liz:mobile', 'lenny:mobile']
}, {
  device: 'mobile',
  user: 'carl@springfield.com',
  persona: 'carl',
  peers: ['moe:mobile', 'lenny:mobile']
}, {
  device: 'mobile',
  user: 'liz@springfield.edu',
  persona: 'liz',
  peers: ['moe:mobile', 'edna:desktop', 'frink:mobile']
}, {
  device: 'mobile',
  user: 'lenny@springfield.com',
  persona: 'lenny',
  peers: ['carl:mobile', 'edna:desktop']
}, {
  device: 'mobile',
  user: 'frink@labs.com',
  persona: 'frink',
  peers: ['frink:laptop', 'liz:mobile']
}, {
  device: 'laptop',
  user: 'frink@labs.com',
  persona: 'frink',
  peers: ['frink:mobile']
}];
