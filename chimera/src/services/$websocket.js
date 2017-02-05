/**
 * @module framework
 * @submodule $websocket
 * @namespace framework
 *
 * @returns {Object} Module component
 */

import { client as Client, server as Server } from 'websocket';
import http    from 'http';
import $       from 'jquery-deferred';
import request from 'request';


const $websocket = function() {

  let _util,
      _config,
      _client,
      CLIENTS = {};

  /*!
   * Retrieves uri for hydras connection. If a vhost is defined
   * then returns that vhost, else returns localhost:port for hydra
   *
   * @method _getHydraUri
   * @private
   * @return {String} Uri
   */
  function _getHydraUri() {
    const $defer = $.Deferred(),
        port = _config.get('ports.hydra'),
        vhost = _util.object.findKey(_config.get('vhosts'), (vPort) => vPort === port);
    let uri;

    if (_util.toType(vhost) !== 'undefined') {
      uri = `ws://${vhost}.${_util.hostname().toLowerCase()}.local:${port}`;
      request(uri, (error, response, body) => { //eslint-disable-line
        if (!error && response.statusCode === 200) {
          $defer.resolve(uri);
        } else {
          $defer.resolve(`ws://localhost:${port}/`);
        }
      });
    } else {
      $defer.resolve(`ws://localhost:${port}/`);
    }

    return $defer.promise();
  }

  /*!
   * Connects to the ws server
   *
   * @method _connectToServer
   * @private
   * @param  {[type]} options.uri    [description]
   * @param  {[type]} options.events [description]
   * @return {[type]}                [description]
   */
  function _connectToServer({ uri, events, origin }) {
    function _makeConnection() {
      _client = new Client();

      _util.log(`connecting to ${uri}`);

      _client.on('connectFailed', function(error) {
        _util.log(`Connect Error: ${error.toString()} retring to connect again in 5 secs`);
        setTimeout(() => {
          _connectToServer({ uri, events, origin });
        }, 5000);
      });

      _client.on('connect', function(connection) {
        events(connection);
      });

      _client.connect(uri, 'echo-protocol', origin);
    }

    if (uri) {
      _makeConnection();
    } else {
      _getHydraUri().done((data) => {
        uri = data;
        _makeConnection();
      });
    }
  }

  function _httpserverFn(req, response) {
    _util.log((new Date()) + ' Received request for ' + req.url);
    response.writeHead(404);
    response.end();
  }

  function _originIsAllowed(origin) {
    // accept our apps.
    let allowed = _itsOurOwnApp(origin) && (!CLIENTS[origin]);

    if (!allowed && _util.toType(origin) === 'string') {
      allowed = (origin.indexOf(`${_util.hostname().toLowerCase()}.local`) > -1);
    }

    return allowed;
  }

  function _itsOurOwnApp(app) {
    const allowedOrigins = Object.keys(_config.get('ports')),
        allowedSSLDomains = _config.get('allowedSSLDomains'),
        matchArr = app.match(/\w+\.\w+[.\w+]+/g),
        domain = _util.array.isArray(matchArr) && matchArr[0],
        ownApp = (allowedOrigins.indexOf(app) > -1);

    return (!ownApp) ? (allowedSSLDomains.indexOf(domain) > -1) : true;
  }

  /**
   * The $websocket component
   *
   * @class $websocket
   */
  return {
    /*!
     * Module dependencies
     *
     * @hidden
     * @type {Array}
     */
    requires : [
      'util',
      'config'
    ],

    /*!
     * Module initialization function
     *
     * @method _init_
     * @hidden
     * @param  {Array} requires Dependencies injections
     */
    _init_ : function(requires) {
      /*eslint-disable dot-notation*/
      _util   = requires['util'];
      _config = requires['config'];
      /*eslint-enable dot-notation*/
    },
    /**
     * @module $websocket
     * @submodule client
     * @namespace $websocket
     *
     * @returns {Object} Module component
     */
    client : {
      /**
       * Creates the client to connect to websocket server
       *
       * @method connect
       * @public
       * @param  {String} uri Uri of the ws server
       * @return {Object}     Returns the client connection
       */
      connect : function({ uri, events, origin }) {
        _client = _connectToServer({ uri, events, origin });

        return _client;
      }
    },
    /**
     * @module $websocket
     * @submodule server
     * @namespace $websocket
     *
     * @returns {Object} Module component
     */
    server : {
      /**
       * Creates the server to connect to websocket server
       *
       * @method connect
       * @public
       * @param  {Numner} port Port on which the server will run
       */
      start : function({ port }) {
        const httpServer = http.createServer(_httpserverFn),

            wsServer = new Server({
              httpServer,
            // You should not use autoAcceptConnections for production
            // applications, as it defeats all standard cross-origin protection
            // facilities built into the protocol and the browser.  You should
            // *always* verify the connection's origin and decide whether or not
            // to accept it.
              autoAcceptConnections : false
            });


        httpServer.listen(port, function() {
          _util.log(`Hydra server is listening on port ${port}`);
        });
        wsServer.on('request', function(req) {
          const origin = req.origin,
              ownApp = _itsOurOwnApp(origin),
              uuid = _util.uuid();

          if (!_originIsAllowed(origin)) {
            // Make sure we only accept requests from an allowed origin
            req.reject();
            _util.log(' Connection from origin ' + origin + ' rejected.');
            return;
          }

          let connection = req.accept('echo-protocol', origin);
          _util.log(`Connection from ${origin} accepted. Client Id ${uuid}`);

          if (ownApp) {
            CLIENTS[origin] = connection;
          } else {
            if (_util.toType(CLIENTS[origin]) !== 'object') {
              CLIENTS[origin] = {};
            }
            CLIENTS[origin][uuid] = connection;
          }

          connection.on('message', function(message) {
            message = JSON.parse(message.utf8Data);
            if (_util.object.get(message, 'to')) {
              let connectionTo;
              if (message.to !== 'all') {
                if (_itsOurOwnApp(message.to)) {
                  connectionTo = _util.object.get(CLIENTS, message.to);
                } else {
                  connectionTo = _util.object.get(CLIENTS[origin], message.to);
                }

                if (connectionTo) {
                  connectionTo.send(JSON.stringify(message.message));
                }
              } else {
                _util.log('To ALl ... but who ? ownApps or not ?');
              }
            } else if (_util.toType(message) !== 'object') {
              _util.log('What i got smth without a type? Huh ?');
            } else {
              switch (message.type) {
                case 'message' : {
                  _util.log(`Got a mesage from ${origin} - ${uuid}, message : ${message.message}`);
                  break;
                }
              }
            }
          });

          connection.send(JSON.stringify({ type : 'uuid', uuid }));

          connection.on('close', function(reasonCode, description) {
            if (!ownApp) {
              delete CLIENTS[origin][uuid];
            } else {
              delete CLIENTS[origin];
            }
            _util.log(`Peer ${connection.remoteAddress} with uuid : ${uuid} disconnected. Description: ${description}`);
          });
        });
      }
    }
  };
};

export default $websocket;
