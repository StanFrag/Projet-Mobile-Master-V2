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

.controller('MapCtrl', ['$scope', '$ionicLoading', 'User', function($scope, $ionicLoading, User) {
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

    var myLatlng = new google.maps.LatLng(37.3000, -120.4833);

    var mapOptions = {
        center: myLatlng,
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    var map = new google.maps.Map(document.getElementById("map"), mapOptions);

    navigator.geolocation.getCurrentPosition(function(pos) {
        map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
        var myLocation = new google.maps.Marker({
            position: new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude),
            map: map,
            title: "My Location"
        });
    });

    $scope.map = map;

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