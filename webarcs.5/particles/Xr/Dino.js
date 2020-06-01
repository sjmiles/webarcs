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

<a-scene Xembedded>
  <a-assets timeout="30000">
    <a-asset-item id="spinosaurus" src="../../../assets/xr/dino-model.glb"></a-asset-item>
  </a-assets>

  <a-camera position="0 1.2 0"></a-camera>

  <a-entity id="dino" position="-1 0 -3" scale="0.5 0.5 0.5">
    <a-entity position="0 2.15 0" rotation="0 55 0"
              gltf-model="#spinosaurus"
              animation-mixer
              shadow="cast: true; receive: false"></a-entity>
  </a-entity>

</a-scene>
`;

return class extends Particle {
  get template() {
    return template;
  }
  render() {
    return {};
  }
};

};
