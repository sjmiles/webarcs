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
    padding: 12px;
    font-size: 18px;
  }
  [entries] {
    margin-top: 4px;
  }
  i {
    font-size: 75%;
  }
</style>

<div entries>{{entries}}</div>

<template entry>
  <pre style="padding: 4px; border: 1px dotted silver; margin: 0;"><i>{{time}}</i> <span>{{entry}}</span></pre>
</template>
`;

return class extends Particle {
  get template() {
    return template;
  }
  render({entries}) {
    entries = entries || [{userid: 'moe', time: Date.now(), msg: 'Test'}];
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
      $template: 'entry',
      models
    };
  }
  renderEntry({userid, time, msg}) {
    return {
      time: new Date(time).toLocaleTimeString(),
      entry: `[${userid}] ${msg}`
    };
  }
};

};
