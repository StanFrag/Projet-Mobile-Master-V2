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
}).factory('User', ['$http', 'ENV', function($http, ENV) {
  return {
      insertUser : function(email, password) {
         return $http.post('/register?email=' + email + '&password=' + password);
      },
      loginUser : function(email, password) {
         var user = $http.post(ENV.apiEndpoint + '/login?email=' + email + '&password=' + password);
         return user;
      },
      isLoggedIn : function() {
         return $http.get('/isLogged');
      },
      getUser : function() {
         return $http.get('/getLoggedUser');
      },
      logout : function() {
         return $http.get('/logout');
      }
  }
}]);
