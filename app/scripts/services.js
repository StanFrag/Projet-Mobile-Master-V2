'use strict';
angular.module('Guntherandthehunters.services', ['ngResource'])

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
