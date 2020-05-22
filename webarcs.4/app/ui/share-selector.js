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
import {IconsCss} from '../../../assets/css/icons.css.js';

// makes a string
const styles = Xen.html`
<style>
  :host {
    display: block;
    max-width: 55%;
    --mdc-typography-body2-font-weight: bold;
  }
  input {
    display: inline-block;
    padding: 8px 4px;
    border: none;
    font-size: 140%;
    font-weight: bold;
  }
  [friends] {
    display: flex;
    flex-wrap: wrap;
    max-height: 280px;
    overflow: auto;
    overflow-x: hidden;
  }
  [friends] > * {
    margin: 8px 16px 16px;
  }
  tenant-icon {
    transition: opacity 300ms ease-out;
  }
  ${IconsCss}
</style>
`;

// makes a <template> object
const template = Xen.Template.html`
${styles}
<!-- <h2>{{arcName}}</h2> -->
<div style="display: flex; align-items: center; margin: 24px 32px 0px 16px;">
  <input on-focus="onInputFocus" on-change="onInputChange" style="flex: 1;" value="{{arcName}}">
  <icon style="margin: 0 24px 0 -24px; pointer-events: none;">edit</icon>
</div>
<div style="margin: 24px 32px 0px 16px;">
  <mwc-formfield label="Only share data">
    <mwc-checkbox on-change="onShareArcChange" value="{{shareArc}}"></mwc-checkbox>
  </mwc-formfield>
</div>
<div style="padding: 8px 40px 8px 24px;">
  <h3>Share With</h3>
  <div friends>{{friends}}</div>
</div>
<div style="padding: 24px; text-align: right;">
  <mwc-button style="margin-right: 24px;" outline label="Cancel" on-click="onCancelClick"></mwc-button>
  <mwc-button raised label="Ok" on-click="onOkClick"></mwc-button>
</div>
`;

const friendTemplate = Xen.Template.html`
<div tenant xen:style="{{opacity}}">
  <tenant-icon on-click="onFriendClick" key="{{id}}" xen:style="{{style}}" avatar="{{avataricon}}" device="{{deviceicon}}"></tenant-icon>
  <div style="margin-top: 16px; text-align: center;">{{persona}}</div>
</div>
`;

export class ShareSelector extends Xen.Async {
  static get observedAttributes() {
    return ['tenant', 'kick'];
  }
  get template() {
    return template;
  }
  render({tenant}, state) {
    if (tenant) {
      const model = {
        friends: this.renderFriends(tenant)
      };
      const arc = tenant.currentArc;
      const desc = arc ? (arc.extra['description'] || arc.id) : '';
      // avoid updating 'arcName' if it hasn't changed at the source so we don't mess up
      // the user trying to edit that string
      if (state.arcName !== desc) {
        state.arcName = desc;
        model.arcName = desc;
      }
      return model;
    }
  }
  getSharing() {
    const arc = this.tenant && this.tenant.currentArc;
    if (!arc) {
      return;
    }
    if (!arc.extra.sharing) {
      arc.extra.sharing = {};
    }
    const {sharing} = arc.extra;
    if (!sharing.shareWith) {
      sharing.shareWith = [];
    }
    if (!sharing.shareWith.includes(this.tenant.id)) {
      sharing.shareWith.push(this.tenant.id);
    }
    return sharing;
  }
  renderFriends({persona, tenants: friends}) {
    const sharing = this.getSharing();
    if (sharing && friends) {
      const {shareWith} = sharing;
      const models = friends.filter(friend => friend && (friend.persona !== persona)).map(friend => ({
        ...friend,
        //style: `border-radius: 100%; border: 5px solid ${shareWith.includes(friend.id) ? 'blue;' : 'silver;'};`,
        style: {borderRadius: '100%', border: '5px solid', borderColor: shareWith.includes(friend.id) ? 'blue' : 'silver'},
        opacity: `${shareWith.includes(friend.id) ? 'opacity: 1;' : 'opacity: 0.6;'};`
      }));
      return {
        template: friendTemplate,
        models
      };
    }
  }
  // TODO(sjmiles): update hacks (red flag)
  crimsonAssurance() {
    //this._invalidate();
    this.tenant.runtime.updateMetadata();
  }
  onFriendClick(e) {
    const friendId = e.currentTarget.key;
    const sharing = this.getSharing();
    if (sharing) {
      const {shareWith} = sharing;
      const key = shareWith.indexOf(friendId);
      if (key >= 0) {
        shareWith.splice(key, 1);
      } else {
        shareWith.push(friendId);
      }
    }
    this.crimsonAssurance();
  }
  onInputFocus(e) {
    e.currentTarget.select();
  }
  onInputChange({currentTarget: {value}}) {
    if (this.tenant.currentArc) {
      this.tenant.currentArc.setDescription(value);
      this.crimsonAssurance();
    }
  }
  onCancelClick() {
    this.close();
  }
  onOkClick() {
    const {runtime, currentArc: arc} = this.tenant;
    // TODO(sjmiles): where does this go? Can `sharedArcs` be automatically updated?
    if (arc) {
      const meta = runtime.exportArcMetadata(arc);
      runtime.tenant.sharedArcs.change(doc => doc.data[arc.id] = meta);
    }
    this.close();
  }
  close() {
    this.fire('close');
  }
}
