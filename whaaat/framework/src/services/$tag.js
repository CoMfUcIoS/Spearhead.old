/**
 * @module framework
 * @submodule $tag
 * @namespace framework
 *
 * @returns {Object} service component
 */

import $ from 'jquery-deferred';

const $tag = (function() {
  let _util,
      _obj,
      _config,
      _server,
      _request,

      _APP_TOKEN,
      /**
       * Define all the requests for specified trends
       * @type {Object}
       */
      REQUEST_PROJECT_LIST =
      {
        endPoint : '1.0/project/list',
        request  : function({ uToken }) {
          return {
            request : {
              userToken : uToken,
              appToken  : _APP_TOKEN
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
      'server',
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
      _server  = requires['server'];
      _request = requires['$request'];
      _obj     = _util.object;
      /*eslint-enable dot-notation*/

      _APP_TOKEN = _config.get('appToken');
    },

    /**
     * Gets a list of all Projects
     *
     * @method getProjectList
     * @public
     * @param  {String} options.uToken  User Token
     * @param  {Number} options.timeout Timeout of the call
     * @return {Object}                 Promise Object
     */
    getProjectList : function({ uToken, timeout }) {
      const $defer = $.Deferred(),
          done = (data) => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;

            if (typeof data === 'object') {
              $defer.resolve(_obj.get(data, 'results', []));
            } else {
              _util.log('$tag : getProjectList : Getting project list for ' + uToken + ' failed. Data wasnt an object ');
              $defer.reject();
            }
          },
          data = JSON.stringify(REQUEST_PROJECT_LIST.request({ uToken })),
          endPoint = REQUEST_PROJECT_LIST.endPoint,
          fail = function(err) {
            _util.log('$tag : getProjectList : Getting project list for ' + uToken + ' failed. status: ' + err.statusText);
            $defer.reject();
          };

      _request.post({ endPoint, data, done, fail, timeout });

      return $defer.promise();
    },

    /**
     * Registers all the listeners of the this service
     *
     * @method  listen
     * @public
     * @param  {Object} sckt Websocket object
     */
    listen : function(sckt) {
      _server.events.on('getProjectList', ({ uToken, timeout }) => {
        this.getProjectList({ uToken, timeout }).done(
          (data) => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;
            _server.events.trigger(sckt.id, 'gotProjectList', data);
          })
        .fail(() => {
          _util.log('$tag : Event getProjectList : Couldnt find the requested page.');
        });
      });
    }

  };
});

export default $tag;
