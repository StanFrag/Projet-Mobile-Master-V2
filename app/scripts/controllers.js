'use strict';
angular.module('Guntherandthehunters.controllers', [])

/************************/
/******** CORE **********/
/************************/

//Coeur de l'application
.controller('CoreCtrl', function($scope, MenuService) {
	$scope.list = MenuService.all();
})

// Controller general à l'ensemble de l'application
.controller('ConfigCtrl', function($scope, $state, $rootScope, MenuService) {
	$scope.goToState = function(url){
		$state.go(url);
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

.controller('AuthLoginCtrl', ['$scope', '$state', '$rootScope','User', function($scope, $state, $rootScope, User) {

	$scope.user = {};

	$scope.messagesInfo = $rootScope.messagesInfo;

	$scope.authenticate = function(params){
		var promise = User.login.authenticate({email: params.login, password: params.password});
		promise.$promise.then(function(result){
			console.log(result.error);
			console.log(result.user);
		}, function(error){
			console.log(error);
		})
		$rootScope.messagesInfo.push({title: "Error!", content:"Veuillez entrer des informations valides.", status: "alert-error"})
		console.log("Login: ",user.login," et Password: ",user.password);
		//$state.go('core.map');
	}
}])

.controller('AuthRegisterCtrl', function($scope) {
})

.controller('AuthForgotCtrl', function($scope) {
})

.controller('AuthUnregisterCtrl', function($scope) {
})