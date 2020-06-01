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

<div style="xpadding: 8px;">
  <button on-click="onNoPushClick">Do Not Push</button><br>
  <br>
  <div>Hola <b>{{name}}</b><!--, from <b>{{id}}</b>--></div>
  <div style="padding: 8px; margin: 8px 0; border: 2px solid silver;">
    <div><span>List: </span><span>{{list}}</span></div>
    <div><span>Sorted: </span><span>{{sorted}}</span></div>
  </div>
  <div><span>#</span><span>{{value}}</span></div>
</div>

  `;

  return class extends Particle {
    get template() {
      return template;
    }
    render({name, list, sorted, value}) {
      return {
        name,
        list: JSON.stringify(list, null, ' '),
        sorted,
        value
      };
    }
    onNoPushClick() {
      this.output({value: 0, name: 'Button Pusher'});
      //console.warn('No push button!');
    }
  };
};
