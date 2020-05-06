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

<style>
  :host {
    display: block;
    font-size: 16px;
    order: 1;
  }
  [entries] {
    margin-top: 4px;
  }
  i {
    font-size: 75%;
  }
  pre {
    margin: 0;
  }
  [entry] {
    padding: 4px 8px;
    border: 1px dotted silver;
    border-radius: 24px;
    margin: 8px 0;
    display: flex;
    align-items: center;
  }
  tenant-icon {
    margin: 0 10px;
    width: 32px;
    height: 32px;
  }
  [time] {
    flex-shrink: 0;
    font-size: 75%;
    font-style: italic;
  }
</style>

<div entries>{{entries}}</div>

<template entryTemplate>
  <div entry>
    <span time>{{time}}</span>
    <tenant-icon avatar="{{avatar}}"></tenant-icon>
    <span unsafe-html="{{entry}}"></span>
  </div>
</template>
`;

return class extends Particle {
  get template() {
    return template;
  }
  render({entries}) {
    return {
      entries: entries ? this.renderEntries(entries) : null
    };
  }
  renderEntries(entries) {
    const models = Object.values(entries)
      .sort((a, b) => a.time - b.time)
      .map(this.renderEntry)
      ;
    return {
      $template: 'entryTemplate',
      models
    };
  }
  renderEntry({user, time, msg}) {
    return {
      time: new Date(time).toLocaleTimeString(),
      avatar: user.avataricon, //`../assets/users/${userid}.png`,
      entry: msg
    };
  }
};

};
