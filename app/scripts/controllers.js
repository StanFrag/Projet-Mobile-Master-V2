'use strict';
var app = angular.module('Guntherandthehunters.controllers', ['ngMap', 'ng'])

/************************/
/******** CORE **********/
/************************/

//Coeur de l'application
app.controller('CoreCtrl', function($scope, $http, $q, User, AlertService, CURRENTUSER) {

	// On initialise le scope des boutons du menu
	$scope.list = [];
	// On recupere la liste des boutons du menu via son json
	$http.get('../json/menu.json').success(function(data){
		// On injecte la liste recuperé grace au json dans le scope
    	$scope.list = data.boutons;
    });

    $scope.getStorageToken = function(){
    	var deferred = $q.defer(); 
    	deferred.resolve(localStorage.getItem('token'));
		return deferred.promise;
    }

    var tokenTmp = $scope.getStorageToken();

    tokenTmp.then(function(token){
    	$scope.verifToken(token);
    }, function(err){
    	AlertService.add('error', 'Error !', 'Veuillez contacter le support du jeu.');
		$scope.goToState('auth.login');
    })

  	$scope.verifToken = function(token){

  		if(token == "undefined"){
			AlertService.add('error', 'Attention !', 'Veuillez vous identifier avant d\'acceder au jeu');
			$scope.goToState('auth.login');
	  	}else{

	  		var tempUser = User.isLoggedIn.isLoggedIn({access_token : token});
		  	tempUser.$promise.then(function(result) {
		  		if(result){
		  			if(!result.isLoggedIn){
		  				AlertService.add('error', 'Attention !', 'Veuillez vous identifier avant d\'acceder au jeu');
			  			$scope.goToState('auth.login');
			  		}else{

			  		}
		  		}else{
		  			AlertService.add('error', 'Attention !', 'Problème au sein du serveur Gunther, veuillez contacter un administrateur!');
		  			$scope.goToState('auth.login');
		  		}	
		  	});
	  	}
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

app.controller('MapCtrl', function($scope, $ionicModal, $ionicLoading, $ionicPlatform,$timeout, $http, SOCKET_URL, CURRENTUSER) {
	
	var socket = io.connect(SOCKET_URL, {'force new connection': true, path: '/socket.io'});

	var randomId = Math.floor(Math.random() * 500);

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

	$scope.posPlayers = [];

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

			// On initialise la position et le marker du player utilisant l'application
			$scope.initiatePlayer()
	    });
	});

	// Centrer la map et le joueur sur la position géolocalisé
	$scope.initiatePlayer= function(){
		// On affiche la barre de chargement
		$ionicLoading.show({
			template: 'Chargement...'
		});

		// Une fois que la plateforme ionic est prete
		$ionicPlatform.ready(function() {
			// On recherche la position actuel de l'utilisateur
			navigator.geolocation.getCurrentPosition(function(position) {
				// On crée une nouvelle position google map
				var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

				var posPlayer = {
					user:randomId,
					posX:position.coords.latitude,
					posY:position.coords.longitude
				};

				socket.emit('newUser', posPlayer);

				// On rerajoute le joueur a sa nouvelle position
				$scope.addMainPlayer(position.coords.latitude,position.coords.longitude);

				// On centre la map sur la position du player principal
				$scope.map.setCenter(pos);

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

	// Incoming
	socket.on('broadcastPositions', function(datas) {

		var tmpData = [];

		for (var i = datas.length - 1; i >= 0; i--) {

			var obj = {
				"posX":datas[i].posX,
				"posY":datas[i].posY,
				"id":datas[i].user,
				"icone":
				{
					"path":"CIRCLE", 
		            "fillColor": "#F52121",
		            "fillOpacity":1, 
		            "scale": 5, 
		            "strokeColor":"#1D1D1D",
		            "strokeOpacity":1,
		            "strokeWeight":1
		        },
		    	"anim":"DROP",
		    	"click": ""
			};

			tmpData.push(obj);
		};
		
		$scope.ennemy = tmpData;
	});

	socket.on('userPositionChange', function(data) {

		if(data.user == randomId){
			

			var pos = new google.maps.LatLng(data.posX, data.posY);
			$scope.movePlayer(pos);

			for (var i = 0; i < $scope.ennemy.length; i++) {

				var tmp = $scope.ennemy[i];
				if(data.user == tmp){

				}
			}

		}else{
			console.log("Un joueur adverse à effectué un mouvement");

			for (var i = 0; i < $scope.ennemy.length + 1; i++) {

				if(data.user == $scope.map.markers[i].id){
				}
			}
		}
	});

	socket.on('posCreated', function(data) {
		$scope.posPlayers.push(data);
	});

	$scope.$watch('posPlayers', function(newValue, oldValue) {
  		for (var i = $scope.posPlayers.length - 1; i >= 0; i--) {
  			$scope.posPlayers[i]
  			$scope.ennemy.push($scope.createMarker(pos));
  		};
	});

	// Outgoing
	$scope.createPosPlayer = function(position) {

		var posPlayer = {
			user:randomId,
			posX:position.k,
			posY:position.D
		};

		socket.emit('watchPosition', posPlayer);
	}

	$scope.addMainPlayer = function(coox, cooy){
		$scope.player = [{
			posX : coox,
			posY : cooy,
			icone :
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

	$scope.movePlayer = function(pos){

		var tmpObj = $scope.map.markers[0];

		// On affiche la barre de chargement
		$ionicLoading.show({
			template: 'Loading...'
		});

		$scope.positionsPlayer.push({lat: pos.k,lng: pos.B});

        tmpObj.animateTo(
        	pos, 
			{
				easing: 'linear', 
				duration: 3000,
				complete: function(){
					$scope.map.setCenter(pos);
					$ionicLoading.hide();
				}
            });
	}

	navigator.geolocation.watchPosition(
		function(position) {
			var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
			$scope.createPosPlayer(pos);

		}, function(error){
			//alert('code: '    + error.code    + '\n' + 'message: ' + error.message + '\n');
			console.log(error)
		}, { 
			maximumAge: 5000,
			timeout: 10000, 
			enableHighAccuracy: true 
		}
	);

    /*
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

	/*
	// Recuperation du template du modal
	$ionicModal.fromTemplateUrl('view/chat/tchat.html', function($ionicModal) {
		// On injecte le modal dans la scope
		$scope.modal = $ionicModal;
	},{
		scope: $scope,
		animation: 'slide-in-up'
	});
	*/

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

app.controller('EventsCtrl', function ($scope, User, Event, $ionicLoading, AlertService) {

	//Initialisation du tableau d'événements
	$scope.events = [];
	//Initialisation du tableau de filtres
	$scope.filters = {
		limit : 10,
		offset : 0,
		filter : '',
		hisEvents : 0
	};

	//Vue d'affichage des filtres d'affichage des events
	$scope.openFilter = function() {

	}

	//Fonction de récupération des événements
	$scope.getEvents = function(limit, offset, filter, hisEvents) {
		if(hisEvents) {
			var id = $scope.user.id;
		}

		var promiseEvents = Event.user.get({limit : limit, offset : offset, filter : filter, id : id});
		promiseEvents.$promise.then(function(data) {
			if(data.success) {
				//On ajoute les événements au tableau éxistant
				$scope.events= $scope.events.concat(data.events);
				$ionicLoading.hide();
			} else {
				AlertService.add('error', 'Erreur,', data.error);
				$ionicLoading.hide();
			}
		}, function(error) {
			AlertService.add('error', 'Erreur,', 'Nous n\'avons pas reussi à contacter le service, merci de réessayer plus tard.');
			$ionicLoading.hide();
		})
	}
	//Récupère plus d'événements au scroll de l'utilisateur
	$scope.getMoreEvents = function() {

	}
	var tokenTmp = $scope.getStorageToken();

	tokenTmp.then(function(token){
		var tempUser = User.isLoggedIn.isLoggedIn({access_token : token});
		tempUser.$promise.then(function(result) {
			if(result){
				if(!result.isLoggedIn){
					AlertService.add('error', 'Attention !', 'Veuillez vous identifier avant d\'acceder au jeu');
					$scope.goToState('auth.login');
				}else{
					$scope.user = result.user;
					//Initialisation
					$scope.initialize = function(filters) {
						// On affiche la barre de chargement
						$ionicLoading.show({
							template: 'Chargement...'
						});
						$scope.getEvents(filters.limit, filters.offset, filters.filter, filters.hisEvents);
					}($scope.filters);
				}
			}else{
				AlertService.add('error', 'Attention !', 'Problème au sein du serveur Gunther, veuillez contacter un administrateur!');
				$scope.goToState('auth.login');
			}
		});
	}, function(err){
		AlertService.add('error', 'Error !', 'Veuillez contacter le support du jeu.');
		$scope.goToState('auth.login');
	})


})

app.controller('AddEventCtrl', function($scope, $http, Event, User, $stateParams) {
	$scope.coords = "44.8376455, -0.5790386999999555";
	/**
	 * OPTIONS DU FORMULAIRE
	 */
	var options = Event.getOptions();
	$scope.maxPerimeter = options.maxPerimeter;
	$scope.minPerimeter = options.minPerimeter;
	$scope.minDuration = options.minDuration;
	$scope.maxDuration = options.maxDuration;
	$scope.minPlayers = options.minPlayers;
	$scope.maxPlayers = options.maxPlayers;
	$scope.minDifficulty = options.minDifficulty;
	$scope.maxDifficulty = options.maxDifficulty;

	//Tableau de marqueurs
	$scope.markers = [];
	//Option du slider périmètre
	$scope.perimeterOptions = {
		min: $scope.minPerimeter,
		max: $scope.maxPerimeter,
		step: 1
	};
	//Option du slider sur la durée
	$scope.durationOptions = {
		min: $scope.minDuration,
		max: $scope.maxDuration,
		step: 1
	};
	//Option du slider du nombre de joueurs
	$scope.playersOptions = {
		min: $scope.minPlayers,
		max: $scope.maxPlayers,
		step: 1
	};
	//Option du slider de la difficulté
	$scope.difficultyOptions = {
		min: $scope.minDifficulty,
		max: $scope.maxDifficulty,
		step: 1
	};

	//Id de l'événement
	var eventId = $stateParams.id;
	//Date d'aujourd'hui pour le calendrier
	var nowDate = new Date();
	//On rajoute une heure pour que l'événement ne soit pas créé imédiatement
	nowDate.setHours(nowDate.getHours()+1);
	//On se met à l'heure fixe
	nowDate.setMinutes(0, 0);
	//Données des sliders du formulaire
	$scope.sliders = {};
	//Si on modifie un événement (id dans l'url)
	if(eventId) {
		//On met a true une variable pour savoir que l'on est dans une update
		$scope.update = true;
		//Données du formulaire
		$scope.event = {};
		//Récuperation depuis l'API
		Events.user.get({eventId : eventId}).$promise.then(function(data) {
			//
			if(!data.success) {
				$rootScope.errorForm =
					data.event;
				$rootScope.success = "";
				$location.path('/events');
			}
			$scope.event = data.event.event;
			$scope.event.dateFin = new Date($scope.event.created).toLocaleDateString() + ' ' + new Date($scope.event.created).toLocaleTimeString()
			$scope.coords = data.event.coords.posX + ", " + data.event.coords.posY;
			$scope.movePosition(data.event.coords.posX, data.event.coords.posY);
			$scope.sliders.sliderValue = $scope.event.distance;

			$scope.sliders.durationValue =  $scope.event.duration;
			$scope.sliders.difficultyValue = $scope.event.difficult;
			$scope.sliders.playersValue = [$scope.event.min_players, $scope.event.max_players];

		});
	} else {
		$scope.update = false;
		$scope.event = {};
		$scope.event.created = nowDate;
		$scope.event.dateFin = nowDate.toLocaleDateString() + ' ' + nowDate.toLocaleTimeString()
		$scope.sliders.sliderValue = $scope.minPerimeter;
		$scope.sliders.durationValue = $scope.minDuration;
		$scope.sliders.playersValue = [$scope.minPlayers, ($scope.minPlayers + 5)];
		$scope.sliders.difficultyValue = $scope.minDifficulty;
		$scope.difficulty = "EASY";
	}

	$scope.$watch('sliders.sliderValue', function(value) {
		$scope.enlargePerimeter(value);
	});
	$scope.$watch('sliders.difficultyValue', function(value) {
		var message = "";
		if(value > 0 && value <= 3 ) {
			message = "EASY";
		} else if (value <= 6) {
			message = "MOYEN";
		} else if (value <= 9) {
			message = "DIFFICILE";

		} else if (value == 10) {
			message = "HARDCORE";
		} else {
			$scope.sliders.difficultyValue = 1;
		}
		$scope.difficulty = message;
	});
	//
	$scope.$on('mapInitialized', function (event, map) {
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
			$scope.initiatePosition();


		});
	});

	$scope.initiatePosition = function() {
		if(navigator) {
			// On recherche la position actuelle de l'utilisateur
			navigator.geolocation.getCurrentPosition(function(position) {
				$scope.movePosition(position.coords.latitude, position.coords.longitude);
				var marker = $scope.createMarker(position.coords.latitude, position.coords.longitude, 'eventPos');
				$scope.addMarker(marker);

			}, function(error){
				// Si les données de géolocalisation sont inexistante ou desactivé, on previens l'utilisateur
				alert('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
			});
		} else {
			$scope.movePosition(44.8376455,-0.5790386999999555);
			var marker = $scope.createMarker(44.8376455,-0.5790386999999555, 'eventPos');
			$scope.addMarker(marker);
		}
	}

	$scope.movePosition = function(x, y) {
		// On crée une nouvelle position google map
		var pos = new google.maps.LatLng(x, y);
		$scope.map.setCenter(pos);
	}


	$scope.createMarker = function (x, y, type) {
		var marker = {};
		switch(type) {
			case "eventPos" :
				$scope.coords= x + ", " + y;
				var eventOptions = {
					strokeColor: '#A2C539',
					strokeOpacity: 0.4,
					strokeWeight: 2,
					fillColor: '#A2C539',
					fillOpacity: 0.35,
					map: $scope.map,
					center: new google.maps.LatLng(x, y),
					radius: $scope.event.distance ? $scope.event.distance : $scope.minPerimeter,
					editable : true,
					draggable : true
				};
				$scope.perimeter =  new google.maps.Circle(eventOptions);
				var radius_changed =  google.maps.event.addListener($scope.perimeter, 'radius_changed', function() {
					$scope.enlargePerimeter($scope.perimeter.getRadius());
				});
				var center_changed =  google.maps.event.addListener($scope.perimeter, 'center_changed', function() {
					$scope.movePerimeter($scope.perimeter);
				});
				break;
			case 'bonusPos' :
				marker = {
					posX:x,
					posY:y,
					icone:
					{
						path: google.maps.SymbolPath.CIRCLE,
						fillColor: '#95DE42',
						scale: 10,
						fillOpacity:1,
						strokeColor:'#1D1D1D',
						strokeOpacity:0.5,
						strokeWeight:3
					},
					anim:'DROP',
					click: ''
				};
				break;
		}
		return marker;

	}

	$scope.addMarker = function (marker) {
		$scope.$apply(function() {
			$scope.markers.push(marker);
		});
	}

	$scope.enlargePerimeter = function(radius) {
		if($scope.perimeter) {
			radius = radius <= $scope.maxPerimeter ? radius : $scope.maxPerimeter;
			radius = radius >= $scope.minPerimeter ? radius : $scope.minPerimeter;
			$scope.event.distance = radius;
			if(!$scope.$$phase) {
				$scope.$apply(function() {
					$scope.sliders.sliderValue = radius;
				});
			}
			if($scope.perimeter.getRadius() != radius) {
				console.log('OK')
				$scope.perimeter.setRadius(radius);
			}
		}

	}
	$scope.movePerimeter = function(perimeter) {
		$scope.map.setCenter(perimeter.getCenter());
		$scope.$apply(function() {
			$scope.coords= perimeter.getCenter().lat() + ", " + perimeter.getCenter().lng();
		});
	}


	$scope.onTimeSet = function(nd, oldDate) {
		var newDate = new Date(nd)
		var nowDate = new Date();
		var isPast = newDate.getTime() < nowDate.getTime();
		if(isPast) {
			$scope.event.created = nowDate;
			nowDate.setHours(nowDate.getHours()+1);
			nowDate.setMinutes(0, 0);
			$scope.event.dateFin = nowDate.toLocaleDateString() + ' ' + nowDate.toLocaleTimeString()
		} else {
			$scope.event.created = newDate;
			$scope.event.dateFin = newDate;
			$scope.event.dateFin = newDate.toLocaleDateString() + ' ' + newDate.toLocaleTimeString()
		}
	}


	$scope.submit = function() {
		console.log($scope.update);
		if($scope.update == true) {
			$scope.updateEvent();
		} else {
			$scope.create();
		}
	}

	$scope.updateEvent = function() {
		var user        = User.getUser();
		var event       = $scope.event;
		var event       = Event.user.update({
			user_id     :  user.id,
			event_id    : $scope.event.id,
			title       : $scope.event.title,
			description : $scope.event.description,
			minPlayers  : $scope.sliders.playersValue[0],
			maxPlayers  : $scope.sliders.playersValue[1],
			distance   : $scope.sliders.sliderValue,
			duration    : $scope.sliders.durationValue,
			difficulty  : $scope.sliders.difficultyValue,
			lat         : $scope.coords.split(' ,')[0],
			lng         : $scope.coords.split(' ,')[1],
			created     : $scope.event.created
		});
		event.$promise.then(function (data) {
			if (data.success === false && data.error) {
				if (data.error) {
					$rootScope.errorForm = data.error;
				}
				$rootScope.success = "";
			} else {
				$scope.formData = {};
				// clear the form so our user is ready to enter another
				$scope.
					newsletter = data;

				$rootScope.success   = 'Félicitation, la modification de l\'événement est un succès !';
				$rootScope.errorForm = "";
				$location.path('/events');
			}
		}, function (error) {
			$rootScope.errorForm =
				"Une erreure a empéché la modification de l'évenement, merci de réessayer."
			$rootScope.success = "";
		});
	}

	$scope.create = function() {
		var user = User.getUser();
		var event = Event.user.create({
			user_id : user.id,
			title : $scope.event.title,
			description : $scope.event.description,
			minPlayers : $scope.sliders.playersValue[0],
			maxPlayers : $scope.sliders.playersValue[1],
			distance : $scope.sliders.sliderValue,
			duration : $scope.sliders.durationValue,
			difficulty : $scope.sliders.difficultyValue,
			lat :  $scope.coords.split(' ,')[0],
			lng :  $scope.coords.split(' ,')[1],
			created : $scope.event.created
		});
		event.$promise.then(function (data) {
			if (data.success === false && data.error) {
				if (data.error) {
					$rootScope.errorForm = data.error;
				}
				$rootScope.success = "";
			} else {
				$scope.formData = {};
				// clear the form so our user is ready to enter another
				$scope.
					newsletter = data;

				$rootScope.success   = 'Félicitation, la création de l\'événement est un succès !';
				$rootScope.errorForm = "";
				$location.path('/events');
			}
		}, function (error) {
			$rootScope.errorForm =
				"Une erreure a empéché la création de l'évenement, merci de réessayer."
			$rootScope.success = "";
		});
	}
});

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
				if(result.error) {
					AlertService.add('error', 'Attention !', result.error);
				} else if(result.user) {
					AlertService.add('succes', 'Félicitation !', result.user);
					localStorage.setItem("token", result.user.token);
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
		if(email){
			var promise = User.forgot.resetPassword({email : email});
			promise.$promise.then(function(result) {
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