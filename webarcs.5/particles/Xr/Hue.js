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

<a-scene
  vr-mode-ui="enabled: false"
  cursor="rayOrigin: mouse"
  arjs="sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3;"
>

  <a-assets>
    <a-asset-item id="switch-asset" src="../../../assets/xr/LightSwitch/scene.gltf"></a-asset-item>
  </a-assets>

  <a-marker cursor-listener type="barcode" value="6" size="0.1" emitevents="true" key="18" on-click="onSwitchClick">
    <a-entity gltf-model="#switch-asset" scale="15 15 25" rotation="90 0 0"></a-entity>
  </a-marker>

  <a-marker cursor-listener type="barcode" value="7" size="0.1" emitevents="true" key="2" on-markerfound="onMarkerFound" on-click="onSwitchClick">
    <a-entity gltf-model="#switch-asset" scale="15 15 25" rotation="90 0 0"></a-entity>
  </a-marker>

  <a-entity id="camera" camera>
    <a-entity id="cursor" cursor Xraycaster="far: 10000;"></a-entity>
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
  async light(id, onOff) {
    try {
      console.log(`attempting to turn light "${id}" ${onOff}`);
      const response = await fetch(`https://xenonjs.com/services/http/php/hue.php/?${id}/${onOff}`);
      console.log(response.statusText, response);
    } catch(x) {
      console.error(x);
    }
  }
  onMarkerFound({data: {key}}) {
    this.state.currentLight = Number(key);
  }
  onMarkerLost() {
    this.state.currentLight = -1;
  }
  onSwitchClick({data: {key}}) {
    log('onSwitchClick', key);
    // // click events are doubled, needs root cause
    // // this is just a workaround
    // if (child.squelch) {
    //   child.squelch = false;
    //   return;
    // }
    // child.squelch = true;
    // console.log(e);
    // //
    // const id = Number(marker.getAttribute('hue:light'));
    // if (id > 0) {
    //   console.log("CLICK! for", id);
    //   marker.onOff = !marker.onOff;
    //   this.light(id, marker.onOff ? 'on' : 'off');
    // }
  }
};

};
