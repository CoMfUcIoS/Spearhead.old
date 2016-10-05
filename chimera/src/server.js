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
      _client,
      _config,
      _watch,
      _storage,
      $trends,
      $traffic,
      $querybuilder,
      $config,
      _request,

      _app,
      _server,
      _io,
      _events;

  const _texts          = {},
      _clients          = {},
      _listeningEvents  = {};

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
      'clients',
      'events',
      'watch',
      'storage',
      '$trends',
      '$traffic',
      '$querybuilder',
      '$config',
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
      _client  = requires['clients'];
      _events  = requires['events'];
      _watch   = requires['watch'];
      _storage = requires['storage'];
      $trends  = requires['$trends'];
      $traffic = requires['$traffic'];
      $querybuilder = requires['$querybuilder'];
      $config  = requires['$config'];
      _request = requires['$request'];
      /*eslint-enable dot-notation*/
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

        _client.save(guid, {
          sessionId : guid,
          socketId  : sckt.id
        }).fail((error) => {
          _util.log('Error saving client with Guid: ' + guid, error);
        });


        _self.events.on('host', (url) => {
          // sent API url
          _watch.getApiUrl(url).done((data) => {
            _request.setURL(data);
          });
        });

        /*
         * TODO: IK : All this events must be moved to their modules
         * and after initialization of framework will be registered
         * here.
         */
        _self.events.on('getConfig', ({ uToken, timeout }) => {
          _util.log('getConfig emitted uToken: ' + uToken);
          $config.get({ uToken, timeout }).done((data) => {
            _self.events.trigger(sckt.id, 'config', data);
          })
          .fail((err) => {
            _util.log('$config : get : Failed: ' + uToken + ' err: ' + err);
            _self.events.trigger(sckt.id, 'config', '{}');
          });
        });

        _self.events.on('updateConfig', ({ uToken, config, timeout }) => {
          _util.log('updateConfig emitted uToken: ' + uToken);
          $config.update({ uToken, config, timeout }).done((saved) => {
            _self.events.trigger(sckt.id, 'configUpdated', saved);
          });
        });

        _self.events.on('getTrends', ({ uToken, type, tagId }) => {
          $trends.get({ type : type, uToken : uToken, tagId : tagId })
          .done((data) => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;
            data.type = type;
            _self.events.trigger(sckt.id, 'trendsData_' + type, data);
          })
          .fail(() => {
            _util.log('Server : Event getTrends : Couldnt get ' + type + ' trends.');
            _self.events.trigger(sckt.id, 'trendsData_' + type, null);
          });
        });

        _self.events.on('getTags', ({ uToken }) => {
          $traffic.getTags({
            uToken : uToken
          }).done(
            (data) => {
              data = (typeof data === 'string') ? JSON.parse(data) : data;
              _self.events.trigger(sckt.id, 'gotTags', data);
            })
          .fail(() => {
            _util.log('Server : Event getTags : Couldnt get company Tags.');

          });
        });

        _self.events.on('getChart', ({ uToken, tagId, timeout }) => {
          $traffic.get({ uToken, tagId, timeout }).done(
            (data) => {
              data = (typeof data === 'string') ? JSON.parse(data) : data;
              _self.events.trigger(sckt.id, 'gotChart', data);
            })
          .fail(() => {
            _util.log('Server : Event getCharts : Couldnt get chart data.');

          });
        });

        _self.events.on('createQuerybuilderTag', ({ uToken, tag, timeout }) => {
          $querybuilder.create({ uToken, tag, timeout }).done(
            (data) => {
              data = (typeof data === 'string') ? JSON.parse(data) : data;
              _self.events.trigger(sckt.id, 'createdQuerybuilderTag', data);
            })
          .fail(() => {
            _util.log('Server : Event createQuerybuilderTag : Couldnt create the Querybuilder Tag.');
          });
        });

        _self.events.on('getQuerybuilderHistoricCount', ({ uToken, search, timeout }) => {
          $querybuilder.getHistoricCount({ uToken, search, timeout }).done(
            (data) => {
              data = (typeof data === 'string') ? JSON.parse(data) : data;
              _self.events.trigger(sckt.id, 'gotQuerybuilderHistoricCount', data);
            })
          .fail(() => {
            _util.log('Server : Event getQuerybuilderHistoricCount : Couldnt get the Querybuilder Historic Count.');
          });
        });

        _self.events.on('createQuerybuilderHistoricTag', ({ uToken, tag, timeout }) => {
          $querybuilder.createHistoric({ uToken, tag, timeout }).done(
            (data) => {
              data = (typeof data === 'string') ? JSON.parse(data) : data;
              _self.events.trigger(sckt.id, 'createdQuerybuilderHistoricTag', data);
            })
          .fail(() => {
            _util.log('Server : Event createQuerybuilderHistoricTag : Couldnt create the Querybuilder Historic Tag.');
          });
        });

        _self.events.on('updateQuerybuilderTag', ({ uToken, tag, timeout }) => {
          $querybuilder.update({ uToken, tag, timeout }).done(
            (data) => {
              data = (typeof data === 'string') ? JSON.parse(data) : data;
              _self.events.trigger(sckt.id, 'updatedQuerybuilderTag', data);
            })
          .fail(() => {
            _util.log('Server : Event updateQuerybuilderTag : Couldnt update the Querybuilder Tag.');
          });
        });

        _util.log('Clients connected: ' + Object.keys(_clients).length);

        // Sent sessionId to client
        _self.events.trigger(_clients[guid].socketId, 'sessionId', guid);


        _self.events.on('disconnect', () => {
          _util.log('Client with sessionID ' + guid + ' disconnected');
          // delete our cache ( we might dont need it if we are using api calls!)
          _client.remove(guid);
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
