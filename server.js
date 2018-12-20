/*jshint esversion: 6 */

var app = require('http').createServer();

// Se tiverem problemas com "same-origin policy" deverão activar o CORS.

// Aqui, temos um exemplo de código que ativa o CORS (alterar o url base) 

// var app = require('http').createServer(function(req,res){
// Set CORS headers
//  res.setHeader('Access-Control-Allow-Origin', 'http://---your-base-url---');
//  res.setHeader('Access-Control-Request-Method', '*');
//  res.setHeader('Access-Control-Allow-Methods', 'UPGRADE, OPTIONS, GET');
//  res.setHeader('Access-Control-Allow-Credentials', true);
//  res.setHeader('Access-Control-Allow-Headers', req.header.origin);
//  if ( req.method === 'OPTIONS' || req.method === 'UPGRADE' ) {
//      res.writeHead(200);
//      res.end();
//      return;
//  }
// });

// NOTA: A solução correta depende da configuração do próprio servidor, 
// e alguns casos do próprio browser.
// Assim sendo, não se garante que a solução anterior funcione.
// Caso não funcione é necessário procurar/investigar soluções alternativas

var io = require('socket.io')(app);

app.listen(8080, function(){
    console.log('listening on *:8080');
});

// ------------------------
// Estrutura dados - server
// ------------------------

io.on('connection', function (socket) {
    console.log('client has connected (socket ID = '+socket.id+')' );

    //User join to department channel
    socket.on('user_enter', function (user) {
        if (user !== undefined && user !== null) {
            socket.join('department_' + user.type);
            console.log('User: ' + user.username + ' join to ' + user.type);
        }
    });

    //User leave the department channel
    socket.on('user_exit', function (user) {
        if (user !== undefined && user !== null) {
            socket.leave('department_' + user.type);
            console.log('User: ' + user.username + ' leave ' + user.type);
        }
    });

    //Send message to managers
    socket.on('msg_to_managers_from_client', function (msg, user) { 
        if (user !== undefined && user !== null) {
            console.log('Message: ' + msg + ' from ' + user.username);
            io.sockets.to('department_manager').emit('msg_to_managers_from_server', 'Msg: "' + msg + '" from ' + user.username);
        } 
    });

});
