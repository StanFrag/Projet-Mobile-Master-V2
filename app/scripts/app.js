'use strict';
// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('Guntherandthehunters', ['ionic', 'config', 'Guntherandthehunters.controllers', 'Guntherandthehunters.services'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {

      $stateProvider
    .state('core', {
      controller : 'CoreCtrl',
      templateUrl: 'templates/layout/core.html'

    })
    .state('auth', {
      controller : 'AuthCtrl',
      templateUrl: 'templates/layout/auth.html'

    })
    // setup an abstract state for the tabs directive
    .state('core.events', {
      url: "/events",
      controller : 'EventsCtrl',
      templateUrl: 'templates/events/events.html'
    })

    .state('core.menu', {
      url: "/menu",
      views: {
        'core-menu': {
          templateUrl: 'templates/menu.html',
          controller: 'MenuCtrl'
        }
      }
    })

    .state('auth.login', {
      url: "/login",
      controller : 'AuthLoginCtrl',
      templateUrl: 'templates/auth/login.html'
    })
    
    .state('core.map', {
      url: "/map",
      templateUrl: 'templates/map.html'
    })
    ;

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/events');
});

