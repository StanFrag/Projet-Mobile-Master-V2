'use strict';
angular.module('Guntherandthehunters.services', [])

.factory('User', function($resource, ENV) {
  return {
    forgot : $resource(ENV.apiEndpoint + 'api/forgot', {email: '@email' }, {
        'resetPassword': {
          method: 'POST' 
        }
      }),
    login : $resource(ENV.apiEndpoint + 'api/login', {email: '@email', password:'@password' }, {
        'loginUser': {
          method: 'POST' 
        }
      }), 
    isLoggedIn : $resource(ENV.apiEndpoint + 'api/isLogged', {access_token: '@access_token'}, {
      'isLoggedIn': {
        method: 'POST' 
      }
    }),
    getUser : $resource(ENV.apiEndpoint + 'api/getLoggedUser', {}, {
      'getLoggedUser': {
        method: 'GET' 
      }
    }),
    register : $resource(ENV.apiEndpoint + 'api/register', {username: '@username', email: '@email', password:'@password'}, {
      'create': {
        method: 'POST' 
      }
    }),
    logout : $resource(ENV.apiEndpoint + 'api/logout', {}, {
      'logout': {
        method: 'GET' 
      }
    })
  }

})

.factory('AlertService', ['$timeout', '$rootScope',
    function($timeout, $rootScope) {

        var alertService = {};
        $rootScope.alerts = [];

        alertService.add = function(type, title, msg, timeout) {
            $rootScope.alerts.push({
                type: type,
                title: title,
                msg: msg,
                close: function() {
                    return alertService.closeAlert(this);
                }
            });

            if(typeof timeout == 'undefined') {
                timeout = 800000;
            }

            if (timeout) {
                $timeout(function(){
                    alertService.closeAlert(this);
                }, timeout);
            }
        }

        alertService.closeAlert = function(alert) {
            return this.closeAlertIdx($rootScope.alerts.indexOf(alert));
        }

        alertService.closeAlertIdx = function(index) {
            return $rootScope.alerts.splice(index, 1);
        }

        return alertService;
    }
]);
