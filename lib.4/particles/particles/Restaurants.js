/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

const service = `https://xenonjs.com/services/http/php`;
const placesService =`${service}/places.php`;
//const photoService = `${service}/place-photo.php`;
const searchRadius = 5000;
const location = {latitude: 38.1746957, longitude:-122.2540443};

const makePlacesUrl = ({loc, radius, type}) =>
  `${placesService}?${loc ? `location=${loc}&` : ''}radius=${radius}&type=${type}`;
  //`${placesService}?location=${loc}&radius=${radius}&type=${type}`;

self.defineParticle(({Particle}) => class extends Particle {
  get template() {
    return Particle.html`

<div style="padding: 12px; border: 2px solid green;">
  <pre>{{placeNames}}</pre>
</div>

    `;
  }
  update({places}) {
    if (!places) {
      this.awaitPlaces();
    }
  }
  async awaitPlaces() {
    if (!this.fetching) {
      this.fetching = true;
      this.places = await this.fetchPlaces(location);
      this.placesJson = JSON.stringify(this.places.map(({name, photos}) => ({name, photos})), null, ' ');
      console.log('Restaurants::', this.places);
      this.output({placesJson: this.placesJson});
      this.renderModel(this.render({placesJson: this.placesJson}));
    }
  }
  async fetchPlaces(location) {
    const placesUrl = makePlacesUrl({
      loc: `${location.latitude},${location.longitude}`,
      radius: `${searchRadius}`,
      type: `restaurant`
    });
    const response = await fetch(placesUrl);
    const result = await response.json();
    const places = (result.results || []);
    return places;
  }
  render({placesJson}) {
    if (placesJson) {
      const places = JSON.parse(placesJson);
      const placeNames = JSON.stringify(places.map(({name}) => name), null, '  ');
      return {placeNames};
    }
  }
});
