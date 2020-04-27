/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

const chat = {
  root: [{
    particle: {
      kind: 'Frame',
      padding: {
        share: false,
        value: '12px 8px'
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

const book_club = {
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
        value: '12px 8px'
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
          share: false,
          volatile: true
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

export const recipes = {chat, book_club, tv};
