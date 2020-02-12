/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Xen} from '../xen/xen-async.js';
import {Automerge} from '../automerge.js';

export class Composer {
  constructor() {
    this.slots = {};
  }
  render({id, content: {template, model}}) {
    let slot = this.slots[id];
    if (!slot) {
      slot = this.slots[id] = Xen.Template.stamp(template).appendTo(document.body);
    }
    slot.set(model);
  }
}

export class Particle {
  update(inputs) {
    const outputs = {};
    return outputs;
  }
  // Not returned from `render` because it can be
  // preprocessed and cached. Can we generalize it?
  get template() {
    return Xen.html`
      <div style="padding: 8px;">
        Hola <b>{{name}}</b>
        <div>{{list}}</div>
      </div>
    `;
  }
  render({name, list}, state) {
    return {
      name,
      list: JSON.stringify(list)
    };
  }
}

export class Host {
  constructor(composer) {
    this.composer = composer;
    this.particle = new Particle();
  }
  update(inputs) {
    const {particle} = this;
    /*const outputs =*/ particle.update(inputs);
    this.render(inputs);
  }
  render(inputs) {
    const {particle} = this;
    const template = particle.template;
    const model = particle.render(inputs, {});
    this.composer.render({
      id: particle.id,
      content: {
        template: template,
        model: model
      }
    });
  }
}

export class Doc {
  constructor() {
    this._truth = Automerge.init();
    this.old = this.truth;
  }
  get truth() {
    return this._truth;
  }
  set truth(truth) {
    this._truth = truth;
  }
  change(mutator) {
    this.truth = Automerge.change(this.truth, mutator);
  }
  apply(changes) {
    this.truth = Automerge.applyChanges(this.truth, changes);
  }
  merge(doc) {
    this.truth = Automerge.merge(this.truth, doc);
  }
  get changes() {
    const changes = Automerge.getChanges(this.old, this.truth);
    this.old = this.truth;
    return changes;
  }
}

export class Arc extends Doc {
  constructor() {
    super();
    this.composer = new Composer();
    this.host = new Host(this.composer);
  }
  get truth() {
    return super.truth;
  }
  set truth(truth) {
    super.truth = truth;
    this.update();
  }
  update() {
    this.host.update(this.truth);
  }
}

export class Store extends Doc {
  constructor(id) {
    super();
    this.id = id;
  }
}
