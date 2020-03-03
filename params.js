/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const url = new URL(document.URL);
const params = url.searchParams;

export const Params = class {
  static getParam(name) {
    return params.get(name);
  }
  static setParam(name, value) {
    params.set(name, value);
    window.history.replaceState({}, '', decodeURIComponent(url.href));
  }
  static qualifyName(name) {
    return `${this.prefix}${name}`;
  }
  static fetchValue(name) {
    return localStorage.getItem(this.qualifyName(name));
  }
  static storeValue(name, value) {
    return localStorage.setItem(this.qualifyName(name), value);
  }
  static fetchJsonValue(name) {
    return JSON.parse(localStorage.getItem(this.qualifyName(name)));
  }
  static storeJsonValue(name, value) {
    return localStorage.setItem(this.qualifyName(name), JSON.stringify(value));
  }
};

Params.prefix = '';
