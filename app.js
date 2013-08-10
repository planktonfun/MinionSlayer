var app = require('express')()
  , express = require('express')
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , mysql = require('mysql');


// connect through mysql database

var db_user = process.env.DB_USER || 'root';
var password = process.env.DB_PASSWORD || '';
var host = process.env.DB_HOST || 'localhost';
var db_name = process.env.DB_SLAVES || 'mcv';
var table_name = 'users';

var client = mysql.createConnection({
    host: host,
    user: db_user,
    password: password
});

client.connect();
client.query( 'USE ' + db_name );

console.log( db_name );

// create table if not exist
var sql_statement = "SELECT * from users LIMIT 0,1";

client.query( sql_statement, function( err, results ) {
  if (err) {

    client.query("
    
    CREATE TABLE IF NOT EXISTS `users` (
      `id` bigint(21) NOT NULL AUTO_INCREMENT,
      `user_name` varchar(45) NOT NULL,
      `password` varchar(45) NOT NULL,
      PRIMARY KEY (`id`)
    ) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4 ;", false);

    client.query("
    INSERT INTO `users` (`id`, `user_name`, `password`) VALUES
    (1, 'paulo', '1'),
    (2, 'lester', '1'),
    (3, 'gab', '1'),
    (4, 'cha', '1');", false);

  }
}
          


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
app.use('/', express.static(__dirname + "/"));

// show default redirect here
app.post('/', function (req, res){
  // console.log( req );
  // res.sendfile(__dirname + '/index.html');

});

app.get('/', function (req, res) {
  // console.log( req );
  // res.sendfile(__dirname + '/index.html');

});

io.configure(function () {
  io.set('transports', ['flashsocket', 'xhr-polling','websocket']);

});

// user data containers
var ip_user = [];
var conn_user = [];
var msgs = [];
var stats = [];

io.sockets.on('connection', function (socket) {  

  var user = '';

  socket.on('message', function ( from, msg ) {
    //notify others that player is online
    io.sockets.emit( 'message', { msg: user + ":add:" + user + "\n\n" } );

    if( from == 'all' ) {
      io.sockets.emit('message', { msg: user + ":" + msg.action + "\n\n" } );

    } else if( from == 'them' ) {
      socket.broadcast.emit('message', { msg: user + ":" + msg.action + "\n\n" });

    } else if( from == 'self' || from == '' ) {
      socket.emit('message', { msg: user + ":" + msg.action + "\n\n" });

    } else {
      socket.emit('message', from, { msg: user + ":" + msg.action + "\n\n" });

    }


    // console.log('I received a private message by ', from, ' saying ', msg);
  });

  socket.on( 'login', function( data ) {

      // check username if it exist in the database
      var sql_statement = "SELECT * FROM users WHERE user_name = '" + data.un  + "' AND password = '" + data.ps + "' LIMIT 0,1";

      client.query( sql_statement, function(err, results) {          
          if (err) { 
            socket.emit('login_response', { msg: 'msg: sql error: ' + err });
            // console.log( err );
          
          } else if( results.length > 0 ) {
            user = results[0][ 'user_name' ];
            // console.log( user );
            socket.emit( 'login' );

            // add name to socket connected

            // request.connection.remoteAddress <--- need to update this
            conn_user[data.myip] = user; 
          
          } else {
            socket.emit('login_response', { msg: 'msg: Wrong username or password ' + err });
          
          }

      });

    });

  socket.on( 'logon', function( data ) {
    // console.log( 'recieved' );

    if( conn_user[data.myip] != null ) {

      user = conn_user[data.myip];

      // add name to socket list
      socket.set('username', user, function () {

        // add name to socket connected
        conn_user[user] = user;            

        socket.emit('logon', { un: user });
        // send to self 
        socket.emit('message', { msg: 'msg: Welcome ' + user + '! ' });

        // send to everyone but this user
        socket.broadcast.emit('message', { msg: 'msg: User is connected: ' + user + '.' }); 

        // send to all
        //io.sockets.emit('message', { msg: 'hi everyone!' } );

        // send to a user
        //socket.emit('message', 'targetname', { msg: msg });

      });

    } else {
        socket.emit( 'error', false );
      
    }

  });

  socket.on('disconnect', function(){ 
    
    socket.get('username', function (err, name) {

      // remove name from the socket connected list
      conn_user[user] = null;
      socket.broadcast.emit('message', { msg: 'msg: User is disconnected ' + user + '.' });

    });

  });

});