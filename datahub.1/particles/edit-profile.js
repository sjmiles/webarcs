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
    display: flex;
    flex-direction: column;
    min-height: calc(100vh);
  }
  [center] {
    text-align: center;
  }
  [top] {
    padding: 16px 16px 32px 16px;
    min-width: 160px;
    box-sizing: border-box;
  }
  [bottom] {
    flex: 1;
    border-top: 1px solid silver;
    padding: 16px 16px 32px 16px;
  }
  [title] {
    text-align: left;
    padding-bottom: 16px;
  }
  [name] {
    padding-top: 32px;
  }
  avatar {
    display: inline-block;
    margin: 16px 0;
  }
  avatar > img {
    width: calc(78px * 2);
    height: calc(78px * 2);
    border: 1px solid black;
    border-radius: 50%;
  }
  [name] {
    padding: 6px;
    font-size: 125%;
  }
</style>

<div center top>
  <div title>My profile</div>
  <avatar><img src="{{avatarUrl}}"></avatar><br>
  <input name on-change="onNameInputChange" placeholder="Name" value="{{name}}"><br>
</div>
<div bottom>
  <input on-change="onAvatarInputChange" placeholder="AvatarUrl" value="{{avatarUrl}}">
  <div>{{friends}}</div>
</div>
`;

const friendTemplate =  Xen.html`
  <div>
    <avatar small><img src="{{avatarUrl}}"></avatar><span>{{name}}</span>
  </div>
`;

export class EditProfile extends Xen.Async {
  static get observedAttributes() {
    return ['profile'];
  }
  get template() {
    return template;
  }
  update({profile}, state) {
    if (profile && profile.name !== state.initName) {
      state.name = profile.name;
      state.initName = name;
    }
    if (profile && profile.avatarUrl !== state.initAvatarUrl) {
      state.avatarUrl = profile.avatarUrl;
      state.initAvatarUrl = profile.avatarUrl;
    }
    this.output({
      profile: {
        name: state.name,
        avatarUrl: state.avatarUrl || `../assets/user-128x128.png`
      }
    });
  }
  render({}, {name, avatarUrl}) {
    return {
      name: name || '',
      avatarUrl: avatarUrl || '',
      friends: this.renderFriends()
    };
  }
  renderFriends() {
    return {
      template: friendTemplate,
      models: ['A', 'B'].forEach(f => ({
        name: f,
        avatarUrl: '../assets/44.png'
      }))
    };
  }
  onNameInputChange(e) {
    this.state = {name: e.currentTarget.value};
  }
  onAvatarInputChange(e) {
    this.state = {avatarUrl: e.currentTarget.value};
  }
  output(outputs) {
    this.onoutput(outputs);
  }
  onoutput() {
  }
}
