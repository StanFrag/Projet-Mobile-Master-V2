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

	var tok = localStorage.getItem('token');
	console.log("Recuperation en LocalStorage du token: ",tok);

	if(!tok){
		AlertService.add('error', 'Attention !', 'Veuillez vous identifier avant d\'acceder au jeu');
		$scope.goToState('auth.login');
  	}else{
  		var tempUser = User.isLoggedIn.isLoggedIn({access_token : tok});
	  	tempUser.$promise.then(function(result) {
	  		if(result){
	  			if(!result.isLoggedIn){
	  				AlertService.add('error', 'Attention !', 'Veuillez vous identifier avant d\'acceder au jeu');
		  			$scope.goToState('auth.login');
		  		}
	  		}else{
	  			AlertService.add('error', 'Attention !', 'Problème au sein du serveur Gunther, veuillez contacter un administrateur!');
	  			$scope.goToState('auth.login');
	  		}	
	  	});
  	}
})

// Controller general à l'ensemble de l'application
app.controller('ConfigCtrl', function($scope, $state, $rootScope, $http) {

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
			$scope.initiatePlayer();
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
		var tmpPos = $scope.positionsPlayer.length - 1;
		var pos = new google.maps.LatLng($scope.positionsPlayer[tmpPos].lat, $scope.positionsPlayer[tmpPos].lng);
		//$scope.activeItem[0];
		$scope.map.setCenter(pos);
		
	}

	// Centrer la map et le joueur sur la position géolocalisé
	$scope.initiatePlayer= function(){

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
				$scope.addPlayer(position.coords.latitude,position.coords.longitude);
				$scope.map.setCenter(pos);
				// On rerajoute le joueur a sa nouvelle position
				$scope.addEnnemy();
				// On push ces positions dans le tableau de position
				$scope.positionsPlayer.push({lat: pos.k,lng: pos.B});
				// On cache la barre de chargement
				$ionicLoading.hide();				
			}, function(error){
				// Si les données de géolocalisation sont inexistante ou desactivé, on previens l'utilisateur
				alert('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
				// On cache la barre de chargement
				$ionicLoading.hide();
			});
		});
	}

	navigator.geolocation.watchPosition(function(position) {
		if($scope.map.markers[0] != undefined){
			var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
			$scope.movePlayer(pos);
			$scope.sendPlayerPosition();
		}
	}, function(error){
		alert('code: '    + error.code    + '\n' + 'message: ' + error.message + '\n');
	},{ maximumAge: 5000, timeout: 10000, enableHighAccuracy: true });

	$scope.movePlayer = function(pos){
		var tmpObj = $scope.map.markers[0];
		$scope.positionsPlayer.push({lat: pos.k,lng: pos.B});
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
	//Chambres de discussions disponnibles pour l'utilisateur
	$scope.rooms = [];

	//Récupération des rooms disponnibles pour l'utilisateur

	//L'utilisateur rejoins une Room
	$scope.joinRoom = function(messages) {
		//On remplace les message par ceux de la room
		$scope.messages = messages;
		//On crée un événement d'écoute des nouveaux messages
	}

	// Fonction de creation d'un nouveau message
	$scope.addMessage = function(item){
		//Evenement d'emission du message vers le serveur

		/* OLD STAN
		// Recuperation de l'heure et des minutes
		var d = new Date();
		var hour = d.getHours();
		var minute = d.getMinutes();
		var timeItem = ""+hour +":"+minute+"";
		// Ajout du nouveau message dans le tableau des messages
		$scope.messages.push({content:item, time:timeItem});
		*/
	}

	//Ouverture du volet des rooms disponnibles
	$scope.openList = function(){

	}

	// Fonction de clear du chat
	$scope.clearChat = function(){
		// On reinitialise le scope des messages
		$scope.messages = [];
	}
})

app.controller('EventsCtrl', function ($scope) {
	//Initialisation du tableau d'événements
	$scope.events = [];
	//Initialisation du tableau de filtres
	$scope.filters = {
		limit : 10,
		offset : 0,
		filter : ''
	};

	//Vue d'affichage des filtres d'affichage des events
	$scope.openFilter = function() {

	}
	//Fonction de récupération des événements
	$scope.getEvents = function(limit, offset, filter) {

	}
	//Récupère plus d'événements au scroll de l'utilisateur
	$scope.getMoreEvents = function() {

	}
})

app.controller('EventsDetailsCtrl', function ($scope) {
	//Récupération de l'événement
	$scope.event = [];

	//L'utilisateur clique sur le bouton participer/se désinscrire de l'événement
	$scope.participate = function() {

	}
})

