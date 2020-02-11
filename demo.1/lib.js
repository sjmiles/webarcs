/**
 * @license
 * Copyright 2019 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Xen} from '../xen/xen-async.js';
import {Automerge} from '../automerge.js';

export class Particle {
  static get html() {
    return Xen.html;
  }
  update(/*inputs*/) {
    const outputs = {};
    return outputs;
  }
  // Not returned from `render` because templates can be preprocessed and cached. Can we generalize the concept?
  get template() {
    return Xen.html`
      <div style="padding: 8px;">
        Hola <b>{{name}}</b>
        <div>{{list}}</div>
      </div>
    `;
  }
  render({name, list}, /*state*/) {
    return {
      name,
      list: JSON.stringify(list)
    };
  }
}

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

// TODO(sjmiles): principle: Particles remain stupid, system integration happens in an owner (Host)

export class Host {
  constructor(composer, storage) {
    this.composer = composer;
    this.storage = storage;
  }
  update(particle, inputs) {
    const outputs = particle.update(inputs);
    this.render(particle, inputs);
    return outputs;
  }
  render(particle, inputs) {
    particle.renderModel = particle.render(inputs, particle.state);
    particle.debounce = Xen.debounce(particle.debounce, () => this.renderModel(particle), 100);
  }
  renderModel(particle) {
    console.log(`Host::renderModel(${particle.name})`);
    this.composer.render({
      id: particle.id,
      content: {
        template: particle.template,
        model: particle.renderModel
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
  constructor(storage) {
    super();
    storage = storage || new Store();
    this.merge(storage.truth);
    this.host = new Host(new Composer(), storage);
  }
  get truth() {
    return super.truth;
  }
  set truth(truth) {
    super.truth = truth;
    // truth changes trigger update
    this.update();
  }
  addParticle(particle) {
    this.particle = particle;
    this.updateParticle(particle);
  }
  update() {
    this.updateParticle(this.particle);
  }
  updateParticle(particle) {
    if (particle) {
      this.host.update(particle, this.truth);
    }
  }
}

export class Store extends Doc {
  constructor(id) {
    super();
    this.id = id;
  }
  synchronize(arcs) {
    arcs.forEach(arc => this.apply(arc.changes));
    // extracting truth is destructive to changes
    const truth = this.changes;
    arcs.forEach(arc => arc.apply(truth));
  }
}
