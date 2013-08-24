
// Settings
var db_user    = process.env.DB_USER     || 'root';
var password   = process.env.DB_PASSWORD || '';
var host       = process.env.DB_HOST     || 'localhost';
var db_name    = process.env.APP_NAME    || 'mcv';
var port       = process.env.PORT        || 3000;
var table_name = 'users';
var conn_user  = [];
var msgs       = [];

// includes
var app     = require( 'express' )( )
  , express = require( 'express' )
  , server  = require( 'http' ).createServer( app )
  , io      = require( 'socket.io' ).listen( server );  


// connect through http
server.listen( port );

app.use( '/', express.static( __dirname + "/" ) );


app.get( '/', function ( req, res ) {  

    res.sendfile( __dirname + '/index.html' );

});

app.post( '/', function ( req, res ){

    res.sendfile( __dirname + '/index.html' );

});

io.configure( function ( ) {

    io.set( 'transports', [ 'flashsocket', 'xhr-polling', 'websocket' ] );

});


// Operation when a user is connected
io.sockets.on( 'connection', function ( socket ) { 

    var user = '';


    // message pool for players
    socket.on( 'message', function ( from, msg ) {

        io.sockets.emit( 'message', { msg: user + ":add:" + user + "\n\n" } );

        if( from == 'all' ) {

            io.sockets.emit('message', { msg: user + ":" + msg.action + "\n\n" } );

        } else if( from == 'them' ) {

            socket.broadcast.emit('message', { msg: user + ":" + msg.action + "\n\n" } );

        } else if( from == 'self' || from == '' ) {

            socket.emit('message', { msg: user + ":" + msg.action + "\n\n" } );

        } else {

            socket.emit('message', from, { msg: user + ":" + msg.action + "\n\n" } );

        }

    });


    // Add players
    socket.on( 'logon', function( data ) {
      
        user = data.name;      
        conn_user[ user ] = data.name;        
        socket.emit( 'logon', { un: user } );

        socket.set( 'username', user, function () {

            io.sockets.emit( 'scores', { score: getUsers( ) } );
            socket.emit( 'message', { msg: 'msg: Welcome ' + user + '! ' } );         
            socket.broadcast.emit( 'message', { msg: 'msg: User is connected: ' + user + '.' } );          

        });

        console.log( getUsers( ) );

    });


    // Remove player from connected list
    socket.on( 'disconnect', function( ) { 
      
      socket.get( 'username', function ( err, name ) {

          delete conn_user[ name ];
          io.sockets.emit( 'scores', { score: getUsers( ) } );
          socket.broadcast.emit('message', { msg: 'msg: User is disconnected ' + name + '.' } );

      });

    });    

    function getUsers( ) {

        var text = '';

        for( item in conn_user ) {

            text += ',' + conn_user[ item ];

        }

        return text;

    }

    function SendToAll( ) {



    }

});