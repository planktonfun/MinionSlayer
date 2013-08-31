
// Settings
var db_user    = process.env.DB_USER     || 'root';
var password   = process.env.DB_PASSWORD || '';
var host       = process.env.DB_HOST     || 'localhost';
var db_name    = process.env.APP_NAME    || 'mcv';
var port       = process.env.PORT        || 5000;
var table_name = 'users';
var conn_user  = [];
var msgs       = [];
var sendrates  = [];
var srps  = [];

// includes
var express = require( 'express' )
    , http  = require( 'http' )
    , sio   = require( 'socket.io' )
    , app    = express( )
    , server = http.createServer( app )
    , io     = sio.listen( server );


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

    // io.set( 'transports', [ 'flashsocket', 'xhr-polling', 'websocket' ] );

    // Restrict log output
    io.set("log level", 2);

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

        msg.action = lzw_decode( msg.action );

        // io.sockets.emit( 'retrieve', { msg: user + ":add:" + user + "\n\n" } );
        SendToAll( user + ":add:" + user + "\n\n" );

        if( from == 'all' ) {

            SendToAll( user + ":" + msg.action + "\n\n" );
            // io.sockets.emit('retrieve', { msg: user + ":" + msg.action + "\n\n" } );

        } else if( from == 'them' ) {

            SendToThem( user + ":" + msg.action + "\n\n" );
            // socket.broadcast.emit('retrieve', { msg: user + ":" + msg.action + "\n\n" } );

        } else if( from == 'self' || from == '' ) {

            SendToSelf( user + ":" + msg.action + "\n\n" );
            // socket.emit('retrieve', { msg: user + ":" + msg.action + "\n\n" } );

        } else {

            SendToTarget( user + ":" + msg.action + "\n\n", from );
            // socket.emit('retrieve', from, { msg: user + ":" + msg.action + "\n\n" } );

        }

        // SendToAll( user + ":" + 'msg: ' + getSendingRate( ) + "\n\n" );

        sendrates[ user ]++;

    });

    socket.on( 'retrieve', function( ) {

            sendrates[ user ]++;

            getMsgs( user );

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

        SendToAll( user + ":add:" + user + "\n\n" );

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


// LZW-compress a string
function lzw_encode(s) {
    var dict = {};
    var data = (s + "").split("");
    var out = [];
    var currChar;
    var phrase = data[0];
    var code = 256;
    for (var i=1; i<data.length; i++) {
        currChar=data[i];
        if (dict[phrase + currChar] != null) {
            phrase += currChar;
        }
        else {
            out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
            dict[phrase + currChar] = code;
            code++;
            phrase=currChar;
        }
    }
    out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
    for (var i=0; i<out.length; i++) {
        out[i] = String.fromCharCode(out[i]);
    }
    return out.join("");
}


// Decompress an LZW-encoded string
function lzw_decode(s) {
    var dict = {};
    var data = (s + "").split("");
    var currChar = data[0];
    var oldPhrase = currChar;
    var out = [currChar];
    var code = 256;
    var phrase;
    for (var i=1; i<data.length; i++) {
        var currCode = data[i].charCodeAt(0);
        if (currCode < 256) {
            phrase = data[i];
        }
        else {
           phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
        }
        out.push(phrase);
        currChar = phrase.charAt(0);
        dict[code] = oldPhrase + currChar;
        code++;
        oldPhrase = phrase;
    }
    return out.join("");
}