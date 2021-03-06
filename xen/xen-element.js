/**
 * @license
 * Copyright (c) 2017 Google Inc. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

export const XenElementMixin = Base => class extends Base {
  constructor() {
    super();
    this._mounted = false;
    this._root = this;
    this.__configureAccessors();
    this.__lazyAcquireProps();
  }
  get _class() {
    // TODO(sjmiles): problem accessing class statics under polyfills can be fixed
    // by attaching _class reference to element constructors (not provided)
    return (this.constructor._class || this.constructor);
  }
  __configureAccessors() {
    // only do this once per prototype
    const p = Object.getPrototypeOf(this);
    if (!p.hasOwnProperty('__$xenPropsConfigured')) {
      p.__$xenPropsConfigured = true;
      const a = this._class.observedAttributes;
      a && a.forEach(n => {
        Object.defineProperty(p, n, {
          get() {
            return this._getProperty(n); // abstract
          },
          set(value) {
            this._setProperty(n, value); // abstract
          }
        });
      });
    }
  }
  __lazyAcquireProps() {
    const a = this._class.observedAttributes;
    a && a.forEach(n=>{
      if (n.toLowerCase() !== n) {
        console.error(`Xen: Mixed-case attributes are not yet supported, "${this.localName}.observedAttributes" contains "${n}".`);
      }
      if (this.hasOwnProperty(n)) {
        const value = this[n];
        delete this[n];
        this[n] = value;
      } else if (this.hasAttribute(n)) {
        this._setValueFromAttribute(n, this.getAttribute(n));
      }
    });
  }
  // provide hook for type coercion (attributes are always String valued)
  _setValueFromAttribute(name, value) {
    this[name] = value;
  }
  connectedCallback() {
    this._mount();
  }
  _mount() {
    if (!this._mounted) {
      this._mounted = true;
      this._doMount();
      this._didMount();
    }
  }
  _doMount() {
  }
  _didMount() {
  }
  _fire(eventName, detail, node, init) {
    const eventInit = init || {};
    eventInit.detail = detail;
    const event = new CustomEvent(eventName, eventInit);
    (node || this).dispatchEvent(event);
    return event.detail;
  }
};
