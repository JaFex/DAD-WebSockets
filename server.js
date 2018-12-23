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

var LoggedUsers = require('./loggedusers.js');

app.listen(8080, function(){
    console.log('listening on *:8080');
});

// ------------------------
// Estrutura dados - server
// ------------------------io.on('connection', function (socket) {

let loggedUsers = new LoggedUsers();

io.on('connection', function (socket) {
    console.log('client has connected (socket ID = '+socket.id+')' );

    //----------------------------Comunicacion between departments------------------------------------------
    socket.on('waiter', function () {
        console.log('---waiter---');
        io.sockets.to('department_waiter').emit('update');
    });
    socket.on('kitchen', function () {
        console.log('---kitchen---');
        io.sockets.to('department_cook').emit('update');
    });
    socket.on('kitchenWichoutMe', function () {
        console.log('---kitchenWichoutMe---');
        socket.broadcast.to('department_cook').emit('update');
    });
    socket.on('cashier', function () {
        console.log('---cashier---');
        io.sockets.to('department_cashier').emit('update');
    });
    socket.on('cashierWichoutMe', function () {
        console.log('---kitchenWichoutMe---');
        socket.broadcast.to('department_cashier').emit('update');
    });
    socket.on('manager', function () {
        console.log('---manager---');
        io.sockets.to('department_manager').emit('update');
    });
    //------------------------Private comunicacion-------------------------------------------

    socket.on('privateUpdate', function (sourceUser, destUser, object) {
        console.log('---privateUpdate---');
        let userInfo = loggedUsers.userInfoByID(destUser.id);
        let socket_id = userInfo !== undefined ? userInfo.socketID : null;
        if (socket_id === null) {
            console.log('   ---privateUpdate_unavailable---');
            socket.emit('privateUpdate_unavailable', destUser);
        } else {
            
            if(object.state && object.state === "in preparation") {
                console.log('   ---privateUpdateConfirmed---Object: '+object.id);
                io.to(socket_id).emit('privateUpdateConfirmed', sourceUser, object);
            } else if(object.state && object.state === "prepared") {
                console.log('   ---privateUpdatePrepared---Object: '+object.id);
                io.to(socket_id).emit('privateUpdatePrepared', sourceUser, object);
            } else {
                console.log('   ---privateUpdate---Object: '+object.id);
                io.to(socket_id).emit('privateUpdate', sourceUser, object);
            }
            socket.emit('privateUpdate_sent', destUser);
        }
    });

    //-----------------------------------------------------------------------------------------


    //----------------------------Login and logout------------------------------------------
    //User join to department channel
    socket.on('user_enter', function (user) {
        if (user !== undefined && user !== null) {
            socket.join('department_' + user.type);
            loggedUsers.addUserInfo(user, socket.id);
            console.log('User: ' + user.username + ' join to ' + user.type);
        }
    });

    //User leave the department channel
    socket.on('user_exit', function (user) {
        if (user !== undefined && user !== null) {
            socket.leave('department_' + user.type);
            loggedUsers.removeUserInfoByID(user.id);
            console.log('User: ' + user.username + ' leave ' + user.type);
        }
    });
    //-----------------------------------------------------------------------------------------

    //Send message to managers
    socket.on('msg_to_managers_from_client', function (msg, user) { 
        if (user !== undefined && user !== null) {
            console.log('Message: ' + msg + ' from ' + user.username);
            io.sockets.to('department_manager').emit('msg_to_managers_from_server', 'Msg: "' + msg + '" from ' + user.username);
        } 
    });

});
