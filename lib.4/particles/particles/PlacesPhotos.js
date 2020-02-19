/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

self.defineParticle(({Particle}) => {

  const service = `https://xenonjs.com/services/http/php`;
  const photoService = `${service}/place-photo.php`;

  return class extends Particle {

    get template() {
      return Particle.html`

  <div style="padding: 12px; border: 2px solid green;">
    <div unsafe-html="{{photos}}"></div>
  </div>

      `;
    }
    update({placesJson}) {
      if (placesJson !== this.placesJson) {
        this.placesJson = placesJson;
        this.places = JSON.parse(placesJson);
        const model = this.render();
        this.renderModel(model);
      }
    }
    render() {
      if (this.places) {
        return {
          photos: this.renderPlacesHtml(this.places)
        };
      }
    }
    renderPlacesHtml(places) {
      // TODO(sjmiles): html should not be accepted without a sanitizer
      const urls = this.renderPlaces(places);
      const imgs = urls.map(({photo}) => `<img height="64" src="${photo}"></img>`).join();
      return `<div>${imgs}</div>`;
    }
    renderPlaces(places) {
      return places.map(place => this.renderPlace(place));
    }
    renderPlace(place) {
      const photo = this.getPhotoUrl(place) || place.icon;
      return {photo};
    }
    getPhotoUrl({photos}) {
      if (photos && photos.length) {
        return `${photoService}?maxwidth=128&photoreference=${photos[0].photo_reference}`;
      }
    }
  };

});
