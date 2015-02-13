'use strict';
var app = angular.module('Guntherandthehunters.controllers', ['ngMap', 'ng'])

/************************/
/******** CORE **********/
/************************/

//Coeur de l'application
app.controller('CoreCtrl', function($scope, $http, $q, $state, User, AlertService, CURRENTUSER) {

	// On initialise le scope des boutons du menu
	$scope.list = [];
	// On recupere la liste des boutons du menu via son json
	$http.get('../json/menu.json').success(function(data){
		// On injecte la liste recuperé grace au json dans le scope
    	$scope.list = data.boutons;
    });

    $scope.disconnect = function(){
    	var supp = $scope.delStorageToken('token')
    	.then(function(){
    		AlertService.add('succes', 'Félicitation !', 'Vous avez été correctement déconnecté de votre session.');
    		$scope.goToState('auth.login');
    	})
    }

    // DELETE DU STORAGE TOKEN
    $scope.delStorageToken = function(item){
    	var deferred = $q.defer(); 
    	deferred.resolve(localStorage.removeItem(item));
		return deferred.promise;
    }

    // Fonction goToState avec pour parametre l'url d'un state
	$scope.goToState = function(url){
		// On va vers le state "url"
		if(url){
			$state.go(url);
		}
	}
})

// Controller general à l'ensemble de l'application
app.controller('ConfigCtrl', function($scope, $state, $rootScope, $http) {

	// Fonction goToState avec pour parametre l'url d'un state
	$scope.goToState = function(url){
		// On va vers le state "url"
		if(url){
			$state.go(url);
		}
	}
})

/************************/
/******* GENERAL ********/
/***********************/

