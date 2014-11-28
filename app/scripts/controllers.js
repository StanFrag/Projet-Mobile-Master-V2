'use strict';
angular.module('Guntherandthehunters.controllers', [])

/************************/
/******** CORE **********/
/************************/

//Coeur de l'application
.controller('CoreCtrl', function($scope, MenuService) {
	$scope.list = MenuService.all();

	$scope.goTo = function(url){
		alert(url)
	}
})

/************************/
/******* GENERAL ********/
/***********************/

.controller('MapCtrl', function($scope) {
})

.controller('MenuCtrl', function($scope) {
})

.controller('NotificationsCtrl', function($scope) {
})

.controller('SettingsCtrl', function($scope) {
})


/************************/
/******* EVENTS *********/
/************************/

//Constroller de la gestion des événements
.controller('EventsCtrl', ['$scope', function ($scope) {


}])

/************************/
/******** AUTH **********/
/************************/

.controller('AuthLoginCtrl', function($scope) {
})

.controller('AuthRegisterCtrl', function($scope) {
})

.controller('AuthForgotCtrl', function($scope) {
})

.controller('AuthUnregisterCtrl', function($scope) {
})