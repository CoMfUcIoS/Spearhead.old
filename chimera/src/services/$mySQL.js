/**
 * @module $mySQL
 *
 * @return {Object} Service component
 */

import $    from 'jquery-deferred';

const $mySQL = function() {
  const _DEFAULT_API_URL = 'https://api.repknight.com:10444/';

  let MySQLEvents,
      _util,
      _obj,
      _config,
      _server,

      mysqlEventWatcher,
      dsn;

  /**
   * $mySQL Service
   *
   * @class $mySQL
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
      'server'
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
      _obj    = _util.object;
      _config = requires['config'];
      _server = requires['server'];
      /*eslint-enable dot-notation*/

      MySQLEvents = require('zongji');
    },

    /**
     * Returns the url of our server API
     *
     * @method url
     * @public
     * @param {String} hostname  The domain the app is running
     * @return {Object}          Promise object
     */
    url : function(hostname) {
      const $defer = $.Deferred(),
          configUrls = _config.get('javaAPI'),
          url = configUrls[hostname] || _DEFAULT_API_URL;

      $defer.resolve(url);

      return $defer.promise();
    },

    /**
     * Starts to watch for mysql bin log changes.
     *
     * @method  watch
     * @public
     */
    watch : function() {

      // Initialize the server
      _server.initialize();

      dsn = _config.get('mySql');

      if (!dsn) {
        _util.log('$mySQL : _init_ : Initialization failed. Couldn\'t read configuration file');
        return;
      }
      // mysqlEventWatcher = new MySQLEvents(dsn);
      // // Each change to the replication log results in an event
      // mysqlEventWatcher.on('binlog', (evt) => {
      //   _util.log(evt);
      //   _util.log(evt.getEventName());
      //   evt.dump();
      // });

      // // Binlog must be started, optionally pass in filters
      // mysqlEventWatcher.start({
      //   // includeEvents: ['writerows', 'updaterows', 'deleterows']
      //   excludeEvents : ['rotate', 'tablemap']
      //   // excludeSchema: ['dbNameIwantToExclude']
      // });
      // // mysqlEventWatcher.start();


        // Start the server
      _server.start();
    }
  };
};

export default $mySQL;
