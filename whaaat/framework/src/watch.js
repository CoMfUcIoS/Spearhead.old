/**
 * @module framework
 * @submodule watch
 * @namespace framework
 *
 * @return {Object} Module component
 */

import $ from 'jquery-deferred';

const watch = function() {
  let _util,
      _config,
      _events,
      _server,
      _eventsIO,
      $sim,
      $mySQL,

      _service,
      _useSimulator;


  /**
   * The watch component
   *
   * @class watch
   */
  return {

    /*!
     * Module dependencies
     *
     * @hidden
     * @type {Array}
     */
    requires : [
      '$sim',
      '$mySQL',
      'util',
      'config',
      'events',
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
      _config = requires['config'];
      _events = requires['events'];
      _server = requires['server'];
      _eventsIO = _server.events;
      $sim    = requires['$sim'];
      $mySQL  = requires['$mySQL'];
      /*eslint-enable dot-notation*/

      _useSimulator = _config.get('useSimulator');
      _service = (_useSimulator) ? $sim : $mySQL;
    },

    /**
     * Starts the watch service
     *
     * @method start
     * @publi
     * @return {[type]} [description]
     */
    start : function() {
      _service.watch();

        // Start listening to all events.
      _server.startListening();

      return true;
    },

    getApiUrl : function(url) {
      const $defer = $.Deferred();

      _service.url(url).done((data) => {
        _util.log('Client connected from ' + url + ' and ll use API from : ' + data);
        $defer.resolve(data);
      });
      return $defer.promise();
    }
  };


};


export default watch;
