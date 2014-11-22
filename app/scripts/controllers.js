'use strict';
angular.module('Guntherandthehunters.controllers', [])

/************************/
/******** CORE **********/
/************************/

//Coeur de l'application
.controller('CoreCtrl', function(ENV) {
	console.log(ENV.apiEndpoint);
})

/************************/
/******* GENERAL ********/
/***********************/

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
.controller('AuthCtrl', function($scope) {
})

.controller('AuthLoginCtrl', ['$scope', 'User', function($scope, User) {
  	$scope.formData = {};
	$scope.login = function () {
		var login = $scope.formData.email;	
		var password = $scope.formData.password;	
		var promiseLogin = User.loginUser(login, password);
		promiseLogin.then(
			function(result) {
				console.log(result);
				if(result.data.error) {
					$rootScope.errorForm = result.data.error;
					$rootScope.success = "";
				} else if(result.data.user) {
					$rootScope.success = "Vous êtes bien connecté.";
					$rootScope.errorForm = "";
					$routeSegment.chain[0].reload();
					$location.path('/');
				}
			},
			function(error) {
				$rootScope.errorForm = "Une erreure a empéché votre connexion, merci de réessayer."
				$rootScope.success = "";
			});
	}
	

}])

.controller('AuthRegisterCtrl', function($scope) {
})

.controller('AuthForgotCtrl', function($scope) {
})

.controller('AuthUnregisterCtrl', function($scope) {
})