app.controller('FriendsCtrl', function ($scope) {

	$scope.internFriend = [
							{
								id:0, 
								nom:"Lucas Soler", 
								srcImg:"../images/img_profil/robin_img.jpg", 
								isLogged:true, 
								icon: {
									play: true,
									chat: true, 
									location: true
								}
							},
							{
								id:1, 
								nom:"Stan Frag", 
								srcImg:"img/dolo.jpg", 
								isLogged:true,
								icon: {
									play: false,
									chat: false, 
									location: false
								}
							},
							{
								id:2, 
								nom:"Robin Zattara", 
								srcImg:"img/dolo.jpg",
								isLogged:false,
								icon: {
									play: true,
									chat: true, 
									location: false
								}
							},
							{
								id:3, 
								nom:"Turin Anis", 
								srcImg:"img/dolo.jpg",
								isLogged:false,
								icon: {
									play: true,
									chat: true, 
									location: true
								}
							},
							{
								id:4, 
								nom:"Sami Bendoumou", 
								srcImg:"img/dolo.jpg",
								isLogged:true,
								icon: {
									play: true,
									chat: true, 
									location: false
								}
							},
							{
								id:5, 
								nom:"Vanessa Etchegoyen", 
								srcImg:"img/dolo.jpg",
								isLogged:false,
								icon: {
									play: false,
									chat: true, 
									location: false
								}
							},
							{
								id:6, 
								nom:"Vincent Tomilas", 
								srcImg:"img/dolo.jpg",
								isLogged:false,
								icon: {
									play: true,
									chat: true, 
									location: true
								}
							}
	]
})

app.controller('PartyCtrl', function ($scope) {})
app.controller('ParamsCtrl',  function ($scope) {

})
app.controller('RankCtrl', function ($scope) {})
app.controller('RulesCtrl', function ($scope) {})

/************************/
/******** AUTH **********/
/************************/

app.controller('AuthCtrl', function($scope, $state, $rootScope, User) {

	var tok = localStorage.getItem('token');	

	console.log("Recuperation en LocalStorage du token: ",tok);

	if(tok)
	{
		var tempUser = User.isLoggedIn.isLoggedIn({access_token : tok});
		tempUser.$promise.then(function(result) {
	  		if(result.isLoggedIn){
	  			AlertService.add('succes', 'Félicitation !', 'Vous avez été redirigé vers le jeu car vous ètes deja connecté');
	  			$scope.goToState('core.map');
	  		}
	  	});
	}
})

app.controller('AuthLoginCtrl', function($scope, $state, $rootScope, User, AlertService) {

	$scope.user = {};
	$scope.messagesInfo = $rootScope.messagesInfo;	

	$scope.authenticate = function(params){
		if(!params){
			AlertService.add('error', 'Attention !', 'Aucune informations recuperer, veuillez remplir l\'ensemble des champs pour pouvoir vous identifier !');
		}else if(params.login && params.password){

			var promise = User.login.loginUser({email: params.login, password: params.password});
			promise.$promise.then(function(result){
				console.log(result);
				if(result.error) {
					AlertService.add('error', 'Attention !', result.error);
				} else if(result.user) {
					AlertService.add('succes', 'Félicitation !', result.user);
					localStorage.setItem("token", result.user.token);
					console.log("Insert en LocalStorage du token: ", result.user.token);
					$state.go('core.map');
				}
			}, 
			function(error){
				AlertService.add('error', 'Attention !', error);
			})

		}else{
			AlertService.add('error', 'Attention !', 'Veuillez remplir l\'ensemble des champs du formulaire!');
		}

	}
})

app.controller('AuthRegisterCtrl', function($scope, $state, $rootScope, User, AlertService) {

	$scope.user = {};
	$scope.messagesInfo = $rootScope.messagesInfo;	
	console.log("toto");
	$scope.register = function(params){
		if(!params){
			AlertService.add('error', 'Attention !', 'Aucune informations recuperer, veuillez remplir l\'ensemble des champs pour pouvoir vous inscrire !');
		}else if(params.password && params.passwordVerif && params.email && params.login){
			if(params.password != params.passwordVerif){
				AlertService.add('error', 'Attention !', 'Le mot de passe et la verification ne sont pas identiques !');
			}else{
				var promise = User.register.create({username : params.login, email : params.email, password : params.password});
				promise.$promise.then(function(result) {
					console.log(result);
					if(result.error) {
						AlertService.add('error', 'Attention !', result.error);
					} else if(result.user) {
						AlertService.add('succes', 'Félicitation !', result.user);
						$state.go('auth.login');
					}
				},
				function(error) {
					AlertService.add('error', 'Attention !', error);
				});
			}
		}else{
			AlertService.add('error', 'Attention !', 'Veuillez remplir l\'ensemble des champs du formulaire!');
		}
	}
})

app.controller('AuthForgotCtrl', function($scope, $state, $rootScope, User, AlertService) {	
	$scope.user = {};

	$scope.forgot = function(email){
		console.log(email);
		if(email){
			var promise = User.forgot.resetPassword({email : email});
			promise.$promise.then(function(result) {
				console.log(result);
				if(result.error) {
					AlertService.add('error', 'Attention !', result.error);
				} else if(result.user) {
					AlertService.add('succes', 'Félicitation !', result.user);
					$state.go('auth.login');
				}
			},
			function(error) {
				AlertService.add('error', 'Attention !', error);
				$rootScope.messagesInfo.push({title: "Error !", content: error, status: "alert-error"});
			});
		}else{
			AlertService.add('error', 'Attention !', 'Veuillez saisir un email valide !');
		}
	}
})