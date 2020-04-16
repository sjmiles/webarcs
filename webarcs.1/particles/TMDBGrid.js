/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

export const particle = ({Particle, log}) => {

const template = Particle.html`

  <div style="padding: 12px; white-space: normal;">
    <div on-click="onTileClick">{{tiles}}</div>
  </div>

  <template tile>
    <img key$="{{id}}" title="{{name}}" width="86" height="128" src="{{poster}}" style="border: 1px solid black; margin-right: 1px;">
  </template>
`;

return class extends Particle {
  get template() {
    return template;
  }
  update({tmdbResults}, {selection}) {
    if (tmdbResults) {
      const tmdbSelection = Object.values(tmdbResults).find(({id}) => id === selection);
      this.output({tmdbSelection});
    }
  }
  render({tmdbResults}) {
    if (tmdbResults) {
      const sorted = Object.values(tmdbResults);
      sorted.sort((a, b) => -String(a.date).localeCompare(String(b.date)));
      const tiles = this.renderTiles(sorted);
      return {
        tiles
      };
    }
  }
  renderTiles(results) {
    const models = results.map(t => ({
      id: t.id,
      name: t.name,
      poster: `https://xenonjs.com/services/http/php/tmdb-image.php?w342${t.poster_path}`
    }));
    return {
      $template: 'tile',
      models
    };
  }
  onTileClick({data: {key: selection}}) {
    this.state = {selection};
  }
};

};
