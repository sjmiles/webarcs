/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

export const recipe = {
  // a recipe is an array of slots
  root: [{
    // a slot is an array of either particles or slots
    // `particle` is a keyword: conflicts? maybe use `$<keyword>`?
    // probably keywords should be symbols, but that seems bad for JSON
    particle: 'Frame',
    content: [{
      particle: 'Books'
    }]
  }, {
    particle: {
      kind: 'Frame',
      padding: {
        share: false,
        value: '24px 12px'
      }
    },
    content: [{
      particle: {
        kind: 'Chat/ChatWrite',
        entries: 'entries',
        userid: {
          share: false
        }
      }
    },{
      particle: {
        kind: 'Chat/ChatList',
        entries: 'entries'
      }
    }]
  }, {
    particle: 'Frame',
    content: [{
      particle: {
        kind: 'TMDBSearch',
        query: 'tmdbQuery',
      }
    }, {
      particle: {
        kind: 'TMDBGrid',
        tmdbResults: {
          share: false
        }
      }
    }, {
      particle: {
        kind: 'TMDBDetail',
        tmdbSelection: 'tmdbSelection'
      }
    }]
  }]
};

const chat = {
  root: [{
    particle: 'Frame',
    content: [{
      particle: 'Books'
    }]
  }, {
    particle: {
      kind: 'Frame',
      padding: {
        share: false,
        value: '24px 12px'
      }
    },
    content: [{
      particle: {
        kind: 'Chat/ChatWrite',
        entries: 'entries',
        userid: {
          share: false
        }
      }
    },{
      particle: {
        kind: 'Chat/ChatList',
        entries: 'entries'
      }
    }]
  }]
};

const tv = {
  // a recipe is an array of slots
  root: [{
    particle: 'Frame',
    content: [{
      particle: {
        kind: 'TMDBSearch',
        query: 'tmdbQuery',
      }
    }, {
      particle: {
        kind: 'TMDBGrid',
        tmdbResults: {
          share: false
        }
      }
    }, {
      particle: {
        kind: 'TMDBDetail',
        tmdbSelection: 'tmdbSelection'
      }
    }]
  }]
};

export const recipes = {chat, tv};
