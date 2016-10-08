/**
 * @module framework
 * @submodule server
 * @namespace framework
 *
 * @return {Object} Module component
 */

import express     from 'express';
import * as _fs    from 'fs';
import * as _path  from 'path';
import socket      from 'socket.io';
import * as _https from 'https';
import bodyParser  from 'body-parser';

const server = function() {
  let  _util,
      _config,
      _watch,
      _request,

      _app,
      _server,
      _io;

  const _texts          = {},
      _clients          = {},
      _listeningEvents  = {},
      _modListeners     = [];

  /**
   * The server component
   *
   * @class server
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
      'config',
      'watch',
      '$request'
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
      _util    = requires['util'];
      _config  = requires['config'];
      _watch   = requires['watch'];
      _request = requires['$request'];
      /*eslint-enable dot-notation*/

      this.requires.forEach((mod) => {
        const module = _util.object.get(requires, mod);
        if (_util.toType(_util.object.get(module, 'listen')) === 'function') {
          _modListeners.push(module);
        }
      });

    },

    /**
     * Initialize server
     *
     * @method  initialize
     * @public
     */
    initialize : function() {
      const _cert = {
            path : _path.join(_path.dirname(module.parent.filename), 'keys'),
            key  : 'server.key',
            crt  : 'server.crt'
          },
          _deployCert =  _config.get('deployingSSLCert');

      _app     = express();

      _app.use(bodyParser.text({ type : '*/*' })); // to support text bodies
      // Additional middleware which will set headers that we need on each request.
      _app.use(function(req, res, next) {

        // Allow everything.
        res.setHeader('Access-Control-Allow-Origin', '*');

        // Request methods you wish to allow
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

        // Request headers you wish to allow
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

        // Disable caching so we'll always get the latest comments.
        res.setHeader('Cache-Control', 'no-cache');

        // Set to true if you need the website to include cookies in the requests sent
        // to the API (e.g. in case you use sessions)
        res.setHeader('Access-Control-Allow-Credentials', true);
        next();
      });
      _server  = _https.Server({ // eslint-disable-line new-cap
        key  : (_config.get('deployed')) ? _fs.readFileSync(_deployCert.path + '/' + _deployCert.key) : _fs.readFileSync(_cert.path + '/' + _cert.key),
        cert : (_config.get('deployed')) ? _fs.readFileSync(_deployCert.path + '/' + _deployCert.crt) : _fs.readFileSync(_cert.path + '/' + _cert.crt)
      }, _app);
      _io  = socket(_server);
    },
    /**
     * Http server starts listening to port
     *
     * @method  start
     * @public
     */
    start : function() {
      _server.listen(_config.get('port'), function() {
        _util.log('RepKnightBridge started on Port : ' + _config.get('port'));
      });
    },

    /**
     * Sets all the get responses of the server
     *
     * @method  get
     * @public
     * @param  {String}   uri      The get uri for example: /product
     * @param  {Function} callback Function to run when someone navigated to the above uri
     */
    get : function(uri, callback) {
      _app.get(uri, (request, respond) => {
        callback({ request, respond });
      });
    },

    /**
     * Sets all the post responses of the server
     *
     * @method  post
     * @public
     * @param  {String}   uri      The get uri for example: /product
     * @param  {Function} callback Function to run when someone navigated to the above uri
     */
    post : function(uri, callback) {
      _app.post(uri, (request, respond) => {
        callback({ request, respond });
      });
    },

    /**
     * Logs all the paths our API listens to
     *
     * @method  stack
     * @public
     */
    stack : function() {
      _app._router.stack.forEach((r) => {
        if (r.route && r.route.path) {
          _util.log(r.route.path);
        }
      });
    },

    /**
     * Sets a static folder to serve
     *
     * @method  static
     * @public
     * @param  {String} uri The get uri for example: /assets
     */
    static : function(uri) {
      _app.use(uri, express['static'](__dirname + uri, { maxAge : 86400000 }));
    },
    /**
     * Starts listening clients connections on servers socket
     *
     * @method  startListening
     * @public
     */
    startListening : function() {
      const _self = this;

      // On Client connection.
      _io.on('connection', function(sckt) {
        const guid = _util.guid(guid);

        _util.log('A client is connected, Session id: ' + guid);

        // Save clients session
        _clients[guid] = {
          socketId : sckt.id,
          socket   : sckt
        };


        _self.events.on('host', (url) => {
          // sent API url
          _watch.getApiUrl(url).done((data) => {
            _request.setURL(data);
          });
        });

        _modListeners.forEach((mod) => {
          mod.listen(sckt);
        });

        _util.log('Clients connected: ' + Object.keys(_clients).length);

        // Sent sessionId to client
        _self.events.trigger(_clients[guid].socketId, 'sessionId', guid);


        _self.events.on('disconnect', () => {
          _util.log('Client with sessionID ' + guid + ' disconnected');
          delete _clients[guid];
          delete _texts[guid];
        });

        if (Object.keys(_listeningEvents).length > 0) {
          Object.keys(_listeningEvents).forEach((event) => {
            sckt.on(event, _listeningEvents[event]);
          });
        }
      });
    },

    /**
     * Server's socket events
     *
     * @class server.events
     * @static
     */
    events : {
      /**
       * Sets a listening event
       *
       * @method  on
       * @public
       * @param  {String}   event    Event to listen to
       * @param  {Function} callback Function to run when event is triggered
       * @return {Boolean}           True if event successfully registered, false otherwise
       */
      on : function(event, callback) {
        if (typeof event !== 'string' ||
                  typeof callback !== 'function' ||
                  event.indexOf(_listeningEvents) >= 0) {
          return false;
        }
        _listeningEvents[event] = callback;
        return true;
      },
      /**
       * Triggers an event to a specific socket with specific data
       *
       * @method  trigger
       * @public
       * @param  {String} socketId The socket id we want an event to be triggered
       * @param  {String} event    The event name we want to trigger
       * @param  {Any}    data     Data to be transmited with the event
       */
      trigger : function(socketId, event, data) {
        _io.to(socketId).emit(event, data);
      }
    },
    /**
     * Connected clients object
     *
     * @type {Object}
     */
    clients : _clients

  };
};

export default server;
