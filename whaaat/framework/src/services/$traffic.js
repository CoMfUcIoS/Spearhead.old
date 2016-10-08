/**
 * @module framework
 * @submodule $traffic
 * @namespace framework
 *
 * @returns {Object} service component
 */

import $ from 'jquery-deferred';

const $traffic = (function() {
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
      REQUEST =
      {
        endPoint : '1.0/traffic/tagV2',
        request  : function({ tagId, uToken }) {
          const now = new Date();
          return {
            request : {
              dateTo    : _util.date.formatForChart(now),
              dateFrom  : _util.date.formatForChart(new Date(now.setHours(now.getHours() - 2))),
              timeZone  : Intl.DateTimeFormat().resolvedOptions().timeZone,
              userToken : uToken,
              appToken  : _APP_TOKEN,
              tagId     : tagId
            }
          };
        }
      },
      TAG_REQUEST =
      {
        endPoint : '1.0/tag/companies',
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
   * The $traffic service
   *
   * @class $traffic
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
      _request = requires['$request'];
      _server  = requires['server'];
      _obj     = _util.object;
      /*eslint-enable dot-notation*/

      _APP_TOKEN = _config.get('appToken');
    },

    /**
     * Fetches the data from the backend and returns them
     *
     * @method  get
     * @public
     * @param  {String} uToken The User token
     * @param  {Number} tagId  Tag id if we want to fetch trends fro a specific tag
     * @return {Array}        Trends
     */
    get : function({ uToken, tagId, timeout }) {
      const $defer = $.Deferred(),
          done = (data) => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;

            let trafficArray = _obj.get(data, 'results.traffic'),
                spikesArray = _obj.get(data, 'results.spikes');

            if (typeof data === 'object') {
              _obj.set(data, 'results.traffic', trafficArray);
              _obj.set(data, 'results.spikes', spikesArray);
              _obj.set(data, 'tagId', tagId);
              $defer.resolve(data);
            } else {
              _util.log('$traffic : get : Getting traffic for ' + tagId + ' failed. Data wasnt an object ');
              $defer.reject();
            }
          },
          data = JSON.stringify(REQUEST.request({ tagId, uToken })),
          endPoint = REQUEST.endPoint,
          fail = function(err) {
            _util.log('$traffic : get : Getting traffic for ' + tagId + ' failed. status: ' + err.statusText);
            $defer.reject();
          };

      _request.post({ endPoint, data, done, fail, timeout });

      return $defer.promise();
    },

    getTags : function({ uToken, timeout }) {
      const $defer = $.Deferred(),
          done = (data) => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;
            $defer.resolve(_obj.get(data, 'results', []));
          },
          data = JSON.stringify(TAG_REQUEST.request({ uToken })),
          endPoint = TAG_REQUEST.endPoint,
          fail = function(err) {
            _util.log('$traffic : getTags : Getting Tags failed. status: ' + err.statusText);
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
      _server.events.on('getTags', ({ uToken }) => {
        this.getTags({
          uToken : uToken
        }).done(
          (data) => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;
            _server.events.trigger(sckt.id, 'gotTags', data);
          })
        .fail(() => {
          _util.log('$traffic : Event getTags : Couldnt get company Tags.');

        });
      });

      _server.events.on('getChart', ({ uToken, tagId, timeout }) => {
        this.get({ uToken, tagId, timeout }).done(
          (data) => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;
            _server.events.trigger(sckt.id, 'gotChart', data);
          })
        .fail(() => {
          _util.log('$traffic : Event getCharts : Couldnt get chart data.');

        });
      });
    }
  };
});

export default $traffic;
