'use strict';
angular.module('Guntherandthehunters.services', ['ngResource'])

.factory('User', function($resource, ENV) {

  return {
    forgot : $resource(ENV.apiEndpoint + 'external/forgot', {email: '@email' }, {
        'resetPassword': {
          method: 'POST' 
        }
      }),
    login : $resource(ENV.apiEndpoint + 'external/login', {email: '@email', password:'@password' }, {
        'loginUser': {
          method: 'POST' 
        }
      }), 
    isLoggedIn : $resource(ENV.apiEndpoint + 'external/isLogged', {access_token: '@access_token'}, {
      'isLoggedIn': {
        method: 'POST' 
      }
    }),
    getUser : $resource(ENV.apiEndpoint + 'external/getLoggedUser', {}, {
      'getLoggedUser': {
        method: 'GET' 
      }
    }),
    register : $resource(ENV.apiEndpoint + 'external/register', {username: '@username', email: '@email', password:'@password'}, {
      'create': {
        method: 'POST' 
      }
    }),
    logout : $resource(ENV.apiEndpoint + 'external/logout', {}, {
      'logout': {
        method: 'GET' 
      }
    })
  }

})
