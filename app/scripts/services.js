'use strict';
angular.module('Guntherandthehunters.services', ['ngResource'])

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
      link: 'core.map'
    }, 
    {
      text: 'Evenements',
      link: 'core.events'
    }, 
    {
      text: 'Amis',
      link: 'core.friends'
    }, 
    {
      text: 'Parties',
      link: 'core.party'
    }, 
    {
      text: 'Parametres',
      link: 'core.params'
    },
    {
      text: 'Classement',
      link: 'core.rank'
    },
    {
      text: 'Regles',
      link: 'core.rules'
    },
    {
      text: 'Deconnexion',
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
    login: $resource(ENV.apiEndpoint + 'login', {email: '@email', password:'@password' }, {
      'authenticate': {
        method:'POST'
      }
    }),
    verifLogin: $resource(ENV.apiEndpoint + 'isLogged', {}, {
      'isLogged': {
        method:'GET'
      }
    }),
    register: $resource(ENV.apiEndpoint + 'login', {id:'@id'}, {
      'create': {
        method:'POST'
      }
    }),    

  }

})
