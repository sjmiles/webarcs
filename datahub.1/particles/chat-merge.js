/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Xen} from '../../xen/xen-async.js';

export class ChatMerge extends Xen.Async {
  static get observedAttributes() {
    return ['other', 'entries'];
  }
  constructor() {
    super();
  }
  update({other, entries}) {
    console.log('adding other to entries', other, entries);
    this.output({
      merged: {...entries, ...other}
    });
  }
  output(outputs) {
    this.onoutput && this.onoutput(outputs);
  }
}
