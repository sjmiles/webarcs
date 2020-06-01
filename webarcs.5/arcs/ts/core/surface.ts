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
 * @module core
 */

import {logFactory} from '../utils/log.js';
import {Composer} from './composer.js';

const log = logFactory(logFactory.flags.composer, 'surface', 'tomato');

export class Surface {
  activeComposer: Composer;
  async createComposer(id): Promise<Composer> {
    const composer = await this.createComposerInstance(id);
    composer.listen('activate', () => this.composerActivated(composer));
    return composer;
  }
  protected async createComposerInstance(id) {
    // inert really
    return new Composer();
  }
  protected composerActivated(composer) {
    this.activeComposer = composer;
  }
  // TODO(sjmiles): can we just use this and skip the event stuff?
  activateComposer(composer) {
    this.composerActivated(composer);
  }
};
