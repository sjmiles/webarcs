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

const template = Xen.Template.html`
<style>
  ${IconsCss}
  icon:hover {
    color: blue;
  }
  /**/
  :host {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-size: 16px;
    --mdc-theme-primary: var(--ui-bg-hi-0);
    --mdc-theme-on-primary: #333;
  }
  * {
    box-sizing: border-box;
  }
  [banner] {
    display: flex;
    align-items: center;
    padding: 4px;
    background-color: var(--ui-bg-3);
  }
  [banner] > * {
    margin: 0 8px;
  }
  [banner2] > * {
    background-color: var(--ui-bg-4);
  }
  [row] {
    display: flex;
    align-items: center;
  }
  [row] > * {
    margin-right: 12px;
  }
  [tenants] {
    zoom: 0.5;
  }
  [tenants] > * {
    margin-right: 16px;
  }
  [database] > div {
    padding: 8px;
    font-size: 12px;
  }
  [flex] {
    flex: 1;
  }
  [page] {
    display: none;
  }
  [show] {
    display: block;
  }
  [home] {
    padding: 12px;
  }
  /**/
  [arc][show] {
    display: flex;
    align-items: stretch;
  }
  [chooser] {
    width: 120px;
    padding: 8px;
    border: 1px solid var(--ui-bg-3);
    background-color: var(--ui-bg-2);
  }
  [arcItem] {
    font-size: 75%;
    display: flex;
    border-radius: 8px;
    margin-bottom: 8px;
    padding: 6px;
    border: 2px solid #eeeeee;
    background-color: #f4f4f4;
    color: #999;
    cursor: pointer;
    user-select: none;
    align-items: center;
  }
  [arcItem][selected] {
    font-weight: bold;
    color: black;
    background-color: white;
    border: 2px solid #ffc107;
  }
  [dot] {
    display: inline-block;
    background-color: lightblue;
    border-radius: 100%;
    width: 16px;
    height: 16px;
    margin: 0 8px;
    visibility: hidden;
  }
  [arcItem][selected] [dot] {
    visibility: visible;
  }
  system-view {
    height: 216px;
    overflow: auto;
  }
  [options] {
    visibility: hidden;
  }
  [arcItem]:hover [options] {
    visibility: visible;
  }
  share-selector {
    background-color: white;
    border-radius: 8px;
  }
  [toolbar] icon {
    font-size: 24px;
  }
</style>

<modal-view show="{{showModal}}" on-click="onSettingsClose">
  <share-selector kick="{{kick}}" tenant="{{tenant}}" on-click="onShareViewClick" on-close="onSettingsClose"></share-selector>
</modal-view>

<div banner toolbar>
  <tenant-icon style="zoom: 0.75;" avatar="{{avataricon}}" device="{{deviceicon}}"></tenant-icon>
  <span>{{id}}</span>
  <span flex></span>
  <div row xen:style="{{homeStyle}}" title="Home"><icon on-click="onHome">home</icon></div>
  <div row xen:style="{{storageStyle}}" title="Storage View"><icon on-click="onStorageToggle">storage</icon></div>
  <div row xen:style="{{settingsStyle}}" title="Arc Settings..."><icon on-click="onSettingsOpen">settings</icon></div>
  <div style="width: 1px; height: 100%; border-right: 1px dotted #a0a0a0;"></div>
  <span tenants>{{connects}}</span>
</div>

<div arc page flex show$="{{showArc}}" style="flex-direction: column; overflow: hidden;">
  <div flex style="display: flex; overflow: hidden;">
    <!-- arc selector -->
    <div chooser style="width: 132px; padding: 8px; border: 1px solid var(--ui-bg-3);">{{arcs}}</div>
    <!-- current arc projected here -->
    <div flex style="display: flex; overflow-x: auto; overflow-y: scroll;">
      <slot></slot>
    </div>
  </div>
  <!-- system/notification area -->
  <system-view tenant="{{tenant}}"></system-view>
</div>

<div database page flex show$="{{showDatabase}}" style="overflow: auto;">
  <div banner style="font-size: 16px;"><span>Context Stores</span></div>
  <database-view database="{{database}}"></database-view>
  <div style="padding: 0;">{{connectionDatabases}}</div>
</div>
`;

const connectionTemplate = Xen.Template.html`
  <tenant-icon xen:style="{{style}}" avatar="{{avataricon}}" device="{{deviceicon}}" title="{{persona}}"></tenant-icon>
`;

