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
 * @module core
 */
export const irand = (range) => Math.floor(Math.random() * range);
export const prob = (probability) => Boolean(Math.random() < probability);
/**
 * Perform `action` if `delay` ms have elapsed since last debounce call for `key`.
 *
 * ```
 * // invoke 'task' one second after last time this line executed
 * this.debounceTask = debounce(this.debounceTask, task, 1000);
 * ```
 */
export const debounce = (key, action, delay) => {
    if (key) {
        clearTimeout(key);
    }
    if (action && delay) {
        return setTimeout(action, delay);
    }
};
export const makeId = () => {
    const delim = 'x';
    return `${irand(1e2) + 1e1}${delim}${irand(1e2) + 1e1}${delim}${irand(1e2) + 1e1}`;
    //return `${irand(1e4)+1e3}-${irand(1e4)+1e3}-${irand(1e4)+1e3}-${irand(1e4)+1e3}`;
};
export const shallowMerge = (obj, data) => {
    Object.keys(data).forEach(key => obj[key] = data[key]);
    return obj;
};
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
    if (obj && (typeof obj === 'object')) {
        // we are `deep` because we recursively study object types
        const props = Object.getOwnPropertyNames(obj);
        props.forEach(name => {
            const prop = obj[name];
            if (prop === undefined) {
                delete obj[name];
                //obj[name] = null;
            }
            else {
                deepUndefinedToNull(prop);
            }
        });
    }
};
