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
import {Store} from '../db/store.js';
import '../../dom-elements/corellia-xen/cx-tabs.js';

const template = Xen.html`
<style>
  :host {
    display: block;
    box-sizing: border-box;
    font-size: 0.8em;
    background-color: #e4e4e4;
  }
  [outer] {
    overflow: hidden;
    height: 90%;
  }
  [toolbar] {
    display: flex;
    align-items: center;
    height: 38px;
    padding: 4px;
    border-bottom: 1px solid silver;
    background-color: #eeeeee;
  }
  [toolbar] > * {
    margin-right: 8px;
    cursor: pointer;
    white-space: nowrap;
  }
  [toolbar] > [disabled] {
    color: silver;
  }
  [content] {
    font-size: 9px;
    padding: 8px;
  }
  [banner] {
    font-size: 110%;
    padding: 8px;
  }
  [arcscontainer] {
    background-color: #eeeeee;
    /* border: 2px solid gray; */
  }
  thumb-grid {
    flex-wrap: nowrap;
    overflow-x: auto;
  }
  thumb-view {
    flex-shrink: 0;
    flex-grow: 0;
  }
  avatar {
    display: inline-block;
    /* margin: 0 8px 0 2px; */
    margin-right: 10px;
    height: 36px; /* wtf css? */
  }
  avatar > img {
    box-sizing: border-box;
    width: 36px;
    height: 36px;
    border: 2px solid rgba(64, 64, 64, 0.35);
    border-radius: 50%;
  }
  [row] {
    display: flex;
    align-items: center;
  }
  [notification] {
    /* padding: 6px; */
    cursor: pointer;
    border-radius: 128px;
    border: 1px solid #e0e0e0;
    background-color: white;
  }
</style>
<div outer xen:style="{{outerStyle}}">
  <div banner>{{id}}</div>

  <cx-tabs on-select="onTabSelect">
    <cx-tab selected>Arcs</cx-tab>
    <cx-tab>Database</cx-tab>
  </cx-tabs>

  <div xen:style="{{arcsPageStyle}}">
    <!-- <div banner>Arcs</div> -->
    <div toolbar>
      <!-- <span disabled>Arcs</span> -->
      <button on-click="onNewChatArcClick">New Chat Arc</button>
      <button on-click="onNewChat2ArcClick">New Chat2 Arc</button>
      <button on-click="onNewProfileArcClick">New Profile Arc</button>
      <button disabled>Other</button>
    </div>
    <div arcscontainer>
      <thumb-grid>{{thumbViews}}</thumb-grid>
      <div arcview></div>
    </div>
  </div>

  <div xen:style="{{databasePageStyle}}">
    <!-- <div banner>Database</div> -->
    <div content unsafe-html="{{content}}"></div>
  </div>

  <div banner>Notifications</div>
    <div style="background-color: #eeeeee; padding: 12px 12px 4px;">
      <div>{{notifications}}</div>
    </div>
  </div>
`;

const thumbViewTemplate = Xen.html`
  <thumb-view><arc-view arc="{{arc}}"></arc-view></thumb-view>
`;

const notificationViewTemplate = Xen.html`
  <div style="padding: 0 0 8px;">
    <div row notification on-click="onNotificationClick" key="{{key}}">
      <avatar><img src="{{avatarUrl}}"></avatar> <span unsafe-html="{{msg}}"></span>
    </div>
  </div>
`;

export class DeviceView extends Xen.Async {
  static get observedAttributes() {
    return ['device'/*, 'id', 'content'*/];
  }
  _didMount() {
    this.host.querySelector('thumb-grid').bigView = this.host.querySelector('[arcview]');
  }
  get template() {
    return template;
  }
  render({device}, {selected}) {
    let model = {
      arcsPageStyle: `display: ${!selected ? 'block' : 'none'}`,
      databasePageStyle: `display: ${selected === 1 ? 'block' : 'none'}`
    };
    if (device) {
      model = {
        ...model,
        id: device.id,
        content: this.renderDatabaseHtml(device.database),
        thumbViews: this.renderThumbViews(device.arcs),
        notifications: this.renderNotifications(device.chat2s || [])
      };
    }
    return model;
  }
  renderDatabaseHtml(database) {
    const html = [];
    database.storeIds.forEach(id => {
      const store = database.get(id);
      html.push(`<pre>${id} = ${Store.json(store)}</pre>`);
    });
    return html;
  }
  renderThumbViews(arcs) {
    return {
      template: thumbViewTemplate,
      models: Object.values(arcs).map(arc => ({arc}))
    };
  }
  renderNotifications(chats) {
    const notifications = chats.map(({user}, i) => ({
      key: i,
      avatarUrl: '../assets/44.png',
      msg: `<b>${user.split(':')[0]}</b> has shared a chat. Click to join.`
    }));
    return {
      template: notificationViewTemplate,
      models: notifications
    };
  }
  onTabSelect(e) {
    const selected = e.currentTarget.value;
    this.state = {selected};
  }
  onNotificationClick({currentTarget: {key}}) {
    this.props.device.onNotificationClick(this.props.device.chat2s[key]);
    //console.warn(this.props.device.chat2s[key]);
  }
}
