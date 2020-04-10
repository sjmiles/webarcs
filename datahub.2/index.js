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
import {Composer} from './arcs/composer.js';
import {Planner} from './planner.js';
import {Device} from './device.js';

import {installChatRecipe} from './recipes/chatRecipe.js';
import {installChat2Recipe} from './recipes/chat2Recipe.js';
import {installEditProfileRecipe} from './recipes/editProfileRecipe.js';

import './ui/grid.js';

import {makeId} from './utils.js';

const newDevice = (persona, deviceId, color) => {
  const id = `${persona}:${deviceId}`;
  const database = new Database(`${id}:database`);
  //
  const root = document.createElement('div');
  const composer = new Composer(root);
  const device = new Device(id, composer, database);
  device.color = color;
  device.onNotificationClick = info => onDeviceNotificationClick(device, info);
  //
  newDeviceUi(device, root);
  // TODO(sjmiles): have to do this here for `onchange` chaining to work, which is dumb
  newPlanner(device);
  restore(device);
  //
  return device;
};

const newDeviceUi = (device, root) => {
  // create a device-viewer
  const view = document.createElement('device-view');
  // locate each other
  view.device = device;
  device.view = view;
  // composer root goes into the view
  view.appendChild(root);
  // hook up ui
  view.onNewChatArcClick = () => onNewChatArcClick(view);
  view.onNewChat2ArcClick = () => onNewChat2ArcClick(view);
  view.onNewProfileArcClick = () => onNewProfileArcClick(view);
  // device-view goes into thumb-view
  const thumb = document.createElement('thumb-view');
  thumb.style.borderColor = view.device.color;
  thumb.view = view;
  thumb.appendChild(view);
  // thumb-view goe into thumb-grid
  window.thumbsGrid.appendChild(thumb);
  window.thumbsGrid.selected = thumb;
};

const onNewChatArcClick = view => {
  const arc = createArc({id: makeId(), device: view.device});
  installRecipe(view.device, arc, {recipe: 'chatRecipe'});
  // TODO(sjmiles): defining what a 'triggering-change' is, and triggering it correctly, is important
  arc.onchange();
};

const onNewChat2ArcClick = view => {
  const arc = createArc({id: makeId(), device: view.device});
  installRecipe(view.device, arc, {recipe: 'chat2Recipe'});
  arc.onchange();
};

const onNewProfileArcClick = view => {
  const arc = createArc({id: makeId(), device: view.device});
  installRecipe(view.device, arc, {recipe: 'editProfileRecipe'});
  arc.onchange();
};

const onDeviceNotificationClick = (device/*, info*/) => {
  const arc = createArc({id: makeId(), device});
  installRecipe(device, arc, {recipe: 'chat2Recipe'});
  arc.onchange();
  device.planner.plan();
};

const newPlanner = device => {
  device.planner = new Planner(device);
};

const restore = device => {
  device.database.restore();
  const meta = device.restoreArcList();
  if (meta) {
    meta.forEach(({id, meta}) => {
      const arc = createArc({id, device});
      installRecipe(device, arc, meta);
    });
  }
};

const installRecipe = (device, arc, meta) => {
  switch (meta.recipe) {
    case 'chatRecipe':
      installChatRecipe(device.id, arc);
      break;
    case 'chat2Recipe':
      installChat2Recipe(device, arc, meta.targetId);
      break;
    case 'editProfileRecipe':
      installEditProfileRecipe(device, arc);
      break;
  }
  arc.meta.recipe = meta.recipe;
  device.persistArcList();
};

const createArc = ({id, device}) => {
  // create rendering surface
  const root = document.createElement('div');
  const composer = new Composer(root);
  const arc = device.createArc({id, composer});
  const handler = arc.onchange;
  arc.onchange = () => {
    if (handler) {
      handler.call(arc);
    }
    device.view._invalidate();
    device.database.persist();
  };
  return arc;
};

// main

const colors = ['orange','green','purple','blue'];
const icolor = i => colors[i % colors.length];

const devices = [];
window.devices = devices;

// create a set of devices for each persona

const deviceSchema = {
  "Moe": ['Mobile', 'Desktop'],
  "Larry": ['Mobile'],
  "Curly": ["Mobile", "NestHub"]
};

Object.keys(deviceSchema).forEach((persona, i) => {
  // create some devices
  deviceSchema[persona].forEach(id => {
    // TODO(sjmiles): database.restore() is called by device
    devices.push(newDevice(persona, id, icolor(i)));
  });
});

// setup test connections

const duplexConnect = (a, b) => {
  const connA = devices[a].connect(`${a}->${b}`);
  const connB = devices[b].connect(`${b}->${a}`);
  connA.connect(connB);
  connB.connect(connA);
};

const connect = () => {
  window.connectButton.hidden = true;
  const connectionSchema = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    // [4, 5],
    // [5, 6],
    // [6, 7],
    // [7, 8],
  ];
  connectionSchema.forEach(([a, b]) => duplexConnect(a, b));
};

window.connectButton.onclick = () => {
  connect();
};

connect();
