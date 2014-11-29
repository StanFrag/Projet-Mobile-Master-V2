'use strict';
angular.module('Guntherandthehunters.services', [])

/**
 * A simple example service that returns some data.
 */
.factory('Friends', function() {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var friends = [
    { id: 0, name: 'Scruff McGruff' },
    { id: 1, name: 'G.I. Joe' },
    { id: 2, name: 'Miss Frizzle' },
    { id: 3, name: 'Ash Ketchum' }
  ];

  return {
    all: function() {
      return friends;
    },
    get: function(friendId) {
      // Simple index lookup
      return friends[friendId];
    }
  };
})
.factory('MenuService', function() {

  var menuItems = [
    {
      text: 'Carte',
      link: '#/map'
    }, 
    {
      text: 'Evènements',
      link: '#/events'
    }, 
    {
      text: 'Amis',
      link: '#/friend'
    }, 
    {
      text: 'Parties',
      link: '#/party'
    }, 
    {
      text: 'Paramètres',
      link: '#/params'
    }
    , 
    {
      text: 'Déconnexion',
      link: 'login'
    }
  ];

  return {
    all: function() {
      return menuItems;
    }
  }
})

.factory('User', function($resource, ENV) {

  return {
    login: $resource(ENV.apiEndpoint + '/login', {id:'@id'}, {
      'authenticate': {
        method:'POST'
      }
    }),
    register: $resource(ENV.apiEndpoint + '/login', {id:'@id'}, {
      'create': {
        method:'POST'
      }
    }),
  }

})
