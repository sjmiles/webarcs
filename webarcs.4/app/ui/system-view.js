/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Xen} from '../../../xen/xen-async.js';

const template = Xen.Template.html`
<style>
  :host {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-size: 16px;
    background-color: var(--ui-bg-4);
    padding: 12px;
    user-select: none;
  }
  * {
    box-sizing: border-box;
  }
  [row] {
    display: flex;
    align-items: center;
  }
  [flex] {
    flex: 1;
  }
  [notification] {
    cursor: pointer;
    border-radius: 128px;
    border: 1px solid #e0e0e0;
    background-color: white;
  }
  [notification]:hover {
    border: 1px solid orange;
  }
  tenant-icon {
    width: 40px;
    height: 40px;
    margin-right: 12px;
  }
</style>

<div>{{notifications}}</div>
`;

const notificationViewTemplate = Xen.html`
  <div style="padding: 0 0 8px;">
    <div row notification on-click="onNotificationClick" key="{{key}}">
      <tenant-icon avatar="{{avatar}}"></tenant-icon>
      <span unsafe-html="{{msg}}"></span>
      <span flex></span>
      <span key="{{key}}" on-click="onDeleteClick" style="color: #666; margin-right:16px;">x</span>
    </div>
  </div>
`;

export class SystemView extends Xen.Async {
  static get observedAttributes() {
    return ['tenant'];
  }
  get template() {
    return template;
  }
  get suggestions() {
    return this.tenant && this.tenant.suggestions || [];
  }
  _didMount() {
    // TODO(sjmiles): update periodically as a stopgap for observing 'suggestions' ... fix!
    setInterval(() => {
      if (this.suggestions && this.suggestions.length !== this.state.length) {
        this.state = {length: this.suggestions.length};
      }
    }, 500);
  }
  render() {
    return {
      notifications: this.renderNotifications(this.suggestions)
    };
  }
  renderNotifications(suggestions) {
    const models = suggestions.map(({userid, recipe, msg, avataricon}, i) => {
      if (recipe && !msg) {
        msg = `<b>${recipe}</b> is available.`;
      }
      const avatar = avataricon || `../assets/users/${userid || 'user'}.png`;
      return {
        key: i,
        avatar,
        msg
      };
    });
    return {
      template: notificationViewTemplate,
      models
    };
  }
  onDeleteClick(e) {
    e.stopPropagation();
    e.currentTarget.parentElement.style.display = 'none';
    //const {currentTarget: {key}} = e;
    //console.warn(key);
  }
  onNotificationClick({currentTarget: {key}}) {
    const {runtime} = this.tenant;
    const note = this.suggestions[key];
    if (note) {
      if (note.recipe) {
        runtime.createRecipeArc(note.recipe);
      } else if (note.share) {
        //console.warn('instructed to create arc from', JSON.stringify(note.share));
        runtime.importSharedArc(note.share);
      }
    }
  }
}
