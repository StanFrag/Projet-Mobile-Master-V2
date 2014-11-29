'use strict';
// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('Guntherandthehunters', ['ionic', 'config', 'Guntherandthehunters.controllers', 'Guntherandthehunters.services'])

.run(function($ionicPlatform, $rootScope) {
  $rootScope.messagesInfo = [];
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

    /************************/
    /******* ABSTRACT *******/
    /************************/

    .state('core', {
      controller : 'CoreCtrl',
      templateUrl: '../templates/layout/core.html'
    })

    /************************/
    /******* GENERAL ********/
    /************************/

    .state('core.map', {
      url: "/map",
      controller : 'MapCtrl',
      templateUrl: 'templates/map/map.html'
    })


    /************************/
    /******** AUTH **********/
    /************************/

    .state('login', {
      url: "/login",
      controller : 'AuthLoginCtrl',
      templateUrl: 'templates/auth/login.html'
    })

    .state('register', {
      url: "/register",
      controller : 'AuthRegisterCtrl',
      templateUrl: 'templates/auth/register.html'
    })

    .state('forgot', {
      url: "/forgot",
      controller : 'AuthForgotCtrl',
      templateUrl: 'templates/auth/forgot.html'
    })

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/map');
});

