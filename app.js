var app = require('express')();

var server = require('http').Server(app);

var io = require('socket.io')(server);

// Quand une nouvelle connection intervient
io.on('connect', function(socket) {

	console.log("Connection au socket reussie");

	// On emit les positions des joueurs 
	socket.on('sendPosPlayer', function(data) {
    	console.log("broadcast des news positions");
    	socket.broadcast.emit('posCreated', data);        
    });

});

server.listen(8000,function(){
    console.log('Socket.io Running on 8000');
});