'use strict';
var app = angular.module('Guntherandthehunters.controllers', ['ngMap'])

/************************/
/******** CORE **********/
/************************/

//Coeur de l'application
app.controller('CoreCtrl', function($scope, $http, User) {

	// On initialise le scope des boutons du menu
	$scope.list = [];
	// On recupere la liste des boutons du menu via son json
	$http.get('../json/menu.json').success(function(data){
		// On injecte la liste recuperé grace au json dans le scope
    	$scope.list = data.boutons;
    });

	// On verifie si l'utilisateur est connecté
    var promise = User.verifLogin.isLogged();
	promise.$promise.then(function(result){
		if(result.error != undefined){
			console.log(result);
		}else{
			console.log(result);
		}
	},function(error){
		console.log(error);
	});
})

// Controller general à l'ensemble de l'application
.controller('ConfigCtrl', function($scope, $state, $rootScope, $http) {

	// Fonction goToState avec pour parametre l'url d'un state
	$scope.goToState = function(url){
		// On va vers le state "url"
		$state.go(url);
	}
})

/************************/
/******* GENERAL ********/
/***********************/

app.controller('MapCtrl', function($scope, $ionicModal, $ionicLoading, $ionicPlatform,$timeout, $http) {

	// Tableau des markers present sur la map
	$scope.player = [];
	// Tableau des markers present sur la map
	$scope.ennemy = [];
	// Tableau des markers present sur la map
	$scope.shapeList = [];
	// Tableau de données de position
	$scope.positionsPlayer = [];
	// Tableau des boutons du footer
	$scope.itemsFooter = [];

	/*******   MAP  *******/

	// Creation d'une animation de marker
	$scope.toggleBounce = function() {
		if (this.getAnimation() != null) {
			this.setAnimation(null);
		} else {
			this.setAnimation(google.maps.Animation.BOUNCE);
		}
    }

    // Une fois que la map a bien été initialisé
	$scope.$on('mapInitialized', function(event, map) {
		//Récuperation du style de map en json
		$http.get('../json/mapStyle.json').success(function(data){
			console.log("Recuperation du style de la carte et initialisation de la map")
			// Création du style de la map
	    	var roadGuntherStyles = data;
	    	var styledMapOptions = {name: 'FR Gunther style'};
			var frMapGuntherStyle = new google.maps.StyledMapType(roadGuntherStyles, styledMapOptions);
			// Ajout du style de la map
			map.mapTypes.set('frguntherstyle', frMapGuntherStyle);
			map.setMapTypeId('frguntherstyle');
			// Ajout de la map
			$scope.map = map;
			// Fonction de geolocalisation du player
			$scope.centerOnMe();
	    });
	});

	// Ajout d'un nouveau marker
	$scope.addPlayer= function(x,y){
		$scope.player = [{
			posX:x,
			posY:y,
			icone:
	            {
		            path:'CIRCLE', 
		            fillColor: '#95DE42', 
		            scale: 10, 
		            fillOpacity:1, 
		            strokeColor:'#1D1D1D',
		            strokeOpacity:0.5,
		            strokeWeight:3
	            },
	        anim:'DROP',
	        click: ''
         }];
	}

	// Ajout d'un nouveau marker
	$scope.addEnnemy= function(){
		//Récuperation des ennemies
		$http.get('../json/ennemy.json').success(function(data){
			$scope.ennemy = data;
	    });
	}

	// Centrer la map et le joueur sur la position géolocalisé
	$scope.centerOnMe= function(){

		// On affiche la barre de chargement
		$ionicLoading.show({
			template: 'Loading...'
		});

		// Une fois que la plateforme ionic est prete
		$ionicPlatform.ready(function() {
			// On recherche la position actuel de l'utilisateur
			navigator.geolocation.getCurrentPosition(function(position) {

				// On crée une nouvelle position google map
				var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
				// On retire du tableau des markers le marker du joueur precedent
				$scope.ennemy = [];
				// On rerajoute le joueur a sa nouvelle position
				if($scope.player.length == 0){
					$scope.addPlayer(position.coords.latitude,position.coords.longitude);
					$scope.map.setCenter(pos);
				}else{
					$scope.movePlayer(pos);
				}
				// On rerajoute le joueur a sa nouvelle position
				$scope.addEnnemy();
				// On push ces positions dans le tableau de position
				$scope.positionsPlayer.push({lat: pos.k,lng: pos.B});

				// On cache la barre de chargement
				$ionicLoading.hide();				
			}, function(){
				// Si les données de géolocalisation sont inexistante ou desactivé, on previens l'utilisateur
				alert("Pas de données trouvé, veuillez activer la géolocalisation sur votre mobile pour pouvoir jouer");
				// On cache la barre de chargement
				$ionicLoading.hide();
			});
		});
	}

	navigator.geolocation.watchPosition(function(position) {
		if($scope.map.markers[0] != undefined){
			var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
			$scope.movePlayer(pos);
		}
	}, function(error){
		console.log(error);
		alert(error);
	});

	$scope.movePlayer = function(pos){
		var tmpObj = $scope.map.markers[0];
        tmpObj.animateTo(
        	pos, 
			{
				easing: 'linear', 
				duration: 3000,
				complete: function(){
					$scope.map.setCenter(pos);
				}
            });
	}	

	/*******   Modal  *******/

	// Recuperation du template du modal
	$ionicModal.fromTemplateUrl('templates/chat/chat.html', function($ionicModal) {
		// On injecte le modal dans la scope
		$scope.modal = $ionicModal;
	},{
		scope: $scope,
		animation: 'slide-in-up'
	});

	/*******   Footer de la Map  *******/

	// On récupère les boutons du footer grace à son json
	$http.get('../json/footerMap.json').success(function(data){
		// on les injecte dans le scope
    	$scope.itemsFooter = data.boutons;
    });

	// On active ou desactive l'effet graphique d'un bouton actif du footer
	$scope.activeItem = function(item){
		if($scope.itemsFooter[item].classe == "tab-item itemActivated"){
			$scope.itemsFooter[item].classe = "tab-item";
		}else{
			$scope.itemsFooter[item].classe = "tab-item itemActivated";
		}	
	}

})

app.controller('ChatCtrl', function ($scope) {
	// On initialise le tableau de messages
	$scope.messages = [];

	// Fonction de creation d'un nouveau message
	$scope.addMessage = function(item){
		// Recuperation de l'heure et des minutes
		var d = new Date();
		var hour = d.getHours();
		var minute = d.getMinutes();
		var timeItem = ""+hour +":"+minute+"";
		// Ajout du nouveau message dans le tableau des messages
		$scope.messages.push({content:item, time:timeItem});
	}

	// Fonction de clear du chat
	$scope.clearChat = function(){
		// On reinitialise le scope des messages
		$scope.messages = [];
	}

})

app.controller('EventsCtrl', function ($scope) {})
app.controller('FriendsCtrl', function ($scope) {})
app.controller('PartyCtrl', function ($scope) {})
app.controller('ParamsCtrl',  function ($scope) {})
app.controller('RankCtrl', function ($scope) {})
app.controller('RulesCtrl', function ($scope) {})

/************************/
/******** AUTH **********/
/************************/

app.controller('AuthLoginCtrl', function($scope, $state, $rootScope, User) {

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
})

app.controller('AuthRegisterCtrl', function($scope) {
})

app.controller('AuthForgotCtrl', function($scope) {
})

app.controller('AuthUnregisterCtrl', function($scope) {
})