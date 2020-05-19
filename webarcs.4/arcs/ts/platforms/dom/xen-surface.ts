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

import {Surface} from '../../core/surface.js';
import {XenComposer} from './xen-composer.js';
import {dom} from '../../utils/dom.js';
import {logFactory} from '../../utils/log.js';

const log = logFactory(logFactory.flags.composer, 'xen-surface', 'tomato');

export class XenSurface extends Surface {
  root;
  container;
  useShadowRoot;
  constructor(container, useShadowRoot?) {
    super();
    this.useShadowRoot = useShadowRoot;
    this.container = container;
    this.root = dom('div', {
      id: `arcs-surface`,
      style: 'flex: 1; display: flex; flex-direction: column;'
    }, container);
  }
  protected async createComposerInstance(id) {
    log(`createComposerInstance("${id}")`)
    // inert really
    const node = dom('div', {
      id: `arc`,
      style: 'Xflex: 1; display: flex; flex-direction: column;',
      //hidden: true
    }, this.root);
    return new XenComposer(node, this.useShadowRoot);
  }
  get activeXenComposer() {
    return this.activeComposer as XenComposer;
  }
  composerActivated(composer) {
    if (this.activeXenComposer) {
      //this.activeXenComposer.root.hidden = true;
      this.activeXenComposer.root.style.display = 'none';
    }
    super.composerActivated(composer);
    if (this.activeXenComposer) {
      //this.activeXenComposer.root.hidden = false;
      this.activeXenComposer.root.style.display = 'flex';
    }
  }
};
