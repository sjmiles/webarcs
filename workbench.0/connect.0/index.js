/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import {ConnectView} from './elements/connect-view.js';
window.customElements.define('connect-view', ConnectView);

//import {Database} from './core/database.js';
//import {Store} from './core/store.js';
import {Persona} from './core/persona.js';
import {Device} from './core/device.js';
//import {Arc} from './core/arc.js';
import {Connection} from './core/connection.js';
import {createProfileArc, createBankArc} from './recipes.js';

const personas = {};
const devices = {};

const personasSchema = {
  'moe': {
    'mobile': {
      peers: ['larry:mobile', 'curly:mobile', 'moe:desktop']
    },
    'desktop': {
      peers: ['moe:mobile']
    }
  },
  'larry': {
    'mobile': {
      peers: ['moe:mobile', 'curly:mobile']
    }
  },
  'curly': {
    'mobile': {
      peers: ['moe:mobile', 'larry:mobile']
    },
    'nest': {
      peers: [],
    }
  }
};

const connections = {};

const newDevice = (name, persona, peers) => {
  const id = `${persona.id}:${name}`;
  const device = new Device(id, persona);
  // peers belong to device, persona, or user?
  device.peers.change(doc => {
    peers.forEach(peer => doc[peer] = peer);
  });
  device.connections = [];
  // device.connections = Object.values(device.peers.truth).map(peer => {
  //   const connection = new Connection(device, {id: peer.split(':').shift()});
  //   connection.id = `${device.id}:${peer}`;
  //   connection.duplex = `${peer}:${device.id}`;
  //   connections[connection.id] = connection;
  //   return connection;
  // });
  return device;
};

Object.keys(personasSchema).forEach((name) => {
  // create a persona
  const persona = new Persona(name);
  personas[name] = persona;
  // create some devices
  const personaSchema = personasSchema[name];
  Object.keys(personaSchema).forEach(key => {
    const deviceSchema = personaSchema[key];
    const device = newDevice(key, persona, deviceSchema.peers);
    devices[device.id] = device;
  });
});

createProfileArc(personas.moe);
createBankArc(personas.moe);

Object.values(devices).forEach(device => {
  // create connections
  device.connections = Object.values(device.peers.truth).map(peer => {
    const connection = new Connection(device, {id: peer.split(':').shift()});
    connection.id = `${device.id}:${peer}`;
    connection.duplex = `${peer}:${device.id}`;
    connections[connection.id] = connection;
    return connection;
  });
  // connect matched connections
  Object.values(device.connections).forEach(connection => {
    const duplex = connections[connection.duplex];
    if (duplex) {
      console.log('connecting (duplex) ', connection.duplex);
      connection.connect(duplex);
      duplex.connect(connection);
    }
  });
});

// Object.keys(personasSchema).forEach((name) => {
//   const deviceSchemas = personasSchema[name];
//   Object.keys(deviceSchemas).forEach(id => {
//     const device = devices[id];
//     const {peers} = deviceSchemas[id];
//     peers.forEach(peerId => {
//       const connectionId = `${id}:${peerId}`;
//       if (!connections[connectionId]) {
//         const conn = new Connection(device, {id: peerId});
//         conn.target = `${peerId}:${id}`;
//         connections[connectionId] = conn;
//       }
//     });
//   });
// });

// const moe = new Persona('moe');
// device[0] = new Device('moe:mobile', moe);
// // peers belong to device, persona, or user?
// device[0].peers.change(doc => {
//    doc['larry'] = {
//      id: 'larry',
//      device: 'larry:mobile'
//    };
//  });

// //const moe2Moe = new Connection(device0, moe);
// //html.push(moe2Moe.dump());

// const larry = new Persona('larry');
// const device1 = new Device('larry:mobile', larry);

// const moe2Larry = new Connection(device[0], device1.persona);
// const larry2Moe = new Connection(device1, device0.persona);
// // connections are typically in different processes, that's why it's duplex
// moe2Larry.connect(larry2Moe);
// larry2Moe.connect(moe2Larry);

// const device2 = new Device('moe:desktop', moe);

// const device0_2 = new Connection(device[0], device2.persona);
// const device2_0 = new Connection(device2, device[0].persona);
// device0_2.connect(device2_0);
// device2_0.connect(device0_2);

window.dump = () => {
  const html = [];
  Object.values(devices).forEach(({connections}) => connections.forEach(conn => html.push(conn.dump())));
  window.cons.innerHTML = html.join('');
};
window.dump();
setTimeout(window.dump, 1000);

// device0.connections = [moe2Larry, device0_2];
// device1.connections = [larry2Moe];
// device2.connections = [device2_0];
// const devices = [device0, device1, device2];

Object.values(devices).forEach((device, i) => {
  const cv = window.connections.appendChild(document.createElement('connect-view'));
  cv.device = device;
  //cv.connection = connection;
  cv.color = ['green', 'lightblue', 'red', 'brown', 'silver'][i%5];
  cv.style = `background-color: ${cv.color};`; //`position: absolute; top: 0; right: 0;`;
});
