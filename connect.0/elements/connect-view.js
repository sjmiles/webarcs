/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Xen} from '../../xen/xen-async.js';

const template = Xen.html`
<style>
  :host {
    display: inline-block;
    position: relative;
    box-sizing: border-box;
    width: 212px;
    height: 212px;
    overflow: hidden;
    border-radius: 200px;
    background-color: red;
    zoom: 0.75;
  }
  * {
    box-sizing: border-box;
  }
  [container] {
    width: 212px;
    height: 212px;
    border-radius: 200px;
    background-color: rgba(255, 255, 255, 0.8);
  }
  [ring] {
    display: inline-flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 48px;
    border-radius: 50%;
    /*
    background-color: rgba(255, 255, 255, 0.9);
    border: 0 solid orange;
    background-color: #e4e4e4;
    */
  }
  [inner] {
    height: 116px;
    width: 116px;
    border-width: 6px;
    border-style: solid;
    background-color: white;
    font-size: 14px;
    background-color: rgba(0, 0, 0, 0.1);
  }
  [mini] {
    display: inline-block;
    position: absolute;
    height: 38px;
    width: 38px;
    border: 0;
    padding: 0;
    /*border: 3px solid green;
    font-size: 9px; */
    top: 28px;
    background-color: white;
    border-radius: 50%;
  }
  [mini] > img {
    height: 38px;
    width: 38px;
    padding: 4px;
    border-radius: 50%;
    border: 4px solid green;
    border-color: inherit;
  }
  [hidden] {
    display: none;
  }
  [detail] {
    padding: 8px;
    font-size: 12px;
  }
</style>

<div container on-click="onClick">
  <div ring hidden="{{hideRing}}">
    <div peers>{{peers}}</div>
    <div ring inner xen:style="{{ringStyle}}">
      <span>{{name}}</span>
    </div>
  </div>
  <div detail hidden="{{hideDetail}}" unsafe-html="{{dump}}"></div>
</div>
`;

const peerTemplate = Xen.Template.html`
  <div ring mini xen:style="{{style}}" title="{{persona}}"><img src="{{avatar}}"></div>
`;

export class ConnectView extends Xen.Async {
  static get observedAttributes() {
    return ['connection', 'device', 'color'];
  }
  get template() {
    return template;
  }
  render({/*connection,*/ device, color}, {detail}) {
    const rings = device.connections ? device.connections.map(this.renderRing) : [];
    // const rings = [
    //   {id: '1larry:mobile', avatar: '/avatars/user (17).png'},
    //   {id: '2moe:desktop', avatar: '/avatars/user (18).png'},
    //   {id: '3larry:mobile', avatar: '/avatars/user (19).png'},
    //   {id: '4moe:desktop', avatar: '/avatars/user (20).png'},
    //   {id: 'larry:mobile', avatar: '/avatars/user (21).png'},
    //   {id: 'moe:desktop', avatar: '/avatars/user (22).png'},
    //   {id: 'larry:mobile', avatar: '/avatars/user (23).png'},
    //   {id: 'moe:desktop', avatar: '/avatars/user (22).png'},
    //   {id: 'larry:mobile', avatar: '/avatars/user (23).png'},
    //   {id: 'larry:mobile', avatar: '/avatars/user (23).png'},
    //   {id: 'larry:mobile', avatar: '/avatars/user (0).png'},
    // ].map(this.renderRing);
    return {
      name: device.id,
      hideRing: Boolean(detail),
      hideDetail: Boolean(!detail),
      ringStyle: `border-color: ${color};`,
      //dump: connection.dump(),
      peers: {
        template: peerTemplate,
        models: rings
      }
    };
  }
  renderRing(peer, i) {
    const arc = 32;
    const radius = 80;
    const center = 88;
    const color = ['green', 'lightblue', 'red', 'brown', 'silver'][i%5];
    const theta = Math.PI/180*(arc*i - 70);
    const x = Math.floor(Math.cos(theta) * radius) + center;
    const y = Math.floor(Math.sin(theta) * radius) + center;
    const avatar = peer.avatar || '/avatars/user (0).png';
    return {
      persona: peer.remote.id, //.split(':').join(' '),
      style: `top: ${y}px; left: ${x}px; border-color: ${color}; text-align: center; opacity: ${peer.open ? 1.0 : 0.3};`,
      avatar
    };
  }
  onClick() {
    this.state = {detail: !this.state.detail};
  }
}
