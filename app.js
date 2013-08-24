
// Settings
var db_user    = process.env.DB_USER     || 'root';
var password   = process.env.DB_PASSWORD || '';
var host       = process.env.DB_HOST     || 'localhost';
var db_name    = process.env.APP_NAME    || 'mcv';
var port       = process.env.PORT        || 3000;
var table_name = 'users';
var conn_user  = [];
var msgs       = [];
var sendrates  = [];
var srps  = [];

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


// get sending rates
function getSendingRate( ) {

        var text = '';

        for( item in conn_user ) {

            text += ',' + conn_user[ item ] + '->' + srps[ item ];

        }

        return text;

}

function getSRatePerSec( ) {

    for( item in conn_user ) {

        srps[ item ] = sendrates[ item ];

        sendrates[ item ] = 0;

    }

}

setInterval( getSRatePerSec, 1000);


// Operation when a user is connected
io.sockets.on( 'connection', function ( socket ) { 

    var user = '';


    // message pool for players
    socket.on( 'message', function ( from, msg ) {

        io.sockets.emit( 'retrieve', { msg: user + ":add:" + user + "\n\n" } );
        // SendToAll( user + ":add:" + user + "\n\n" );

        if( from == 'all' ) {

            // SendToAll( user + ":" + msg.action + "\n\n" );
            io.sockets.emit('retrieve', { msg: user + ":" + msg.action + "\n\n" } );

        } else if( from == 'them' ) {

            // SendToThem( user + ":" + msg.action + "\n\n" );
            socket.broadcast.emit('retrieve', { msg: user + ":" + msg.action + "\n\n" } );

        } else if( from == 'self' || from == '' ) {

            // SendToSelf( user + ":" + msg.action + "\n\n" );
            socket.emit('retrieve', { msg: user + ":" + msg.action + "\n\n" } );

        } else {

            // SendToTarget( user + ":" + msg.action + "\n\n", from );
            socket.emit('retrieve', from, { msg: user + ":" + msg.action + "\n\n" } );

        }

        // SendToAll( user + ":" + 'msg: ' + getSendingRate( ) + "\n\n" );

        sendrates[ user ]++;

    });

    socket.on( 'retrieve', function( ) {

            sendrates[ user ]++;

            // getMsgs( user );

    });

    // Add players
    socket.on( 'logon', function( data ) {
      
        user = data.name;

        conn_user[ user ] = data.name;
        sendrates[ user ] = 0;

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

    function SendToAll( data ) {

        for( item in conn_user ) {

            msgs[ item ] += data;

        }

    }

    function SendToThem( data ) {

        for( item in conn_user ) {

            if( user != item ) {

                msgs[ item ] += data;

            }

        }

    }

    function SendToSelf( data ) {

        msgs[ user ] += data;

    }

    function SendToTarget( data, target ) {

        msgs[ target ] += data;

    }

    function getMsgs( user ) {
        
        if( msgs[ user ] == '' ) return;
        
        socket.emit('retrieve', { msg: msgs[ user ] } );

        msgs[ user ] = '';

    }



});
