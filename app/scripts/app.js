'use strict';
// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('Guntherandthehunters', ['ngResource', 'ionic', 'config', 'Guntherandthehunters.controllers', 'Guntherandthehunters.services', 'ui.bootstrap-slider', 'ui.bootstrap.datetimepicker'])

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

      .state('core.event', {
        url: "/event/:id",
        controller : 'EventCtrl',
        templateUrl: 'templates/events/event.html'
      })
    .state('core.events', {
      url: "/events",
      controller : 'EventsCtrl',
      templateUrl: 'templates/events/events.html'
    })
      .state('core.addEvents', {
        url: "/events/add",
        controller : 'AddEventCtrl',
        templateUrl: 'templates/events/add.html'
      })
      .state('core.updateEvent', {
        url: "/events/add/:id",
        controller : 'AddEventCtrl',
        templateUrl: 'templates/events/add.html'
      })
    .state('core.profil', {
      url: "/profil",
      controller : 'ProfilCtrl',
      templateUrl: 'templates/events/events.html'
    })

    .state('core.friends', {
      url: "/friends",
      controller : 'FriendsCtrl',
      templateUrl: 'templates/friends/friends.html'
    })

    .state('core.party', {
      url: "/party",
      controller : 'PartyCtrl',
      templateUrl: 'templates/party/party.html'
    })

    .state('core.params', {
      url: "/params",
      controller : 'ParamsCtrl',
      templateUrl: 'templates/params/params.html'
    })

    .state('core.rank', {
      url: "/rank",
      controller : 'RankCtrl',
      templateUrl: 'templates/rank/rank.html'
    })

    .state('core.rules', {
      url: "/rules",
      controller : 'RulesCtrl',
      templateUrl: 'templates/rules/rules.html'
    })

    /************************/
    /******** AUTH **********/
    /************************/

    .state('auth', {
      templateUrl: '../templates/auth/auth.html'
    })

    .state('auth.login', {
      url: "/login",
      controller : 'AuthLoginCtrl',
      templateUrl: 'templates/auth/login.html'
    })

    .state('auth.register', {
      url: "/register",
      controller : 'AuthRegisterCtrl',
      templateUrl: 'templates/auth/register.html'
    })

    .state('auth.forgot', {
      url: "/forgot",
      controller : 'AuthForgotCtrl',
      templateUrl: 'templates/auth/forgot.html'
    })

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/map');
})

.value('CURRENTUSER',{})
.value('SOCKET_URL','localhost:3000')

