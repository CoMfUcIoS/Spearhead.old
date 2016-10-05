/**
 * @module framework
 * @submodule events
 * @namespace framework
 *
 * @return {Object} Module component
 */

import { EventEmitter } from 'events';

const events = function() {
  let _util,
      _events;

  /**
   * The events component
   *
   * @class events
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
      _events = new EventEmitter();
      /*eslint-enable dot-notation*/
    },

    /**
     * Registers an event listener
     *
     * @method  on
     * @public
     * @param  {String}   name     Name of the event
     * @param  {Function} callback Callback function
     */
    on : function(name, callback) {
      _util.log('Started to listen to ' + name + ' event!');
      _events.on(name, callback);
    },

    /**
     * Registers an event listener to listen for an event
     * Just once then unregister itself
     *
     * @method  once
     * @public
     * @param  {String}   name     Name of the event
     * @param  {Function} callback Callback function
     */
    once : function(name, callback) {
      _util.log('Started listening to ' + name + ' event for once!');
      _events.once(name, callback);
    },

    /**
     * Unregisters an event listener
     *
     * @method  off
     * @public
     * @param  {String}   name     Name of the event
     * @param  {Function} callback Callback function
     */
    off : function(name, callback) {
      _util.log('Stopped listening to ' + name + ' event!');
      _events.removeListener(name, callback);
    },

    /**
     * Triggers an event
     *
     * @method  trigger
     * @public
     * @param {String} name  Name of the event to be triggered
     * @param {Object} obj   Object of values we want to pass to the event callback
     */
    trigger : function() {
      const args = Array.prototype.slice.call(arguments),
          name = args[0];

      args.shift();
      _util.log(name + ' event is triggered!');

      _events.emit(name, args[0]);
    },

    /**
     * Returns the number of the callbacks registered to
     * a specific event
     *
     * @method  eventsCount
     * @param  {String} name Name of the event
     * @return {Number}      Number of registered callbacks
     */
    eventsCount : function(name) {
      const evns = _events.listeners(name);
      return (Array.isArray(evns)) ? evns.length : 0;
    }
  };


};

export default events;
