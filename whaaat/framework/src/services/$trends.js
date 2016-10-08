/**
 * @module framework
 * @submodule $trends
 * @namespace framework
 *
 * @returns {Object} service component
 */

import $ from 'jquery-deferred';

const $trends = (function() {
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
      TREND_TYPES =
      {
        global : {
          id       : '$$$S$T$R$E$A$M$$$',
          endPoint : '1.0/trendv2/getTrends',
          request  : function({ uToken }) {
            return {
              request : {
                id        : this.id,
                trendType : 'TEN_MINUTES',
                limit     : 8,
                sortType  : 'AVG_COUNT',
                userToken : uToken,
                appToken  : _APP_TOKEN
              }
            };
          }
        },
        company : {
          endPoint : '1.0/trend/latest/minute',
          request  : function({ uToken }) {
            return {
              request : {
                limit     : 8,
                userToken : uToken,
                appToken  : _APP_TOKEN
              }
            };
          }
        },
        user : {
          endPoint : '1.0/trend/latest/minute',
          request  : function({ tagId, uToken }) {
            return {
              request : {
                limit     : 8,
                tagId     : tagId,
                userToken : uToken,
                appToken  : _APP_TOKEN
              }
            };
          }
        }
      };

  /**
   * The $trends service
   *
   * @class $trends
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
      _server = requires['server'];
      _obj     = _util.object;
      /*eslint-enable dot-notation*/

      _APP_TOKEN = _config.get('appToken');
    },

    /**
     * Fetches the data from the backend and returns them
     *
     * @method  get
     * @public
     * @param  {String} type   Type of trends you want to get. Can be 'user' or 'company' or 'global'
     * @param  {String} uToken The User token
     * @param  {Number} tagId  Tag id if we want to fetch trends fro a specific tag
     * @return {Array}        Trends
     */
    get : function({ type, uToken, tagId, timeout }) {
      const trend = TREND_TYPES[type],
          $defer = $.Deferred(),
          done = (data) => {
            let historyArray = _obj.get(data, 'maps.KEYWORDS', _obj.get(data, 'results'));
            if (Array.isArray(historyArray)) {
              historyArray.forEach((trend, i) => {
                const chartData = [[]];
                if (Array.isArray(trend.history)) {
                  trend.history.forEach((num, j) => {
                    chartData[0].push({ x : j, y : num });
                  });
                }
                historyArray[i].history = chartData;
              });
            }

            $defer.resolve(data);
          },
          data = JSON.stringify(trend.request({ tagId, uToken })),
          endPoint = trend.endPoint,
          fail = function(err) {
            _util.log('$trends : get : Getting ' + type + ' trends failed. status: ' + err.message);
            $defer.reject();
          };

      if (!type) {
        $defer.reject();
      }

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
      _server.events.on('getTrends', ({ uToken, type, tagId }) => {
        this.get({ type : type, uToken : uToken, tagId : tagId })
        .done((data) => {
          data = (typeof data === 'string') ? JSON.parse(data) : data;
          data.type = type;
          _server.events.trigger(sckt.id, 'trendsData_' + type, data);
        })
        .fail(() => {
          _util.log('$trends : Event getTrends : Couldnt get ' + type + ' trends.');
          _server.events.trigger(sckt.id, 'trendsData_' + type, null);
        });
      });
    }
  };
});

export default $trends;