app.controller('MapCtrl', function($scope, $ionicModal, $ionicLoading, $ionicPopup, $ionicPlatform, $timeout,  $http, $q, User, SOCKET_URL, CURRENTUSER, $ionicSideMenuDelegate, $stateParams, Event, AlertService) {
	//On empêche le drag menu sur cette page
	$ionicSideMenuDelegate.canDragContent(false);

	var socket;
	var distanceDuel = 100; // Calculé en mètre

	// Tableau des markers present sur la map
	$scope.markers = [];

	// Tableau des alertes de duels
	$scope.alertDuel = [];

	$scope.data = {};

	// Tableau de données de position
	$scope.positionsPlayer = [];
	// Tableau des boutons du footer
	$scope.itemsFooter = [];
	// L'utilisateur actuel
	$scope.currentPosPlayer;
	// La position
	$scope.posPlayers = [];

	$scope.getStorageToken = function(){
    	var deferred = $q.defer(); 
    	deferred.resolve(localStorage.getItem('token'));
		return deferred.promise;
    }

	$scope.$on('mapInitialized', function(event, map) {

		var tokenTmp = $scope.getStorageToken();

		tokenTmp.then(function(token){
	    	$scope.verifToken(token, map);
	    }, function(err){
	    	AlertService.add('error', 'Error !', 'Veuillez contacter le support du jeu.');
			$scope.goToState('auth.login');
	    })

	    $scope.verifToken = function(token, toto){

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
				  			
				  			var tmpParams = 'id='+ result.user.user.id;

				  			socket = io.connect(SOCKET_URL, {'force new connection': true, path: '/socket.io', query: tmpParams});

				  			CURRENTUSER.id = result.user.user.id;

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

								// Si le joueur bouge
								navigator.geolocation.watchPosition(
									function(position) {
										var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
										// On envoi au serveur 
										$scope.sendPosPlayer(pos);
										// on enregiste la position actuel du client pour pouvoir la reutiliser dans les duels
										$scope.currentPosPlayer = pos;

									}, function(error){
										//alert('code: '    + error.code    + '\n' + 'message: ' + error.message + '\n');
										console.log("erreur dans la geoloc")
									}, { 
										maximumAge: 5000,
										timeout: 8000, 
										enableHighAccuracy: true 
									}
								);

								// Incoming
								socket.on('broadcastPositions', function(datas) {
									for (var i = datas.length - 1; i >= 0; i--) {
										if(datas[i].user != CURRENTUSER.id){

											$scope.markers.push($scope.addMarker({lat:datas[i].posX,lng:datas[i].posY}, datas[i].user, "ennemy"));
											
											var tmpPlayer = {lat: $scope.currentPosPlayer.k, lng: $scope.currentPosPlayer.D};
											var tmpEnnemy = {lat: datas[i].posX,lng: datas[i].posY};

											var verifProximity = $scope.ennemyIsProxim(tmpPlayer,tmpEnnemy);
											verifProximity.then(function(result){
												if(result){
													console.log("Duel");
													$scope.addPopDuel();
												}else{
													console.log("pas de duel");
												}
											}, function(err){
												console.log(err);
											});
										}
									};
								});

								socket.on('userPositionChange', function(data) {
									
									if(!$scope.map.markers[data.user]){
										$scope.markers.push($scope.addMarker({lat:data.posX,lng:data.posY}, data.user, "ennemy"));
									}else{
										// si je recois mon propre mouvement je deplace mon avatar
										if(data.user == CURRENTUSER.id){

											var tmpUser = CURRENTUSER.id;
											var pos = new google.maps.LatLng(data.posX, data.posY);
											var currentUserMarker = $scope.map.markers[tmpUser];

											$scope.movePlayer(pos, currentUserMarker);

											for(var i=0; i < $scope.markers.length; i++){

												if($scope.markers[i].id != CURRENTUSER.id){

													var tmpPlayer = {lat: $scope.currentPosPlayer.k, lng: $scope.currentPosPlayer.D};
													var tmpEnnemy = {lat: $scope.markers[i].posX,lng: $scope.markers[i].posY};

													var verifProximity = $scope.ennemyIsProxim(tmpPlayer,tmpEnnemy);
													verifProximity.then(function(result){
														if(result){
															console.log("Duel");
															$scope.addPopDuel();
														}else{
															console.log("pas de duel");
														}
													}, function(err){
														console.log(err);
													});

												}
											}
											

										}else{

											// sinon je deplace l'utilisateur qui vient d'envoyer les données
											var tmpUser = data.user;
											var pos = new google.maps.LatLng(data.posX, data.posY);
											var currentUserMarker = $scope.map.markers[tmpUser];

											$scope.movePlayer(pos, currentUserMarker);

											var tmpPlayer = {lat: $scope.currentPosPlayer.k, lng: $scope.currentPosPlayer.D};
											var tmpEnnemy = {lat: data.posX, lng: data.posY};

											var verifProximity = $scope.ennemyIsProxim(tmpPlayer,tmpEnnemy);
											verifProximity.then(function(result){
												if(result){
													$scope.addPopDuel();
													console.log("duel");
												}else{
													console.log("pas de duel");
												}
											}, function(err){
												console.log(err);
											});
										}
									}
									
								});

								socket.on('disconnectMe', function(id){
									for(i in $scope.markers){
										if($scope.markers[i].id == id){
											$scope.markers.splice(i, 1);
										}
									}
								});

								socket.on('posCreated', function(data) {
									$scope.posPlayers.push(data);
								});

								/*******   LOCALISE AN EVENT  *******/
								var eventId = $stateParams.eventId;
								if(eventId) {
									Event.user.get({eventId : eventId}).$promise.then(function(event) {
										if(event.success) {
											$scope.event = event.event;
											var pos = new google.maps.LatLng(event.event.coords.posX, event.event.coords.posY);
											$scope.map.setCenter(pos);
											var eventOptions = {
												strokeColor: '#A2C539',
												strokeOpacity: 0.4,
												strokeWeight: 2,
												fillColor: '#A2C539',
												fillOpacity: 0.35,
												map: $scope.map,
												center: pos,
												radius: $scope.event.event.distance,
												editable : false,
												draggable : false
											};
											$scope.perimeter =  new google.maps.Circle(eventOptions);
										} else {
											AlertService.add('error', 'Attention !', event.error);
										}
									});
								}
						    });
							
				  		}
			  		}else{
			  			AlertService.add('error', 'Attention !', 'Problème au sein du serveur Gunther, veuillez contacter un administrateur!');
			  			$scope.goToState('auth.login');
			  		}	
			  	});
		  	}
	  	}

	  	$scope.addPopDuel = function(){
	  		var obj = {id:0, type: "proxy", button:"toto", message:"Vous pouvez engager un duel avec ce joueur"};
	  		$scope.alertDuel.push(obj);
	  		console.log($scope.alertDuel);
	  	};

		// Creation d'une animation de marker
		$scope.toggleBounce = function() {
			if (this.getAnimation() != null) {
				this.setAnimation(null);
			} else {
				this.setAnimation(google.maps.Animation.BOUNCE);
			}
	    }


	    // Calcul de la proximité entre deux utilisateurs
	    $scope.ennemyIsProxim = function(obj1,obj2){
	    	var deferred = $q.defer(); 

	    	var R = 6371000; // metres

			var radLat1 = $scope.toRadians(obj1.lat);
			var radLat2 = $scope.toRadians(obj2.lat);
			var alpha1 =  $scope.toRadians(obj2.lat - obj1.lat);
			var alpha2 =  $scope.toRadians(obj2.lng- obj1.lng);

			var a = Math.sin(alpha1 / 2) * Math.sin(alpha1 / 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(alpha2 / 2) * Math.sin(alpha2 / 2);
			
			var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

			var d = R * c;


			// Si la distance est inferieux à la distance maximum de duel, return true
			if(d < distanceDuel){
				deferred.resolve(true);
			}else{
				deferred.resolve(false);
			}

			return deferred.promise;
	    }

	    $scope.toRadians = function (angle) {
		  return angle * (Math.PI / 180);
		}
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
						user : CURRENTUSER.id,
						posX : position.coords.latitude,
						posY : position.coords.longitude
					};

					socket.emit('newUser', posPlayer);
					// On rerajoute le joueur a sa nouvelle position
					$scope.markers.push($scope.addMarker({lat:position.coords.latitude,lng:position.coords.longitude}, CURRENTUSER.id, "player"));

					// On centre la map sur la position du player principal
					$scope.map.setCenter(pos);

					// On push la position
					$scope.currentPosPlayer = pos;

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

		// Outgoing
		$scope.sendPosPlayer = function(position) {

			var posPlayer = {
				user:CURRENTUSER.id,
				posX:position.k,
				posY:position.D
			};

			socket.emit('watchPosition', posPlayer);
		}

		$scope.addMarker = function(pos, idUser, type){
			var tmpObj = {
				posX : pos.lat,
				posY : pos.lng,
				id: idUser,
				icone :{},
		        anim:'DROP',
		        click: ''
		    };

		    if(type == "player"){
		    	tmpObj.icone = {
		            path:'CIRCLE',
		            fillColor: '#95DE42', 
		            scale: 10, 
		            fillOpacity:1, 
		            strokeColor:'#1D1D1D',
		            strokeOpacity:0.5,
		            strokeWeight:3
	            }
		    }else{
		    	tmpObj.icone = {
		            path:"CIRCLE", 
		            fillColor: "#F52121",
		            fillOpacity:1, 
		            scale: 5, 
		            strokeColor:"#1D1D1D",
		            strokeOpacity:1,
		            strokeWeight:1
	            }
		    }

		    return tmpObj;
		}

		$scope.movePlayer = function(pos, obj){
	        obj.animateTo(
	        	pos, 
				{
					easing: 'linear', 
					duration: 3000,
					complete: function(){
					}
	            }
	        )
		}

		$scope.centerOnMe = function(){
			$scope.map.setCenter($scope.currentPosPlayer);
		}

		// On active ou desactive l'effet graphique d'un bouton actif du footer
		$scope.activeItem = function(item){

			$scope.data.activeButton = item;

			var nbItems = $scope.itemsFooter.length;

			$timeout( function() {
			    $scope.data.activeButton = nbItems;
			  }, 500);
		}

		// On récupère les boutons du footer grace à son json
		$http.get('../json/footerMap.json').success(function(data){
			// on les injecte dans le scope
	    	$scope.itemsFooter = data.boutons;
	    });

	    $scope.showPopup = function() {

		  // An elaborate, custom popup
		  var myPopup = $ionicPopup.show({
		    template: '<input type="password" ng-model="data.wifi">',
		    title: 'Des joueurs se trouve à proximité',
		    subTitle: 'Please use normal things',
		    templateUrl: '../templates/popups/alertduel.html',
		    scope: $scope,
		    buttons: [
		      { text: 'Cancel' },
		      {
		        text: '<b>Save</b>',
		        type: 'button-positive',
		        onTap: function(e) {
		        	console.log(e)
		        }
		      }
		    ]
		  });
		  myPopup.then(function(res) {
		    console.log('Tapped!', res);
		  });
		  $timeout(function() {
		     myPopup.close(); //close the popup after 3 seconds for some reason
		  }, 8000);
		 };



	});
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


