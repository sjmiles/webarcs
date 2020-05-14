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
  stores: {
    padding: {
      type: 'Padding',
      value: '12px 8px',
      tags: ['private']
    },
    entries: {
      type: '[ChatEntry]'
    },
    user: {
      type: 'BasicProfile',
      tags: ['map'/*, 'private'*/]
    }
  },
  root: [{
    particle: {
      kind: 'Frame',
      padding: 'padding'
    },
    content: [{
      particle: {
        kind: 'Chat/ChatWrite',
        entries: 'entries',
        user: 'user',
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
  stores: {
    padding: {
      type: 'Padding',
      value: '12px 8px',
      tags: ['private']
    },
    entries: {
      type: '[ChatEntry]'
    },
    user: {
      type: 'BasicProfile',
      tags: ['map'/*, 'private'*/]
    }
  },
  root: [{
    particle: 'Frame',
    content: [{
      particle: 'Books'
    }]
  }, {
    particle: {
      kind: 'Frame',
      padding: 'padding'
    },
    content: [{
      particle: {
        entries: 'entries',
        user: 'user'
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
  stores: {
    tmdbQuery: {
      type: 'String',
      value: 'star trek'
    },
    tmdbResults: {
      type: '[TMDBEntry]',
      tags: ['private', 'volatile']
    },
    tmdbSelection: {
      type: 'TMDBEntry'
    }
  },
  root: [{
    particle: 'Frame',
    content: [{
      particle: {
        kind: 'TextInput',
        text: 'tmdbQuery',
      }
    }, {
      particle: {
        kind: 'TMDBSearch',
        query: 'tmdbQuery',
      }
    }, {
      particle: {
        kind: 'TMDBGrid',
        tmdbResults: 'tmdbResults'
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
