/**
 * @module framework
 * @submodule wsClient
 * @namespace framework
 *
 * @returns {Object} Module component
 */

import { client as Client } from 'websocket';


const wsClient = function() {

  let _util,
      _config,
      _client;

  /*!
   * Retrieves uri for hydras connection. If a vhost is defined
   * then returns that vhost, else returns localhost:port for hydra
   *
   * @method _getHydraUri
   * @private
   * @return {String} Uri
   */
  function _getHydraUri() {
    const port = _config.get('ports.hydra'),
        vhost = _util.object.findKey(_config.get('vhosts'), (vPort) => vPort === port);
    return (_util.toType(vhost) !== 'undefined') ? `ws://${vhost}.${_util.hostname().toLowerCase()}.local:${port}` : `ws://localhost:${port}/`;
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
    uri = uri || _getHydraUri();
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

  /**
   * The wsClient component
   *
   * @class wsClient
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
  };
};

export default wsClient;