app.controller('ParticipateCtrl', function ($scope, User, Event, $stateParams, AlertService, $q, $location) {
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
						$scope.user = result.user;
						$scope.initialize();

					}
				}else{
					AlertService.add('error', 'Attention !', 'Problème au sein du serveur Gunther, veuillez contacter un administrateur!');
					$scope.goToState('auth.login');
				}
			});
		}
	}

	$scope.initialize = function() {
		var eventId = $stateParams.eventId;
		Event.participate.get({eventId : eventId, userId : $scope.user.user.id}).$promise.then(function(result) {
			if(result.success) {
				AlertService.add('succes', result.message);
				$location.path('/event/' + eventId);

			} else {
				AlertService.add('error', 'Attention !', result.error);
				$location.path('/event/' + eventId);

			}
		})

	}

});

app.controller('EventCtrl', function ($scope, User, Event, $stateParams, $q) {

	$scope.actualisation;
	$scope.compte_a_rebours = function()
	{
		var date_evenement = new Date($scope.e.event.created);
		var compte_a_rebours = document.getElementById("compte_a_rebours");

		var date_actuelle = new Date();
		//var date_evenement = new Date("Jan 1 00:00:00 2013");
		var total_secondes = (date_evenement - date_actuelle) / 1000;

		var prefixe = "";
		if (total_secondes < 0)
		{
			prefixe = ""; // On modifie le préfixe si la différence est négatif

			total_secondes = Math.abs(total_secondes); // On ne garde que la valeur absolue

		}

		if (total_secondes > 0)
		{
			var jours = Math.floor(total_secondes / (60 * 60 * 24));
			var heures = Math.floor((total_secondes - (jours * 60 * 60 * 24)) / (60 * 60));
			var minutes = Math.floor((total_secondes - ((jours * 60 * 60 * 24 + heures * 60 * 60))) / 60);
			var secondes = Math.floor(total_secondes - ((jours * 60 * 60 * 24 + heures * 60 * 60 + minutes * 60)));

			var et = "et";
			var mot_jour = "j";
			var mot_heure = "h";
			var mot_minute = "m";
			var mot_seconde = "s";

			if (jours == 0)
			{
				jours = '';
				mot_jour = '';
			}
			else if (jours == 1)
			{
				mot_jour = "j";
			}

			if (heures == 0)
			{
				heures = '';
				mot_heure = '';
			}
			else if (heures == 1)
			{
				mot_heure = "h";
			}

			if (minutes == 0)
			{
				minutes = '';
				mot_minute = '';
			}
			else if (minutes == 1)
			{
				mot_minute = "m";
			}

			if (secondes == 0)
			{
				secondes = '';
				mot_seconde = '';
				et = '';
			}
			else if (secondes == 1)
			{
				mot_seconde = "s";
			}

			if (minutes == 0 && heures == 0 && jours == 0)
			{
				et = "";
			}

			compte_a_rebours.innerHTML = prefixe + jours + ' ' + mot_jour + ' ' + heures + ' ' + mot_heure + ' ' + minutes + ' ' + mot_minute + ' ' + et + ' ' + secondes + ' ' + mot_seconde;
		}
		else
		{
			compte_a_rebours.innerHTML = 'Événement terminé.';
		}

		$scope.actualisation = setTimeout(function(){ $scope.compte_a_rebours(); }, 1000);
	}
	$scope.initialize = function() {
		var eventId = $stateParams.id;
		$scope.e = {}
		Event.user.get({eventId:eventId}).$promise.then(function(data) {
			$scope.e = data.event;
			for(var p = data.event.participants.length -1; p >= 0; p-- ) {
				var getLevel = function(p) {
					//Récupération du level de l'utilisateur via l'api
					User.getLevelUser(data.event.participants[p].user).then(function (result) {
						$scope.isParticiped = false;
						data.event.participants[p].user.level = result.level;
						if (data.event.participants[p].user.id == $scope.user.user.id) {
							$scope.isParticiped = true;
						}
					});
				}(p)
			}

			$scope.compte_a_rebours();
		});
	}
	$scope.$on('$destroy', function(){
		clearTimeout($scope.actualisation);
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
						$scope.user = result.user;
						$scope.initialize();

					}
				}else{
					AlertService.add('error', 'Attention !', 'Problème au sein du serveur Gunther, veuillez contacter un administrateur!');
					$scope.goToState('auth.login');
				}
			});
		}
	}

});

