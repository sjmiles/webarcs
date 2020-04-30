/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Store} from './db/store.js';
import {EditProfile} from './particles/edit-profile.js';

const eltName = 'edit-profile';
window.customElements.define(eltName, EditProfile);

const profileName = `profile:shared,readonly:[BasicProfile]`;

export const installEditProfileRecipe = (device, arc) => {
  //
  // require stores
  //
  const profileStore = new Store(arc.env.database, arc.requireStore(profileName));
  //
  // create particles
  //
  const editProfile = document.createElement(eltName);
  //
  // attach data to particles
  //
  const updateHandles = () => {
    editProfile.profile = Store.serialize(profileStore.data.profile);
  };
  const loc = arc.onchange;
  arc.onchange = () => {
    updateHandles();
    loc && loc();
  };
  arc.onchange();
  //
  // consume particle output
  //
  editProfile.onoutput = editProfileConsumerFactory(arc, profileStore);
  //
  arc.composer.root.appendChild(editProfile);
};

const editProfileConsumerFactory = (arc, targetStore) => {
  return output => {
    if (output) {
      const {profile} = output;
      if (profile) {
        const keys = Object.keys(profile);
        if (keys.length) {
          targetStore.change(truth => {
            if (!truth.profile) {
              truth.profile = {};
            }
            keys.forEach(key => {
              const value = profile[key];
              if (value !== undefined) {
                truth.profile[key] = profile[key];
              }
            });
          });
          arc.changed();
        }
      }
    }
  };
};
