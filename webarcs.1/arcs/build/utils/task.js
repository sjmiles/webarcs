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
export const async = task => {
    return async (...args) => {
        await Promise.resolve();
        task(...args);
    };
};
