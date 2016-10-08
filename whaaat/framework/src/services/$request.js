/**
 * @module framework
 * @submodule request
 * @namespace framework
 *
 * @returns {Object} Module component
 */

import $        from 'jquery-deferred';
import request  from 'request-promise';

const $request = (function() {
  const qMap = {},
      _statusCodes = [200, 201, 202, 203, 205, 205, 206, 207, 208, 209];

  let _util,
      _obj,
      _config,
      lastPromise,  // this ll change anyway from the bridge.
      _APIURL = 'https://localhost:4730/';


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
   * The request component
   *
   * @class request
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
     * request get method to call the API
     *
     * @method get
     * @public
     * @param {Object} options Options object with the following.
     *   @param  {String}   options.endPoint The API Endpoint we want to call
     *   @param  {Function} options.done     Function we want to call on success
     *   @param  {Function} options.fail     Function we want to call on failure
     *   @param  {Function} options.progress Function we want to call on progress
     * @return {Object}                    Promise object
     */
    get : function({ endPoint, done, fail, progress, timeout }) {
      const config = {
        timeout,
        endPoint,
        type : 'GET',
        done,
        fail,
        progress
      };
      //Add it to the queue
      return this.queue.add({ obj : this, method : 'call', args : config });
    },

    /**
     * request post method to call the API
     *
     * @method post
     * @public
     * @param {Object} options Options object with the following.
     *   @param  {String}   options.endPoint The API Endpoint we want to call
     *   @param  {Object}   options.data The API Endpoint we want to call
     *   @param  {Function} options.done     Function we want to call on success
     *   @param  {Function} options.fail     Function we want to call on failure
     *   @param  {Function} options.progress Function we want to call on progress
     * @return {Object}                    Promise object
     */
    post : function({ endPoint, data, done, fail, progress, timeout }) {
      const config = {
        timeout,
        endPoint,
        type   : 'POST',
        method : 'POST',
        data,
        done,
        fail,
        progress
      };
      return this.queue.add({ obj : this, method : 'call', args : config });
    },

    /**
     * This is just a call to the api we want to ... this must be changed to most specific call to
     * our BackEnd api and server must be config driven.
     *
     * @method  requestCall
     * @public
     * @param  {Object} config   Config object example
     *                           {
     *                             endPoint : "API/v2/getTrends",
     *                             context : document.body,
     *                             timeout : 5000,
     *                             dataType : 'json',
     *                             data : { test: 123 },
     *                             type : 'GET',
     *                             done : function(data) {
     *                                      _util.log("Sucess! " +data);
     *                                    },
     *                             fail : function(error) {
     *                                      _util.log("There has been error : " +error);
     *                                    },
     *                             progress : function() {
     *                                          _util.log("The server is still processing the request, hold tight.");
     *                                        },
     *                           }
     * @return {Object}          $.Deferred.promise() or null
     */
    call : function(config) {
      config = config || null;

      var settings,
          $promise = null,
          $dfd = $.Deferred();

      if (config) {
        settings = {
          uri       : _APIURL + config.endPoint,
          timeout   : config.timeout  || 5000,
          body      : config.data     || {},
          context   : config.context  || this,
          type      : config.dataType || 'json',
          method    : config.type,
          strictSSL : false,
          simple    : true,
          json      : _config.get('useSimulator'),
          headers   : {
            'User-Agent' : 'Request-Promise'
          },
          done : function(data) {
            $dfd.resolve(data);
          },
          fail : function(error) {
            $dfd.reject(error);
          }
        };

        $promise = request(settings);

        $promise.then(config.done, function(err) {
          if (_statusCodes.indexOf(err.statusCode) < 0) {
            if (typeof config.fail === 'function') {
              config.fail(err);
            } else {
              _util.log("request : call : request Request Failed - No 'fail' Handler", err);
            }
          } else if (typeof config.done === 'function') {
            config.done(err);
          } else {
            _util.log("request : call : request Request Success - No 'done' Handler", err);
          }
        }, config.progress);

        return $promise;
      } else {
        return null;
      }
    },

    /**
     * Set's the API URL to make the calls
     *
     * @method  setUrl
     * @public
     * @param {String} url The url we want to set.
     */
    setURL : function(url) {
      _APIURL = url;
    },

    /**
     * The request.queue component
     *
     * @class request.queue
     */
    queue : {
      /**
       * Adds a call to the queue
       *
       * @method  add
       * @public
       * @param {Object} options     @Example:
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
          _util.log('request : queue : add : Parameters passed are incorrect');
          return false;
        }

        // check if it promise is already in the queue
        if (this.isOnQueue(promise)) {
          _util.log('request : queue : add : specific promise already queued.');
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
            opts.obj[opts.method].call(opts.context, opts.args);
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

    }
  };
});

export default $request;
