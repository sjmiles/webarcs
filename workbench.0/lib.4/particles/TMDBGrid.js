/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Particle} from '../core/particle.js';

const template = Particle.html`

  <div style="padding: 12px; border: 2px solid green;">
    <div unsafe-html="{{tileHtml}}"></div>
  </div>

      `;

export const TMDBGrid = class extends Particle {
  get template() {
    return template;
  }
  update({tmdbResults}) {
    this.output({tmdbResults});
  }
  render({tmdbResults}) {
    if (tmdbResults) {
      const sorted = tmdbResults.slice(0);
      sorted.sort((a, b) => -String(a.date).localeCompare(String(b.date)));
      const tileHtml = this.renderTileHtml(sorted);
      return {tileHtml};
    }
  }
  renderTileHtml(results) {
    // TODO(sjmiles): html should not be accepted without a sanitizer
    const tiles = results.map(t => {
      const poster = `https://xenonjs.com/services/http/php/tmdb-image.php?w342${t.poster_path}`;
      //const backdrop = `https://xenonjs.com/services/http/php/tmdb-image.php?w342${t.backdrop_path}`;
      return Particle.html`
<div style="display: inline-block; width: 128px; height: 142px; overflow: hidden; text-align: center; margin: 4px; border: 1px dotted gray; padding: 4px;">
  <img height="128" src="${poster}">
  <div style="font-size: 9px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${t.name}</div>
</div>
      `;
    }).join('');
    return tiles;
  }
};
