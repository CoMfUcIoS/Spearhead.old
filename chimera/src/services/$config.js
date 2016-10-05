/**
 * @module framework
 * @submodule $config
 * @namespace framework
 *
 * @returns {Object} service component
 */

import $ from 'jquery-deferred';

const $config = (function() {
  let _util,
      _obj,
      _config,
      _request,

      _APP_TOKEN,
      /**
       * Define all the requests for specified trends
       * @type {Object}
       */
      REQUEST =
      {
        endPoint : '1.0/user/configurations/get',
        request  : function({ uToken }) {
          return {
            request : {
              userToken : uToken,
              appToken  : _APP_TOKEN
            }
          };
        }
      },
      UPDATE_REQUEST =
      {
        endPoint : '1.0/user/configurations/update',
        request  : function({ uToken, config }) {
          return {
            request : {
              userToken : uToken,
              appToken  : _APP_TOKEN,
              config
            }
          };
        }
      };

  /**
   * The $config service
   *
   * @class $config
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
      _request = requires['$request'];
      _obj     = _util.object;
      /*eslint-enable dot-notation*/

      _APP_TOKEN = _config.get('appToken');
    },

    /**
     * Gets the config object from the BE
     *
     * @method get
     * @public
     * @param  {String} options.uToken  User Token
     * @param  {Number} options.timeout Timeout of the call
     * @return {Object}                 Promise Object
     */
    get : function({ uToken, timeout }) {
      const $defer = $.Deferred(),
          done = (data) => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;

            if (typeof data === 'object') {
              $defer.resolve(_obj.get(data, 'config', {}));
            } else {
              _util.log('$config : get : Getting config for ' + uToken + ' failed. Data wasnt an object ');
              $defer.reject();
            }
          },
          data = JSON.stringify(REQUEST.request({ uToken })),
          endPoint = REQUEST.endPoint,
          fail = function(err) {
            _util.log('$config : get : Getting config for ' + uToken + ' failed. status: ' + err.statusText);
            $defer.reject();
          };

      _request.post({ endPoint, data, done, fail, timeout });

      return $defer.promise();
    },

    /**
     * Calls BE to update Config object
     *
     * @method  update
     * @public
     * @param  {String}   options.uToken    User token
     * @param  {Object}   options.config    Config Object
     * @param  {Number}   options.timeout   Request TImeout
     * @return {Object}                     Promise Object
     */
    update : function({ uToken, config, timeout }) {
      const $defer = $.Deferred(),
          done = (data) => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;

            if (typeof data === 'object') {
              $defer.resolve(data);
            } else {
              _util.log('$config : get : Getting config for ' + uToken + ' failed. Data wasnt an object ');
              $defer.reject();
            }
          },
          data = JSON.stringify(UPDATE_REQUEST.request({ uToken, config })),
          endPoint = UPDATE_REQUEST.endPoint,
          fail = function(err) {
            _util.log('$config : get : Getting config for ' + uToken + ' failed. status: ' + err.statusText);
            $defer.reject();
          };

      _request.post({ endPoint, data, done, fail, timeout });

      return $defer.promise();
    }

  };
});

export default $config;
