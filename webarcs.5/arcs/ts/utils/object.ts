/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

/**
 * @packageDocumentation
 * @module object
 */

export const shallowMerge = (obj, data) => {
  Object.keys(data).forEach(key => obj[key] = data[key]);
  return obj;
};

export const deepCopy = datum => {
  if (!datum) {
    return datum;
  } else if (Array.isArray(datum)) {
    const clone = [];
    datum.forEach(element => clone.push(deepCopy(element)));
    return clone;
  } else if (typeof datum === 'object') {
    const clone = Object.create(null);
    Object.entries(datum).forEach(([key, value]) => {
      clone[key] = deepCopy(value);
    });
    return clone;
  } else {
    return datum;
  }
};

window["deepCopy"] = deepCopy;

export const deepEqual = (a, b) => {
  const type = typeof a;
  // must be same type to be equal
  if (type !== typeof b) {
    return false;
  }
  // we are `deep` because we recursively study object types
  if (type === 'object' && a && b) {
    const aProps = Object.getOwnPropertyNames(a);
    const bProps = Object.getOwnPropertyNames(b);
    // equal if same # of props, and no prop is not deepEqual
    return (aProps.length == bProps.length) && !aProps.some(name => !deepEqual(a[name], b[name]));
  }
  // finally, perform simple comparison
  return (a === b);
};

export const deepUndefinedToNull = obj => {
  if (obj === undefined) {
    return null;
  }
  if (obj && (typeof obj === 'object')) {
    // we are `deep` because we recursively study object types
    const props = Object.getOwnPropertyNames(obj);
    props.forEach(name => {
      const prop = obj[name];
      if (prop === undefined) {
        delete obj[name];
        //obj[name] = null;
      } else {
        deepUndefinedToNull(prop);
      }
    });
  }
  return obj;
};