const modeTemplate = Xen.Template.html`
  <div style="border: 1px solid silver; margin-bottom: 1em;">
    <div style="font-size: 75%; margin-top: -0.65em; background-color: inherit;">{{mode}}</div>
    <div style="padding: 8px;">{{arcs}}</div>
  </div>
`;

const arcTemplate = Xen.Template.html`
  <div arcItem selected$="{{selected}}" key="{{id}}" on-click="onArcItemClick">
    <span name>{{name}}</span><span flex></span><icon options style="font-size: 75%;">settings</icon>
    <span>{{mode}}</span>
  </div>
`;

const connectionDatabaseTemplate = Xen.Template.html`
  <div>
    <div banner style="font-size: 16px;">
      <span>Stores synced with </span>
      <tenant-icon style="zoom: 0.5;" xen:style="{{style}}" avatar="{{avataricon}}" device="{{deviceicon}}" title="{{persona}}"></tenant-icon>
      <span>{{id}}</span>
    </div>
    <database-view database="{{database}}"></database-view>
  </div>
`;

export class TenantView extends Xen.Async {
  static get observedAttributes() {
    return ['tenant'];
  }
  get template() {
    return template;
  }
  update({tenant}) {
    // TODO(sjmiles): update periodically as a stopgap for observing changes (e.g. a new arc) ... fix!
    setTimeout(() => this.state = {kick: Math.random()}, 500);
    if (tenant && tenant.currentArc) {
      this.selectArc(tenant, tenant.currentArc);
    }
  }
  onArcItemClick({currentTarget: {key}}) {
    if (key) {
      this.state = {selectedArcId: key, showDatabase: false};
      const {tenant} = this.props;
      const arc = tenant.arcs[key];
      this.selectArc(tenant, arc);
    }
  }
  render({tenant}, {selectedArcId, showModal, showDatabase, kick}) {
    return {
      kick,
      tenant,
      ...tenant,
      showModal,
      showDatabase,
      showArc: !showDatabase,
      database: tenant && tenant.context,
      connectionDatabases: tenant && tenant.hub && this.renderConnectionDatabases(tenant),
      settingsStyle: selectedArcId ? '' : 'pointer-events: none; color: silver;',
      arcs: {
        template: modeTemplate,
        models: this.renderArcs(tenant, selectedArcId)
      },
      connects: {
        template: connectionTemplate,
        models: tenant && tenant.hub && this.renderConnections(tenant)
      }
    };
  }
  renderTenants({tenants}) {
    return tenants;
  }
  renderConnections(tenant) {
    return Object.values(tenant.hub.connections).map(conn => {
      const targetId = conn.endpoint.remoteId;
      const friend = tenant.tenants.find(t => t && (t.id === targetId));
      if (friend) {
        return {
          ...friend,
          style: `border-radius: 100%; border: 3px solid ${conn.endpoint.open ? 'green' : 'red'};`
        };
      }
    });
  }
  renderConnectionDatabases(tenant) {
    return {
      template: connectionDatabaseTemplate,
      models: Object.values(tenant.hub.connections).map(c => {
        const targetId = c.endpoint.remoteId;
        const friend = tenant.tenants.find(t => t && (t.id === targetId));
        if (friend) {
          return {
            ...friend,
            database: c.database,
          };
        }
      })
    };
  }
  renderArcs({arcs}, selectedArcId) {
    const modes = {};
    Object.values(arcs).forEach((arc) => {
      const mode = arc.extra.modality || 'default';
      const arcs = modes[mode] || (modes[mode] = []);
      arcs.push(arc);
    });
    return Object.entries(modes).map(([mode, arcs]) => ({
      mode,
      arcs: {
        template: arcTemplate,
        models: arcs.map(arc => ({
          id: arc.id,
          name: arc.getDescription() || arc.id,
          selected: arc.id === selectedArcId,
        }))
      }
    }));
  }
  selectArc(tenant, arc) {
    tenant.currentArc = arc;
    this.state = {selectedArcId: arc.id};
    arc.composer.activate();
  }
  onSettingsOpen() {
    this.state = {showModal: true};
  }
  onSettingsClose() {
    this.state = {showModal: false};
  }
  onShareViewClick(e) {
    e.stopPropagation();
  }
  onStorageToggle() {
    this.state = {showDatabase: !this.state.showDatabase};
  }
}
