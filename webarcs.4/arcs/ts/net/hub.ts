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
const log = logFactory(logFactory.flags['hub'] || logFactory.flags['all'], 'endpoint', 'lawngreen');

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
  //log;
  arcSharesStore;
  constructor(hub, peer) {
    this.hub = hub;
    this.endpoint = new Endpoint(peer, hub.tenant.id);
    this.database = this.initDatabase(hub.tenant, this.endpoint);
    this.arcSharesStore = this.initArcShares(hub.tenant, this.endpoint);
    this.conn = new Automerge.Connection(this.database.truth, msg => this.send(msg));
    //log(`connecting to [${endpoint.id}] ...`);
    this.open();
  }
  initDatabase(tenant, endpoint) {
    const database = new Database(`${tenant.id}:${endpoint.id}:db`);
    database.ownerId = tenant.id;
    database.listen('doc-changed', docId => this.databaseChanged(docId));
    return database;
  }
  databaseChanged(docId) {
    this.hub.changed();
  }
  initArcShares(tenant, endpoint) {
    // TODO(sjmiles): duplex share has inverted `${tenant.id}:${endpoint.id}` depending
    // on which end you are on.
    const id = `connection:store:arcshares:[ArcShareMeta]:private,volatile`; //:${tenant.id}:${endpoint.id}`;
    // [arcid]:store:[name]:[type]:[tags]:[tenantid]
    const store = new Store(tenant.id, id);
    this.database.add(store);
    return store;
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
    //this.hub.log(`messages pending (connecting to ${this.endpoint.id})`);
    this.pending.push(msg);
  }
  connected() {
    //this.hub.log(`... connected to [${this.endpoint.id}]`);
    this.send = this.sendToEndpoint;
    this.pending.forEach(msg => this.send(msg));
    this.pending = null;
  }
  sendToEndpoint(msg) {
    //this.hub.log(`send to %c[${this.endpoint.id}]%c: `, 'font-weight: bold', 'font-weight: normal', msg);
    this.endpoint.send(msg);
  }
  receive(msg) {
    // TODO(sjmiles): simulate asynchrony of a real communication channel
    setTimeout(() => this._receive(msg), 0);
  }
  _receive(msg) {
    this.hub.log(`[${this.hub.tenant.id}] received: `, msg);
    //console.group(`[${this.hub.tenant.id}] received: `, msg)
    const doc = this.conn.receiveMsg(msg);
    if (doc) {
      const fixed = Store.fix(doc);
      if (fixed !== doc) {
        this.hub.log(this.hub.tenant.id, msg.docId, 'needed fixup');
      }
      const store = this.database.get(msg.docId);
      if (store) {
        store.truth = fixed;
      } else {
        this.hub.log(`receive: "${this.database.id}" does not contain store "${msg.docId}"`);
      }
    }
    //console.groupEnd();
  }
}

export class Hub extends EventEmitter {
  tenant;
  database;
  peerStore;
  connections;
  log;
  constructor(tenant) {
    super();
    // for local (loopback) testing
    hubs.push(this);
    this.log = logFactory(logFactory.flags['hub'] || logFactory.flags['all'], `hub[${tenant.id}]`, 'green');
    this.tenant = tenant;
    this.peerStore = this.initPeers(tenant);
    tenant.context.add(this.peerStore);
    this.connections = this.connectPeers(this.peerStore.truth);
    this.initContext(tenant);
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
  initContext(tenant) {
    // THIS MEANS ANYTHING IN tenant.context IS POTENTIALLY SHARED
    tenant.context.forEachStore(store => {
      this.maybeShareStoreWithConnections(store);
    });
    // if a context store changes, reconsider it's sharing status
    tenant.context.listen('doc-changed', docId => this.contextChanged(tenant, docId));
  }
  contextChanged(tenant, docId) {
    this.log(`${tenant.id}: contextChanged:`, docId);
    const store = tenant.context.get(docId);
    this.maybeShareStoreWithConnections(store);
  }
  maybeShareStoreWithConnections(store) {
    this.forEachConnection(c => this.maybeShare(c, store));
  }
  maybeShare(connection, store) {
    if (store.meta.type === 'SystemMetadata') {
      this.maybeShareArcs(connection, store);
    }
    this.maybeShareStore(connection, store);
  }
  maybeShareStore({endpoint, database}, store) {
    // share with oneself everything that isn't on fire
    if (!store.tags.includes('volatile')) {
      // TODO(sjmiles): ug, fix!
      const endpointPersona = endpoint.id.split(':')[0];
      if (endpointPersona == this.tenant.persona) {
        this.shareStore(database, store);
      }
    } else if (store.tags.includes('public')) {
      this.shareStore(database, store);
    } else if (database.get(store.id)) {
      //this.unshareStore(database, store);
    }
  }
  shareStore(database, store) {
    this.log(`ADDING "${store.id}" to "${database.id}"`);
    // informational only
    store.wasShared = true;
    database.add(store);
  }
  unshareStore(database, store) {
    this.log(`REMOVING "${store.id}" from (sharing) "${database.id}"`);
    // informational only
    store.wasShared = false;
    database.remove(store);
  }
  maybeShareArcs(connection, store) {
    const {endpoint, arcSharesStore} = connection;
    const selected = {};
    const shares = store.pojo.data;
    // TODO(sjmiles): persona should be available directly
    const connectionPersona = endpoint.id.split(':')[0];
    if (shares) {
      this.log('maybeShareArcs with', endpoint.id, shares);
      Object.values(shares).forEach(share => {
        const {id, meta} = share as any;
        const {sharing} = meta as any;
        const shareWith = sharing && sharing.shareWith || [];
        const shouldShare = shareWith.some(friend => {
          // TODO(sjmiles): ditto
          const shareWithPersona = friend.split(':')[0];
          if (shareWithPersona === this.tenant.persona) {
            this.log(`sharing arc "${id}" has eponymous "shareWith" for "${shareWithPersona}"`);
            return false;
          }
          if (shareWithPersona === connectionPersona) {
            this.log(`sharing arc "${id}" with "${connectionPersona}"`);
          }
          return shareWithPersona === connectionPersona;
        });
        if (shouldShare) {
          selected[id] = share;
          this.log('SHARING ARC STORES', share['stores']);
          share['stores'].forEach(({id}) => {
            const store = this.tenant.context.get(id);
            this.maybeShareArcStore(connection, store);
          });
        }
      });
    }
    this.log(`total sharing with "${connectionPersona}" =`, selected);
    arcSharesStore.change(doc => doc.data = selected);
  }
  maybeShareArcStore({endpoint, database}, store) {
    if (!store.tags.includes('volatile') && !store.tags.includes('private')) {
      this.shareStore(database, store);
    } else if (database.get(store.id)) {
      //this.unshareStore(database, store);
    }
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
      //if (/*!store.tags.includes('volatile') &&*/ !database.get(store.id)) {
        // informational only
        store.wasShared = true;
        database.add(store);
      //}
    }));
  }
  changed() {
    this.captureStores(this.tenant.context);
    this.fire('change');
  }
}
