#!/bin/env node
//  OpenShift sample Node application
var express = require( 'express' )
    , http  = require( 'http' )
    , sio   = require( 'socket.io' )
    , fs    = require( 'fs' );


/**
 *  Define the sample application.
 */
var SampleApp = function() {

    //  Scope.
    var self = this;


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;        
        self.conn_user  = [];
        self.msgs       = [];
        self.sendrates  = [];
        self.srps       = [];

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };


    /**
     *  Populate the cache.
     */
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = { 'index.html': '' };
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) { return self.zcache[key]; };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        self.routes = { };

        // Routes for /health, /asciimo and /
        self.routes['/health'] = function(req, res) {
            res.send('1');
        };

        self.routes['/asciimo'] = function(req, res) {
            var link = "http://i.imgur.com/kmbjB.png";
            res.send("<html><body><img src='" + link + "'></body></html>");
        };

        self.routes['/'] = function(req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('index.html') );
        };
    };


    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        // self.createRoutes();
        // self.app = express.createServer();
        self.app    = express( );
        self.server = http.createServer( self.app );
        self.io     = sio.listen( self.server );

        //  Add handlers for the app (from the routes).
        // for (var r in self.routes) {
        //     self.app.get(r, self.routes[r]);
        // }
    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        //self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        // //  Start the app on the specific interface (and port).
        // self.app.listen(self.port, self.ipaddress, function() {
        //     console.log('%s: Node server started on %s:%d ...',
        //                 Date(Date.now() ), self.ipaddress, self.port);
        // });


        // connect through http
        self.server.listen( self.port, self.ipaddress );

        console.log('%s: Node server started on %s:%d ...', Date(Date.now() ), self.ipaddress, self.port);

        self.app.use( '/', express.static( __dirname + "/" ) );


        self.app.get( '/', function ( req, res ) {  

            res.sendfile( __dirname + '/index.html' );

        });

        self.app.post( '/', function ( req, res ){

            res.sendfile( __dirname + '/index.html' );

        });

        self.io.configure( function ( ) {

            // io.set( 'transports', [ 'flashsocket', 'xhr-polling', 'websocket' ] );

            // Restrict log output
            self.io.set("log level", 2);

        });

        // get sending rates
        function getSendingRate( ) {

                var text = '';

                for( item in self.conn_user ) {

                    text += ',' + self.conn_user[ item ] + '->' + self.srps[ item ];

                }

                return text;

        }

        function getSRatePerSec( ) {

            for( item in self.conn_user ) {

                self.srps[ item ] = self.sendrates[ item ];

                self.sendrates[ item ] = 0;

            }

        }

        setInterval( getSRatePerSec, 1000);


        // Operation when a user is connected
        self.io.sockets.on( 'connection', function ( socket ) { 

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

                self.sendrates[ user ]++;

            });

            socket.on( 'retrieve', function( ) {

                    self.sendrates[ user ]++;

                    getMsgs( user );

            });

            // Add players
            socket.on( 'logon', function( data ) {
              
                user = data.name;

                self.conn_user[ user ] = data.name;
                self.sendrates[ user ] = 0;

                socket.emit( 'logon', { un: user } );

                socket.set( 'username', user, function () {

                    self.io.sockets.emit( 'scores', { score: getUsers( ) } );
                    socket.emit( 'message', { msg: 'msg: Welcome ' + user + '! ' } );         
                    socket.broadcast.emit( 'message', { msg: 'msg: User is connected: ' + user + '.' } );          

                });

                SendToAll( user + ":add:" + user + "\n\n" );

                console.log( getUsers( ) );

            });


            // Remove player from connected list
            socket.on( 'disconnect', function( ) { 
              
              socket.get( 'username', function ( err, name ) {

                  delete self.conn_user[ name ];
                  self.io.sockets.emit( 'scores', { score: getUsers( ) } );
                  socket.broadcast.emit('message', { msg: 'msg: User is disconnected ' + name + '.' } );

              });

            });   

            function getUsers( ) {

                var text = '';

                for( item in self.conn_user ) {

                    text += ',' + self.conn_user[ item ];

                }

                return text;

            }

            function SendToAll( data ) {

                for( item in self.conn_user ) {

                    self.msgs[ item ] += data;

                }

            }

            function SendToThem( data ) {

                for( item in self.conn_user ) {

                    if( user != item ) {

                        self.msgs[ item ] += data;

                    }

                }

            }

            function SendToSelf( data ) {

                self.msgs[ user ] += data;

            }

            function SendToTarget( data, target ) {

                self.msgs[ target ] += data;

            }

            function getMsgs( user ) {
                
                if( self.msgs[ user ] == '' ) return;
                
                socket.emit('retrieve', { msg: self.msgs[ user ] } );

                self.msgs[ user ] = '';

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

    };

};   /*  Sample Application.  */



/**
 *  main():  Main code.
 */
var zapp = new SampleApp();
zapp.initialize();
zapp.start();

