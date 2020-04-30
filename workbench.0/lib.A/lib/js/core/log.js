/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
export const logFlags = { all: true, groupStatus: true, render: true };
export const logFactory = (nonoop, preamble, color, log = 'log') => {
    if (!nonoop) {
        return () => { };
    }
    const style = `background: ${color || 'gray'}; color: white; padding: 1px 6px 2px 7px; border-radius: 6px;`;
    return console[log].bind(console, `%c${preamble}`, style);
};
