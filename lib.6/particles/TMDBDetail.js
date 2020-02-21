/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Particle} from '../js/core/particle.js';

const template = Particle.html`

  <div unsafe-html="{{detailHtml}}"></div>

`;

export const TMDBDetail = class extends Particle {
  get template() {
    return template;
  }
  update({tmdbSelection}) {
    if (tmdbSelection && (tmdbSelection.name !== this.lastName)) {
      this.lastName = tmdbSelection.name;
      this.output();
    }
  }
  render({tmdbSelection}) {
    if (tmdbSelection) {
      const detailHtml = this.renderDetailHtml(tmdbSelection);
      return {detailHtml};
    }
  }
  renderDetailHtml(selection) {
    // TODO(sjmiles): html should not be accepted without a sanitizer
    const t = selection;
    const backdrop = `https://xenonjs.com/services/http/php/tmdb-image.php?w342${t.backdrop_path}`;
    return Particle.html`
<div style="padding: 12px; height: 240px; width: 400px; background-image: url('${backdrop}'); background-size: cover; vertical-align: bottom;">
  <div style="font-size: 16px; color: #eeeeee; overflow: hidden; text-overflow: ellipsis;">${t.overview}</div>
</div>
      `;
  }
};