app.controller('EventsCtrl', function ($scope, User, Event, $ionicLoading, AlertService, $http, $q, $stateParams) {
	var userId = $stateParams.userId;

	if(userId) {
		$scope.myEvent = true;
	} else {
		$scope.myEvent = false;
	}

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
		});
	});

	//Fonction de récupération des événements
	$scope.getEvents = function(limit, offset, filter, hisEvents) {

		if($scope.myEvent) {

			var id = $scope.user.user.id;
			var promiseEvents = Event.user.getUserEvents({id : id, limit : limit, offset : offset, filter : filter});
		} else {
			var promiseEvents = Event.user.get({limit : limit, offset : offset, filter : filter});

		}
		promiseEvents.$promise.then(function(data) {
			if(data.success) {
				var deferred = $q.defer();
				var promises = [];
				var url="https://maps.googleapis.com/maps/api/place/nearbysearch/json?KEY=AIzaSyDjtiAbO0DsvPNTWhWW0draH_L8fnOvEic";
				var getAddresses = function(events) {

					for(var i = events.length-1 ; i >= 0; i--) {
						var promise = function(event) {
							var defer2 = $q.defer();
							var geocoder = new google.maps.Geocoder();
							var location = new google.maps.LatLng(event.coords.posX, event.coords.posY);
							geocoder.geocode( { 'location': location}, function(results, status) {
								if (status == google.maps.GeocoderStatus.OK) {
									event.coords.address = results[2].formatted_address;
									deferred.resolve(event);

								} else {
									console.log("Geocode was not successful for the following reason: " + status);
								}
							});
							return defer2.promise;
						}(events[i])

						//On ajoute la promesse dans le tableau
						promises.push(promise);
					}
					return deferred.promise;
				} (data.events);

				//Une fois que toutes les promesses sont résolues
				$q.all(promises).then(function(result) {
					//On résout la promesse N1
					deferred.resolve(result);
				} , function (reason) {
					//On affiche l'erreur en console (DEV MOD)
					console.error(reason);
				})

				getAddresses.then(function(events) {
					//On ajoute les événements au tableau éxistant
					$scope.events= $scope.events.concat(data.events);
					$ionicLoading.hide();
				})

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

	$scope.getStorageToken = function(){
		var deferred = $q.defer();
		deferred.resolve(localStorage.getItem('token'));
		return deferred.promise;
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

app.controller('AddEventCtrl', function(AlertService, $scope, $http, Event, User, $stateParams, $ionicSideMenuDelegate, $q) {
	$scope.getStorageToken = function(){
		var deferred = $q.defer();
		deferred.resolve(localStorage.getItem('token'));
		return deferred.promise;
	}

	var tokenTmp = $scope.getStorageToken();

	tokenTmp.then(function(token) {
		var tempUser = User.isLoggedIn.isLoggedIn({access_token: token});
		tempUser.$promise.then(function (result) {
			if(!result.isLoggedIn){
				AlertService.add('error', 'Attention !', 'Veuillez vous identifier avant d\'acceder au jeu');
				$scope.goToState('auth.login');
			}else {
				$scope.user = result.user;
			}
		})
	});
	//On empêche le drag menu sur cette page
	$ionicSideMenuDelegate.canDragContent(false);
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
			lat         : $scope.coords.split(',')[0],
			lng         : $scope.coords.split(',')[1],
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

				AlertService.add('succes', 'Félicitation !', 'La modification de l\'événement est un succès.');
				$scope.goToState('core.events');
			}
		}, function (error) {
			AlertService.add('error', 'Erreur !', 'La modification de l\'événement a echoué, merci de réessayer.');
		});
	}


	$scope.create = function() {
		var user = $scope.user.user;
		var event = Event.user.create({
			user_id : user.id,
			title : $scope.event.title,
			description : $scope.event.description,
			minPlayers : $scope.sliders.playersValue[0],
			maxPlayers : $scope.sliders.playersValue[1],
			distance : $scope.sliders.sliderValue,
			duration : $scope.sliders.durationValue,
			difficulty : $scope.sliders.difficultyValue,
			lat :  $scope.coords.split(',')[0],
			lng :  $scope.coords.split(',')[1],
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

				AlertService.add('succes', 'Félicitation !', 'la création de l\'événement est un succès.');
				$scope.goToState('core.events');
			}
		}, function (error) {
			AlertService.add('succes', 'Erreur !', 'Une erreur a empeché la création de l\'évenement, merci de réessayer.');
		});
	}



	$scope.submit = function() {
		if($scope.update == true) {
			$scope.updateEvent();
		} else {
			$scope.create();
		}
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
app.controller('RankCtrl', function ($scope, User, AlertService, $q, $stateParams) {

	var friends = $stateParams.userId;
	if(friends) {
		$scope.friends = true;
	} else {
		$scope.friends = false;
	}
	$scope.limit = 20;
	$scope.offset = 0;
	$scope.getStorageToken = function(){
		var deferred = $q.defer();
		deferred.resolve(localStorage.getItem('token'));
		return deferred.promise;
	}
	var tokenTmp = $scope.getStorageToken();

	tokenTmp.then(function(token) {
		var tempUser = User.isLoggedIn.isLoggedIn({access_token: token});
		tempUser.$promise.then(function (result) {
			if(!result.isLoggedIn){
				AlertService.add('error', 'Attention !', 'Veuillez vous identifier avant d\'acceder au jeu');
				$scope.goToState('auth.login');
			}else {
				$scope.user = result.user;
				$scope.initialize();
			}
		})
	});


	$scope.initialize = function () {
		$scope.ranking = [];
		$scope.getRanks($scope.offset);
	}

	$scope.getRanks = function (offset) {

		var ranking  = User.getRanking($scope.friends, $scope.limit, $scope.offset).success(function(data) {
			if(!data.success) {
				AlertService.add('error', 'Attention !', data.error);
			} else {
				var promises = [];
				for(var i = 0 ; i < data.users.length; i++) {
					var t = function (i) {
						var deferred = $q.defer();
						var level = User.getLevelUser(data.users[i]);
						level.then(function (l){
							var level = l;
							level.pourc = ((data.users[i].exp -level.level.begin)/ (level.nextLevel.begin - level.level.begin)) * 100;
							var user = {
								user : data.users[i],
								level : level

							}
							deferred.resolve(user);
						});
						promises.push(deferred.promise);
					}(i);

				}
				//Une fois que toutes les promesses sont résolues
				$q.all(promises).then(function(result) {
					$scope.ranking= $scope.ranking.concat(result);
				} , function (reason) {
					//On affiche l'erreur en console (DEV MOD)
					console.error(reason);
				})
			}

		});
	}

})
app.controller('RulesCtrl', function ($scope) {});

/**
 * Affichage du profil utilisateur
 */
app.controller('ProfilCtrl', function ($scope, $stateParams, $q, User, AlertService) {
	$scope.getStorageToken = function(){
		var deferred = $q.defer();
		deferred.resolve(localStorage.getItem('token'));
		return deferred.promise;
	}
	var tokenTmp = $scope.getStorageToken();

	tokenTmp.then(function(token) {
		var tempUser = User.isLoggedIn.isLoggedIn({access_token: token});
		tempUser.$promise.then(function (result) {
			if(!result.isLoggedIn){
				AlertService.add('error', 'Attention !', 'Veuillez vous identifier avant d\'acceder à cette page.');
				$scope.goToState('auth.login');
			}else {
				$scope.user = result.user;
				$scope.initialize();
			}
		})
	});

	$scope.initialize = function() {
		$scope.profil = {};
		var userId = $stateParams.userId;
		$scope.getProfil(userId);
	}

	$scope.getProfil = function(userId) {
		$scope.profil = User.getProfil.get({userId : userId}).$promise.then(function(data){
			if(data.success) {
				$scope.profil = data.user;
				//Récupération du level de l'utilisateur via l'api
				User.getLevelUser($scope.profil).then(function(data) {
					//récupération du level en cours
					$scope.profil.level = data.level;
					//Récupération du niveau suivant
					$scope.profil.nextLevel = data.nextLevel;
					//Calcul du pourcentage avant le niveau suivant
					$scope.pourc =  (($scope.profil.exp - $scope.profil.level.begin)/ ($scope.profil.nextLevel.begin - $scope.profil.level.begin)) * 100;
				});
			} else {
				AlertService.add('error', 'Attention !', 'Le profil n\'a pas été trouvé.');

			}
		});

	}
	$scope.changeTab = function (tab) {
		$('.boxContentProfil').addClass('hide');
		$('.menuProfil').find('li').removeClass('active');
		$('.'+tab).removeClass('hide');
		$('.link-'+tab).parent().addClass('active')
	}
	$scope.addFriend = function() {
		User.addFriend.post({userId : $scope.user.user.id, friendId : $scope.profil.id}).$promise.then(function(data) {
			if(data.success) {
				$scope.$apply(function () {
					$scope.isFriend = data.isFriend;
				});
				AlertService.add('succes', data.msg);
			}
		});
	}
})


/************************/
/******** AUTH **********/
/************************/

app.controller('AuthCtrl', function($scope, $state, $rootScope, User, CURRENTUSER) {

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
  			$scope.goToState('auth.login');
	  	}else{
	  		var tempUser = User.isLoggedIn.isLoggedIn({access_token : token});
		  	tempUser.$promise.then(function(result) {
		  		if(result){
		  			if(!result.isLoggedIn){
		  				$scope.goToState('auth.login');
			  		}else{
			  			CURRENTUSER.id = result.user.user.id;
			  			$scope.goToState('core.map');
			  		}
		  		}else{
		  			$scope.goToState('auth.login');
		  		}	
		  	});
	  	}
  	}
})

app.controller('AuthLoginCtrl', function($scope, $state, User, AlertService, CURRENTUSER) {

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
					CURRENTUSER.id = result.user.id;

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

app.controller('AuthRegisterCtrl', function($scope, $state, User, AlertService) {

	$scope.register = function(params){
		if(!params){
			AlertService.add('error', 'Attention !', 'Aucune informations recuperer, veuillez remplir l\'ensemble des champs pour pouvoir vous inscrire !');
		}else if(params.password && params.passwordVerif && params.email && params.login){
			if(params.password != params.passwordVerif){
				AlertService.add('error', 'Attention !', 'Le mot de passe et la verification ne sont pas identiques !');
			}else{
				var promise = User.register.create({username : params.login, email : params.email, password : params.password});
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
				});
			}
		}else{
			AlertService.add('error', 'Attention !', 'Veuillez remplir l\'ensemble des champs du formulaire!');
		}
	}
})

app.controller('AuthForgotCtrl', function($scope, $state, User, AlertService) {	

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
			});
		}else{
			AlertService.add('error', 'Attention !', 'Veuillez saisir un email valide !');
		}
	}

})