/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Database} from './db/database.js';
import {Composer} from './core.js';
import {Device} from './device.js';
import {addThumb} from './ui/grid.js';

import {ChatRead} from './particles/chat-read.js';
import {ChatWrite} from './particles/chat-write.js';
import {installChatRecipe} from './chatRecipe.js';

window.customElements.define('chat-read', ChatRead);
window.customElements.define('chat-write', ChatWrite);

import {DeviceView} from './ui/device-view.js';
import {ArcView} from './ui/arc-view.js';

window.customElements.define('device-view', DeviceView);
window.customElements.define('arc-view', ArcView);

const personas = ['Moe', 'Larry', 'Curly'];
const deviceIds = ['Mobile', 'Desktop', 'NestHub'];
const colors = ['orange','green','purple','blue'];

const icolor = i => colors[i % colors.length];

const newDevice = (persona, deviceId, color) => {
  const view = newDeviceUi();
  const root = view.appendChild(document.createElement('div'));
  //
  const id = `${persona}:${deviceId}`;
  const composer = new Composer(root);
  const database = new Database(`${id}:database`);
  //
  const device = new Device(id, composer, database);
  device.color = color;
  //
  view.device = device;
  device.view = view;
  //
  restore(device);
  //
  return device;
};

const restore = device => {
   device.database.restore();
   const ids = JSON.parse(localStorage.getItem(device.id));
   if (ids) {
     ids.forEach(id => createArc({id, device}));
   }
};

const createArc = ({id, device}) => {
  // create rendering surface
  const root = document.createElement('div');
  const composer = new Composer(root);
  const arc = device.createArc({id, composer});
  installChatRecipe(device.id, arc);
  const handler = arc.onchange;
  arc.onchange = () => {
    if (handler) {
      handler.call(arc);
    }
    device.view._invalidate();
    device.database.persist();
  };
  // TODO(sjmiles): knowing when things have changed (for a solid definition of "changed") is important
  arc.onchange()
  return arc;
};

const newDeviceUi = () => {
  // create a device-viewer
  const view = document.createElement('device-view');
  view.onNewArcClick = () => onNewArcClick(view);
  // shove it in an grid-thumb
  const thumb = addThumb();
  thumb.view = view;
  thumb.appendChild(view);
  return view;
};

const onNewArcClick = view => {
  createArc({id: 'chat', device: view.device});
};

/* main */

const devices = [];
window.devices = devices;

// for each persona
personas.forEach((persona, i) => {
  const color = icolor(i);
  // create some devices
  deviceIds.forEach(id => {
    // TODO(sjmiles): database.reify() is called by device
    devices.push(newDevice(persona, id, color));
  });
});

// setup test connections

const connectionSchema = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4]
];

const connectDuplex = (a, b) => {
  const connA = devices[a].connect(`${a}->${b}`);
  const connB = devices[b].connect(`${b}->${a}`);
  connA.connect(connB);
  connB.connect(connA);
}

connectionSchema.forEach(([a, b]) => connectDuplex(a, b));

