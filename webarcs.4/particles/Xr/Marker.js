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

<a-scene Xembedded arjs="sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3;">
  <a-assets>
    <a-asset-item id="animated-asset" src="../../../assets/xr/CesiumMan.gltf"></a-asset-item>
  </a-assets>
  <a-marker type="barcode" value="6" size="0.1" emitevents="true" hue:light="18">
    <a-box position="0 0.5 0" color="yellow"></a-box>
  </a-marker>
  <a-marker id="animated-marker" type="barcode" value="7" size="0.1" emitevents="true" hue:light="2">
    <a-entity gltf-model="#animated-asset" scale="2"></a-entity>
  </a-marker>
  <a-entity camera></a-entity>
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
