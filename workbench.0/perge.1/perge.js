const {Automerge, Peer} = window;

export class Perge {
  constructor (actorId, config) {
    config = config || {};
    this._connections = {};
    this._actorId = actorId;
    this._peerInstance = config.peerInstance || new Peer(this._actorId);
    this._docSet = config.docSet || new Automerge.DocSet();
    this._encode = config.encode || JSON.stringify;
    this._decode = config.decode || JSON.parse;
    this._peerInstance.on('connection', conn => {
      conn.on('data', msg => {
        // double-tap a zombie connection
        if (!this._connections[conn.peer]) {
          console.log('recieved a message from a zombie connection');
          conn.close();
          return;
        }
        //this.connect(conn.peer, conn);
        // this here is an Automerge connection, not a Peer connection
        const connect = this._connections[conn.peer];
        connect.receiveMsg(this._decode(msg));
      });
      conn.on('error', msg => {
        this.onPeerError(msg, conn);
      });
    });
  }
  onlostpeer(conn) {
    // abstractish
  }
  onPeerError(msg, conn) {
    //console.warn('Perge::connection error:', msg, conn);
  }
  get docSet () {
    return this._docSet;
  }
  connect (id, conn) {
    if (this._connections[id]) return;
    const peer = conn || this._peerInstance.connect(id);
    const connection = this._connections[id] = new Automerge.Connection(this._docSet, msg => {
      peer.send(this._encode(msg));
    });
    //peer.on('disconnected', () => {
    peer.on('close', () => {
      connection.close();
      delete this._connections[id];
      this.onlostpeer(peer);
    });
    connection.open();
  }
  select(id) {
    const doc = this.docSet.getDoc(id) || Automerge.init(this._actorId);
    return (fn, ...args) => {
      const newDoc = fn(doc, ...args);
      this.docSet.setDoc(id, newDoc);
      return newDoc;
    };
  }
  subscribe(idOrSetHandler, docHandler) {
    if (typeof idOrSetHandler === 'function') {
      this.docSet.handlers = this.docSet.handlers.add(idOrSetHandler);
      return () => this.docSet.handlers = this.docSet.handlers.delete(idOrSetHandler);
    }
    if (typeof idOrSetHandler === 'string') {
      const handler = (docId, doc) => {
        if (docId === idOrSetHandler) docHandler(doc);
      };
      this.docSet.handlers = this.docSet.handlers.add(handler);
      return () => this.docSet.handlers = this.docSet.handlers.delete(handler);
    }
  }
}
