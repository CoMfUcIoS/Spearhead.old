/**
 * @module framework
 * @submodule queue
 * @namespace framework
 *
 * @return {Object} Module component
 */

import $ from 'jquery-deferred';

const queue = function() {

  let _util,
      _obj,
      _config,
      lastPromise = null,
      qMap        = {};

  /*!
   * Waits last promise to resolve before
   * try to resolve the next one
   *
   * @method _waitLastPromise
   * @private
   * @return {Object} Promise object
   */
  function _waitLastPromise() {
    const $dfd = $.Deferred();

    // when the previous method returns, resolve this one
    $.when(lastPromise).always(function() {
      $dfd.resolve();
    });

    return $dfd.promise();
  }

  /**
   * The queue component
   *
   * @class queue
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
      _obj    = _util.object;
      /*eslint-enable dot-notation*/
    },

    /**
     * Adds a call to the queue
     *
     * @method  add
     * @public
     * @param {Object} options     Example:
     *                             {
     *                               obj: _util,
     *                               method: log,
     *                               args: ['hello'],
     *                               context: this
     *                             }
     * @return {Boolean}           True if successfully added to queue, false otherwise
     */
    add : function(options) {
      const expectedOptions = {
            obj : {
              mandatory : true,
              type      : 'object'
            },
            method : {
              mandatory : true,
              type      : 'string'
            },
            args : {
              mandatory : false,
              type      : 'array'
            }
          },
          waitInMs = _config.get('queue.runNext') || 100, //Milliseconds before running the next promise in the queue
          opts     = options,
          promise  = opts.method + '-' + JSON.stringify(opts.args).replace(/\./g, '_'); // Promise name

      let queueDeferred,
          $dfd;

      // Check if option object passed meets this function expectations.
      if (!_obj.sanity(opts, expectedOptions)) {
        _util.log('framework : queue : add : Parameters passed are incorrect');
        return false;
      }

      // check if it promise is already in the queue
      if (this.isOnQueue(promise)) {
        _util.log('framework : queue : add : specific promise already queued.');
        return false;
      }

      // Ok add it to the queue.
      $dfd = $.Deferred();
      queueDeferred  = _waitLastPromise();

      // Check and decide the context of the function call
      if (!_obj.get(opts, 'context', null)) {
        opts.context = opts.obj;
      }

      // execute next queue method
      queueDeferred.done(function() {
        // call actual method and wrap output in deferred
        setTimeout(() => {
          // function call
          opts.obj[opts.method].apply(opts.context, opts.args);
          // remove the promise from the queue map
          delete qMap[promise];
          $dfd.resolve();
        }, waitInMs);

      });
      lastPromise = $dfd.promise();

      // add it to queue map
      _obj.set(qMap, promise, true);

      return true;
    },
    /**
     * Checks if promise is already in the queue
     *
     * @method  isOnQueue
     * @public
     * @param  {String}  promise Promise name to check the queue map
     * @return {Boolean}         True if found, false otherwise
     */
    isOnQueue : function(promise) {
      if (_obj.get(qMap, promise, false)) {
        return true;
      }
      return false;
    }
  };
};

export default queue;
