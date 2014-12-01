'use strict';
angular.module('Guntherandthehunters.controllers', ['ngMap'])

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

.controller('MapCtrl', ['$scope', '$ionicModal', '$ionicLoading', 'User', function($scope, $ionicModal, $ionicLoading, User) {
	var promise = User.verifLogin.isLogged();

	promise.$promise.then(function(result){
		if(result.error != undefined){
			console.log(result);
		}else{
			console.log(result);
		}
	}, function(error){
		console.log(error);
	})

	$scope.positions = [{
    	lat: 43.07493,
    	lng: -89.381388
	}];

	$scope.$on('mapInitialized', function(event, map) {
		$scope.map = map;
	});

	$scope.centerOnMe= function(){

		$scope.positions = [];

		$ionicLoading.show({
			template: 'Loading...'
		});

		navigator.geolocation.getCurrentPosition(function(position) {
			var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
			$scope.positions.push({lat: pos.k,lng: pos.B});
			console.log(pos);
			$scope.map.setCenter(pos);
			$ionicLoading.hide();
		});
	};

	$ionicModal.fromTemplateUrl('templates/chat/chat.html', function($ionicModal) {
	    $scope.modal = $ionicModal;
	},{
	    // Use our scope for the scope of the modal to keep it simple
	    scope: $scope,
	    // The animation we want to use for the modal entrance
	    animation: 'slide-in-up'
	});

}])

.controller('ChatCtrl', ['$scope', function ($scope) {

	$scope.messages = [];

	$scope.addMessage = function(item){

		var d = new Date();
		var hour = d.getHours();
		var minute = d.getMinutes();
		var timeItem = ""+hour +":"+minute+"";
		
		$scope.messages.push({content:item, time:timeItem});
	}

	$scope.clearChat = function(){
		$scope.messages = [];
	}

}])

.controller('EventsCtrl', ['$scope', function ($scope) {}])

.controller('FriendsCtrl', ['$scope', function ($scope) {}])

.controller('PartyCtrl', ['$scope', function ($scope) {}])

.controller('ParamsCtrl', ['$scope', function ($scope) {}])

.controller('RankCtrl', ['$scope', function ($scope) {}])

.controller('RulesCtrl', ['$scope', function ($scope) {}])

/************************/
/******** AUTH **********/
/************************/

.controller('AuthLoginCtrl', ['$scope', '$state', '$rootScope','User', function($scope, $state, $rootScope, User) {

	$scope.user = {};

	$scope.messagesInfo = $rootScope.messagesInfo;

	$scope.authenticate = function(params){

		if(params.login == undefined){
			$rootScope.messagesInfo.push({title: "Attention !", content: "Veuillez saisir un Login valide!", status: "alert-error"});
		}else if(params.password == undefined){
			$rootScope.messagesInfo.push({title: "Attention !", content: "Veuillez saisir un Mot de passe valide!", status: "alert-error"});
		}else{
			var promise = User.login.authenticate({email: params.login, password: params.password});

			promise.$promise.then(function(result){
				if(result.error != undefined){
					console.log(result.error);
					$rootScope.messagesInfo.push({title: "Error !", content: result.error, status: "alert-error"});
				}else{
					//console.log(result.user);
					$state.go('core.map');
				}
			}, function(error){
				console.log(error);
				$rootScope.messagesInfo.push({title: "Error !", content: error, status: "alert-error"});
			})
		}

	}
}])

.controller('AuthRegisterCtrl', function($scope) {
})

.controller('AuthForgotCtrl', function($scope) {
})

.controller('AuthUnregisterCtrl', function($scope) {
})