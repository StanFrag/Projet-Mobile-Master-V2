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

app.controller('MapCtrl', function($scope, $ionicModal, $ionicLoading, $ionicPopup, $ionicPlatform, $timeout, $http, $q, AlertService, SOCKET_URL, CURRENTUSER, User) {

	var socket;
	var distanceDuel = 100; // Calculé en mètre

	// Tableau des markers present sur la map
	$scope.markers = [];

	// Tableau des alertes de duels
	$scope.alertDuel = [{titi:"toto"}];

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
	    	console.log("error dans le getStorageToken");
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
													console.log("youhou un duel possible");
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
															console.log("youhou un duel possible");
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
													console.log("youhou un duel possible");
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

			console.log(d);
			console.log("La distance en m calculé entre les deux objs: ",d)

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
				template: 'Loading...'
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
    	console.log("error dans le getStorageToken");
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
		console.log("email: ", email);
		if(email){
			var promise = User.forgot.resetPassword({email : email});
			promise.$promise.then(function(result) {
				console.log("result: ",result);
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