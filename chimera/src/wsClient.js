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
      _config;

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
    return vhost || `ws://localhost:${port}/`;
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
      _config   = requires['config'];
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
    connect : function(uri) {
      uri = uri || _getHydraUri();
      const client = new Client();

      client.connect(uri, 'echo-protocol');

      return client;
    }
  };
};

export default wsClient;
