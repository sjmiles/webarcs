/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Store} from '../core/store.js';
import {Database} from '../core/database.js';
import {EventEmitter} from '../core/event-emitter.js';
import {logger, logFilters} from '../utils/log.js';

const {Automerge} = window;

// rendezvous system
const hubs = [];
window.hubs = hubs;

const log = logger([logFilters.hub], 'hub', 'green');

export class Endpoint {
  constructor(id, sourceId) {
    this.id = id;
    this.listenForPeer(sourceId);
  }
  listenForPeer(sourceId, delay) {
    // for local (loopback) testing
    //
    // endpoint (id) = carl
    // startpoint (sourceId) = moe
    //
    //log('Endpoint: seeking peer', this.id);
    // find 'carl' hub
    //const hub = hubs.find(hub => hub.device.id === this.id && hub.connections); // && hub.connections[sourceId]);
    //
    // Example: we are Moe's endpoint to reach Carl
    // sourceId: moe
    // id: carl
    // to send a message from Moe to Carl, we have to find Carl's connection to Moe, and receive on it.
    //
    const hub = hubs.find(hub => hub.device.id === this.id && hub.connections); // && hub.connections[sourceId]);
    if (hub) {
      // find connection to 'moe' inside of 'carl' hub
      this.connection = hub.connections[sourceId];
      if (this.connection) {
        //log(`Endpoint: found open socket to`, sourceId);
        this.open = true;
        // do not try again
        return;
      }
    }
    // try again, but wait longer between each attempt
    delay = delay || -30;
    if (delay < 600) {
      delay += 30;
    }
    setTimeout(() => this.listenForPeer(sourceId, delay), delay*1e3);
  }
  send(msg) {
    log(`send to %c[${this.id}]%c: `, 'font-weight: bold', 'font-weight: normal', msg);
    this.connection.receive(msg);
  }
}

export class Connection {
  constructor(hub, peer) {
    //super();
    this.hub = hub;
    this.endpoint = new Endpoint(peer, hub.device.id);
    this.database = this.initDatabase(this.hub, this.endpoint);
    this.conn = new Automerge.Connection(this.database.truth, msg => this.send(msg));
    //log(`connecting to [${endpoint.id}] ...`);
    this.open();
  }
  initDatabase(hub, endpoint) {
    const database = new Database(`${hub.device.id}:${endpoint.id}:db`);
    database.add(hub.peerStore);
    database.listen('doc-changed', () => this.hub.changed());
    return database;
  }
  open() {
    // collect messages as pending until endpoint is open
    this.pending = [];
    // delegate 'send' verb while connecting
    this.send = this.connecting;
    // open the low-level connection
    this.conn.open();
    // poll the endpoint until it is open
    const connectInterval = setInterval(() => {
      if (this.endpoint.open && this.pending) {
        this.connected();
        clearInterval(connectInterval);
      }
    }, 1000);
  }
  send(/*msg*/) {
    throw 'connection not open';
  }
  connecting(msg) {
    //log(`messages pending (connecting to ${this.endpoint.id})`);
    this.pending.push(msg);
  }
  connected() {
    //log(`... connected to [${this.endpoint.id}]`);
    this.send = this.sendToEndpoint;
    this.pending.forEach(msg => this.send(msg));
    this.pending = null;
  }
  sendToEndpoint(msg) {
    //log(`send to %c[${this.endpoint.id}]%c: `, 'font-weight: bold', 'font-weight: normal', msg);
    this.endpoint.send(msg);
  }
  receive(msg) {
    // TODO(sjmiles): simulate asynchrony of a real communication channel
    setTimeout(() => {
      log(`%c[${this.hub.device.id}]%c received: `, 'font-weight: bold', 'font-weight: normal', msg);
      this.conn.receiveMsg(msg);
      let doc = this.database.docs.get(msg.docId);
      if (doc) {
        doc = Store.fix(doc);
        this.database.get(msg.docId).truth = doc;
      }
    }, 0);
  }
}

export class Hub extends EventEmitter {
  constructor(device) {
    super();
    // for local (loopback) testing
    hubs.push(this);
    this.device = device;
    device.context.listen('doc-changed', docId => this.deviceChanged(device, docId));
    this.peerStore = this.initPeers(device);
    this.connections = this.connectPeers(this.peerStore.truth);
  }
  deviceChanged(device, docId) {
    log(`${device.id}: sharing`, docId);
    const store = device.context.get(docId);
    Object.values(device.hub.connections).forEach(
      c => c.database.add(store)
    );
  }
  changed() {
    this.captureStores(this.device.context);
    this.fire('change');
  }
  initPeers(device) {
    //const id = `${device.id}:peers`;
    const id = `peers`;
    const peerStore = new Store(id);
    const serial = localStorage.getItem(id);
    if (serial) {
      peerStore.load(serial);
    } else {
      const peers = device.spec.peers;
      peerStore.change(truth => {
        Object.keys(peers).forEach(key => truth[key] = peers[key]);
      });
    }
    return peerStore;
  }
  connectPeers(peers) {
    const connections = {};
    Object.keys(peers).forEach(peer =>
      connections[peer] = new Connection(this, peer)
    );
    return connections;
  }
  forEachConnection(iter) {
    Object.values(this.connections).forEach(iter);
  }
  captureStores(database) {
    //this.forEachConnection(c => c.database.forEachStore(store => !database.get(store.id) && log('capture', store)));
    this.forEachConnection(c => c.database.forEachStore(store => database.add(store)));
  }
}
