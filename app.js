var app = require('express')()
  , express = require('express')
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , mysql = require('mysql');


// connect through mysql database

var user = process.env.DB_USER || 'root';
var password = process.env.DB_PASSWORD || '';
var host = process.env.DB_HOST || 'localhost';
var db_name = process.env.DB_SLAVES || 'mcv';
var table_name = 'users';

var client = mysql.createConnection({
    host: host,
    user: user,
    password: password
});

client.connect();
client.query( 'USE ' + db_name );


client.query('SELECT * FROM ' + table_name, function(err, results) {
    if (err) throw err;
    console.log(results);    
});



// FILE BASED CONNECTION

/*fs = require('fs')
fs.readFile('notes.txt', 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  console.log(data);
});*/

var port = process.env.PORT || 8000;

server.listen(port);

// include folders here
app.use('/cat', express.static(__dirname + "/cat"));
app.use('/', express.static(__dirname + "/"));

// show default redirect here
app.post('/', function (req, res){
  res.sendfile(__dirname + '/index.html');

});

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');

});

io.configure(function () {
  io.set('transports', ['flashsocket', 'xhr-polling','websocket']);

});

// socket container
var socket_name = 0;
var name = 'socket' + socket_name;

io.sockets.on('connection', function (socket) {

  socket.emit('init', { hello: 'connected!' });
  
  socket.set('nickname', name, function () { 
    socket.broadcast.emit('user connected', { name: 'user connected' + name }); 
    socket_name++; 
    name = 'socket' + socket_name; 

  });

  socket.on('click', function (data) {
      io.sockets.emit('re_click', { x: data.x, y: data.y } );

  });

  socket.on('get', function() { 
    socket.get('nickname', function (err, we) {
      socket.emit('re_get', { re_name: we });

    });

  });

  socket.on('disconnect', function(){ 
    socket.get('nickname', function (err, we) {
      socket.broadcast.emit('user connected', { name: 'user disconnected ' + we 
      
      });

    });

  });

});