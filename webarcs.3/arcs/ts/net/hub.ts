/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Store} from '../data/store.js';
import {Database} from '../data/database.js';
import {EventEmitter} from '../core/event-emitter.js';
import {Automerge} from '../data/automerge.js';
import {logFactory} from '../utils/log.js';

// build logger for 'hub' (if enabled)
const log = logFactory(logFactory.flags['hub'] || logFactory.flags['all'], 'hub', 'green');

// rendezvous system
const hubs = [];
// for debugging only
window['hubs'] = hubs;

export class Endpoint {
  id;
  connection;
  open;
  constructor(id, sourceId) {
    this.id = id;
    this.listenForPeer(sourceId);
  }
  listenForPeer(sourceId, delay?) {
    // for local (loopback) testing
    //
    // endpoint (id) = carl
    // startpoint (sourceId) = moe
    //
    //log('Endpoint: seeking peer', this.id);
    // find 'carl' hub
    //const hub = hubs.find(hub => hub.tenant.id === this.id && hub.connections); // && hub.connections[sourceId]);
    //
    // Example: we are Moe's endpoint to reach Carl
    // sourceId: moe
    // id: carl
    // to send a message from Moe to Carl, we have to find Carl's connection to Moe, and receive on it.
    //
    const hub = hubs.find(hub => hub.tenant.id === this.id && hub.connections); // && hub.connections[sourceId]);
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
    // try again, but wait longer between each attempt (delay is in seconds)
    const max = 600;
    delay = delay === undefined ? -30 : delay;
    if (delay < max) {
      delay += 30;
      if (delay > 0 && delay <= max) {
        log(`[${sourceId}] waiting (${delay}s) to connect to [${this.id}]`);
      }
    }
    setTimeout(() => this.listenForPeer(sourceId, delay), delay*1e3);
  }
  send(msg) {
    log(`send to [${this.id}]: `, msg);
    this.connection.receive(msg);
  }
}

export class Connection {
  hub;
  endpoint;
  database;
  conn;
  pending;
  log;
  frink;
  liz;
  constructor(hub, peer) {
    //super();
    // if (hub.tenant.id === 'liz:mobile') {
    //   this.liz = true;
    //   this.log = logFactory(true, 'liz:connection', 'sepia');
    // }
    // if (hub.tenant.id === 'frink:mobile') {
    //   this.frink = true;
    //   this.log = logFactory(true, 'frink:connection', 'brown');
    // }
    this.hub = hub;
    this.endpoint = new Endpoint(peer, hub.tenant.id);
    this.database = this.initDatabase(this.hub, this.endpoint);
    this.conn = new Automerge.Connection(this.database.truth, msg => this.send(msg));
    //log(`connecting to [${endpoint.id}] ...`);
    this.open();
  }
  initDatabase(hub, endpoint) {
    const database = new Database(`${hub.tenant.id}:${endpoint.id}:db`);
    database.ownerId = hub.tenant.id;
    database.listen('doc-changed', docId => this.databaseChanged(docId));
    return database;
  }
  databaseChanged(docId) {
    // if (this.frink) {
    //   this.log('databaseChanged', docId);
    // }
    this.hub.changed();
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
  send(msg) {
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
      log(`[${this.hub.tenant.id}] received: `, msg);
      //console.group(`[${this.hub.tenant.id}] received: `, msg)
      const doc = this.conn.receiveMsg(msg);
      if (doc) {
        const fixed = Store.fix(doc);
        if (fixed !== doc) {
          log(this.hub.tenant.id, msg.docId, 'needed fixup');
        }
        this.database.get(msg.docId).truth = fixed;
      }
      //console.groupEnd();
    }, 0);
  }
}

export class Hub extends EventEmitter {
  tenant;
  database;
  peerStore;
  connections;
  constructor(tenant) {
    super();
    // for local (loopback) testing
    hubs.push(this);
    this.tenant = tenant;
    tenant.context.listen('doc-changed', docId => this.contextChanged(tenant, docId));
    this.peerStore = this.initPeers(tenant);
    tenant.context.add(this.peerStore);
    this.connections = this.connectPeers(this.peerStore.truth);
  }
  contextChanged(tenant, docId) {
    log(`${tenant.id}: sharing`, docId);
    const store = tenant.context.get(docId);
    this.forEachConnection(c => this.maybeShareStore(c, store));
  }
  maybeShareStore({database}, store) {
    if (store.isShared()) {
      log(`ADDING "${store.id}" to "${database.id}"`);
      database.add(store);
    } else {
      if (database.get(store.id)) {
        log(`REMOVING "${store.id}" from (sharing) "${database.id}"`);
        database.remove(store);
      }
    }
  }
  initPeers(tenant) {
    //const id = `${tenant.id}:peers`;
    const id = `peers:store:peers:[Peer]:default:${tenant.id}`;
    // [arcid]:store:[name]:[type]:[tags]:[tenantid]
    const peerStore = new Store(this.tenant.id, id);
    const peers = tenant.peers;
    peerStore.change(truth => {
      truth.data = peers;
    });
    return peerStore;
  }
  connectPeers({data: peers}) {
    const connections = {};
    Object.keys(peers).forEach(peer =>
      connections[peer] = new Connection(this, peer)
    );
    return connections;
  }
  forEachConnection(iter) {
    if (this.connections) {
      Object.values(this.connections).forEach(iter);
    }
  }
  // gather up novel stores from connection databases into a master database
  captureStores(database) {
    //this.forEachConnection(c => c.database.forEachStore(store => !database.get(store.id) && log('capture', store)));
    this.forEachConnection(c => c.database.forEachStore(store => {
      if (!database.get(store.id)) {
        database.add(store);
      }
    }));
  }
  changed() {
    this.captureStores(this.tenant.context);
    this.fire('change');
  }
}
