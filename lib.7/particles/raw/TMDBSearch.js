/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Particle} from '../../js/core/particle.js';

const log = (...args) => console.log('[TMDBSearch]::', ...args);
const service = `http://xenonjs.com/services/http/php/tmdb.php`;

export const TMDBSearch = class extends Particle {
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
    return results.filter(filter).map(map);
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
