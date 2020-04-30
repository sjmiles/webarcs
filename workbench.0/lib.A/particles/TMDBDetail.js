/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */


export const particle = ({Particle}) => {

const template = Particle.html`

<style>
  [card] {
    height: 400px;
    /* width: 400px; */
    background-size: cover;
    background-position: center top;
    vertical-align: bottom;
  }
  [scrim] {
    height: 100%;
    background-color: rgba(3, 3, 3, 0.5);
  }
  [text] {
    padding: 12px;
    font-size: 16px;
    color: #eeeeee;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>

<div card xen:style="{{style}}">
  <div scrim>
    <div text>{{overview}}</div>
  </div>
</div>

`;

return class extends Particle {
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
      const {backdrop_path, overview, poster_path} = tmdbSelection;
      // TODO(sjmiles): the TMDB api suggests backdrops and posters support different widths,
      // but I only get results for backdrop when I use the poster-width (780) instead of the
      // documented backdrop-width (720)
      const image = backdrop_path ? `w780${backdrop_path}` : `w780${poster_path}`;
      const backdrop = `https://xenonjs.com/services/http/php/tmdb-image.php?${image}`;
      return {
        overview,
        style: `background-image: url('${backdrop}');`
      };
    }
  }
};

};
