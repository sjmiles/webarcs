/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

/**
 * @packageDocumentation
 * @module devices
 */

import {Xen} from '../../../../../xen/xen-async.js';
import {logFactory} from '../../utils/log.js';
import {IconsCss} from '../../../../../assets/css/icons.css.js';
import {Slot, Composer} from '../../core/composer.js';

const log = logFactory(logFactory.flags.render, 'render', 'red');

interface RenderPacket {
  id;
  container;
  content: {
    template,
    model
  }
};

const sanitizeId = id => id.replace(/[)(:]/g, '_');

export class XenComposer extends Composer {
  root;
  useShadowRoot;
  constructor(root?, useShadowRoot?) {
    super();
    this.root = root;
    this.useShadowRoot = useShadowRoot;
  }
  setRoot(root) {
    this.root = root;
    this.processPendingPackets();
  }
  findContainer(container) {
    let node = this.root;
    if (container && container !== 'root') {
      const [particle, slot] = container.split('#');
      const owner = deepQuerySelector(node, `#${sanitizeId(particle)}`);
      if (!owner) {
        return null;
      }
      node = deepQuerySelector(owner, `[slot=${slot}]`);
    }
    return node;
  }
  generateSlot(id, template, parent): Slot {
    if (!parent) {
      throw Error('Cannot generateSlot without a parent node');
    }
    const container = parent.appendChild(document.createElement('div'));
    container.style = 'flex: 1; display: flex; flex-direction: column;'
    container.setAttribute('zlot', id);
    container.id = sanitizeId(id);
    const root = this.useShadowRoot ? container.attachShadow({mode: `open`}) : container;
    const slot = Xen.Template
      .stamp(template)
      .appendTo(root)
      .events(this.mapEvent.bind(this, id))
    ;
    root.appendChild(Object.assign(document.createElement('style'), {innerText: IconsCss}));
    return slot;
  }
  mapEvent(pid, node, type, handler) {
    node.addEventListener(type, e => {
      const data = {key: null, value: null};
      // walk up the event path to find the topmost key/value data
      const branch = e.composedPath();
      for (let elt of branch) {
        if ('key' in elt) {
          data.key = elt.key;
        } else if (elt.hasAttribute('key')) {
          data.key = elt.getAttribute('key');
        }
        if ('value' in elt) {
          data.value = elt.value;
        } else if (elt.hasAttribute('value')) {
          data.key = elt.getAttribute('value');
        }
        if (e.currentTarget === elt) {
          break;
        }
      }
      const eventlet = {name, handler, data};
      this.onevent(pid, eventlet);
    });
  }
};

const deepQuerySelector = (root, selector) => {
  const find = (element, selector) => {
    let result;
    while (element && !result) {
      result =
          (element.matches && element.matches(selector) ? element : null)
          || find(element.firstElementChild, selector)
          || (element.shadowRoot && find(element.shadowRoot.firstElementChild, selector))
          ;
      element = element.nextElementSibling;
    }
    return result;
  };
  return find(root || document.body, selector);
};

const deepQuerySelectorAll = (root, selector) => {
  const findAll = (element, selector) => {
    let result = [];
    while (element) {
      result = result.concat(
          (element.matches && element.matches(selector) ? [element] : [])
          || findAll(element.firstElementChild, selector)
          || (element.shadowRoot && findAll(element.shadowRoot.firstElementChild, selector))
      );
      element = element.nextElementSibling;
    }
    return result;
  };
  return findAll(root || document.body, selector);
};

export const showSlots = () => {
  const slots = deepQuerySelectorAll(document.body, `[zlot]`);
  console.warn(slots);
};
