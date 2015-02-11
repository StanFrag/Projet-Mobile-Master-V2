'use strict';
angular.module('Guntherandthehunters.services', [])

.factory('User', function($resource, ENV, $q, $http) {
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
    }),
      getLevelUser : function(u) {
          var deferred = $q.defer();
          $http.get(ENV.apiEndpoint + '/json/levels.json').success(function(data){
              var exp = u.exp;
              var level = {};
              var ended = false;
              for(var i = data.length-1; i >= 0; i--) {
                  if(exp >= data[i].begin && !ended) {
                      ended = true;
                      level = data[i];
                      if(i < data.length-1){
                          var nextLevel = data[i+1];
                          deferred.resolve({"level" :level, "nextLevel" : nextLevel});
                      }else {
                          $http.get('/api/getMaxExp').success(function(data) {
                              var nextLevel = data.max;
                              deferred.resolve({"level" :level, "nextLevel" : nextLevel});
                          });
                      }
                  }
              }
          });
          return deferred.promise;

      }
  }

})

.factory('Event',function($resource, ENV) {
        var options = {
            minPerimeter : 500,
            maxPerimeter : 2000,
            minDuration : 10,
            maxDuration : 90,
            minPlayers : 5,
            maxPlayers : 100,
            minDifficulty : 1,
            maxDifficulty : 10
        }
        var event = {}
        var events = {}
        return {
            admin : $resource(ENV.apiEndpoint + 'rest/events', {}, {
                'get': {
                    method: 'GET'
                },
                'create': {
                    method: 'POST'
                },
                'update': {
                    method: 'PUT'
                },
                'delete': {
                    method: 'DELETE'
                }
            }),
            user : $resource(ENV.apiEndpoint + 'api/events', {id : '@id'}, {
                'getUserEvents' : {
                    method: 'GET'
                },
                'get' : {
                    method: 'GET'
                },
                'create' : {
                    method: 'POST'
                },
                'update' : {
                    method: 'PUT'
                },
                'delete' : {
                    method: 'DELETE'
                }
            }),
            getOptions : function () {
                return options;
            }
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
                timeout = 3000;
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
