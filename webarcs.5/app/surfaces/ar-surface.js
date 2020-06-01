/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {XenSurface} from '../../arcs/build/platforms/dom/xen-surface.js';
import {XenComposer} from '../../arcs/build/platforms/dom/xen-composer.js';
import {dom} from '../../arcs/build/utils/dom.js';

export class ArSurface extends XenSurface {
  createComposerInstance(id) {
    //log(`createComposerInstance("${id}")`)
    const iframe = dom('iframe', {
      id: `arc`,
      style: 'flex: 1; display: flex; flex-direction: column;',
      hidden: true,
      src: './ar-frame.html'
    }, this.root);
    return new Promise(resolve => {
      setTimeout(() => {
        const doc = iframe.contentWindow.document;
        const node = doc.body.appendChild(doc.createElement('div'));
        node.style.border = '3px solid magenta';
        // second parameter disables shadow-root
        resolve(new XenComposer(node, false));
      }, 2000);
    });
  }
  composerActivated(composer) {
    if (this.activeXenComposer) {
      this.activeXenComposer.root.hidden = true;
    }
    super.composerActivated(composer);
    if (this.activeXenComposer) {
      this.activeXenComposer.root.hidden = null;
    }
  }
}

