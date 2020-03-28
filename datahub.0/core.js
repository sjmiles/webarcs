/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

export class Store {
  constructor(id, tags) {
    this.id = id;
    this.tags = tags || [];
    this.truth = {};
  }
  setTruth(truth) {
    this.truth = truth;
    this.onchanged();
  }
  mutate(mutator) {
    mutator(this.truth);
    this.onchanged();
  }
  onchanged() {
  }
  
};

export class Database {
  constructor(id) {
    this.id = id;
    this.stores = {};
  }
  create(id, tags) {
    return this.stores[id] = new Store(id, tags);
  }
  require(id, tags) {
    return this.stores[id] || this.create(id, tags);
  }
  // require(id) {
  //   const did = id.split(':').shift();
  //   if (!did) {
  //     throw 'Bad id format';
  //   }
  //   if (did === deviceId) {
  //     return this.requireLocal(id);
  //   }
  //   return this.requireRemote(id);
  // }
  // requireLocal(id) {
  //   return (this.stores[id] = this.stores[id] || new Store(id));
  // }
  requireRemote(id) {
    return this.stores[id];
    //return new Store(id);
  }
  queryStore(id) {
    return JSON.parse(localStorage.getItem(store.id));
  }
  persist() {
    localStorage.setItem(this.id, JSON.stringify(Object.keys(this.stores)));
    Object.values(this.stores).forEach(s => this.persistStore(s));
  }
  persistStore(store) {
    localStorage.setItem(store.id, JSON.stringify(store.truth));
  }
  reify() {
    const keys = JSON.parse(localStorage.getItem(this.id));
    if (keys) {
      keys.forEach(key => this.reifyStore(key));
    }
  }
  reifyStore(key) {
    const store = this.create(key);
    const value = JSON.parse(localStorage.getItem(store.id));
    store.setTruth(value);
  }
};

export class ArcEnvironment {
  constructor(id, composer, database) {
    this.id = id;
    this.composer = composer;
    this.database = database;
  }
}

export class Composer {
  constructor(root) {
    this.root = root;
  }
};
