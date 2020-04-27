/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

export const particle = ({Particle, fetch, log}) => {

//const log = (...args) => null; //console.log('[TMDBSearch]::', ...args);
const service = `https://xenonjs.com/services/http/php/tmdb.php`;

return class extends Particle {
  update({query}) {
    query = 'star trek';
    if (query && query !== this.query) {
      this.query = query;
      log(`awaiting query [${query}]`);
      this.awaitResults(query);
    }
  }
  async awaitResults(query) {
    if (!this.receiving) {
      this.receiving = true;
      try {
        const tmdbResults = await this.fetchResults(query);
        log('fetchResults got ', tmdbResults);
        this.output({tmdbResults});
      } finally {
        this.receiving = true;
      }
    }
  }
  async fetchResults(query) {
    const response = await fetch(`${service}/?query=search/multi/?query=${query}`);
    const data = await response.json();
    if (data.results) {
      return this.processResults(data.results);
    }
  }
  processResults(results) {
    // support filtering
    const filter = result => result.poster_path;
    // support mapping fields to our entity schema
    const map = result => this.resultToEntity(result);
    // construct entity data
    const list = results.filter(filter).map(map);
    // convert to collection
    const collection = {};
    list.forEach(entity => collection[entity.id] = entity);
    return collection;
  }
  resultToEntity({id, name, title, media_type, adult, overview, backdrop_path, poster_path, first_air_date, release_date}) {
    return {
      id: `${id}`,
      name: name || title,
      media_type,
      adult: Boolean(adult),
      backdrop_path,
      poster_path,
      overview,
      date: first_air_date || release_date
    };
  }
};

};
