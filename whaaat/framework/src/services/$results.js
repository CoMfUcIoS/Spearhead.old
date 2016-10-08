/**
 * @module framework
 * @submodule $results
 * @namespace framework
 *
 * @returns {Object} service component
 */
import $ from 'jquery-deferred';
const $results = (function() {
  let _util,
      _config,
      _server,
      _request,
      _APP_TOKEN,
      /**
       * Define all the requests for specified results
       * @type {Object}
       */
      REQUEST_DATASOURCES =
      {
        endPoint : '1.0/result/datasource/count',
        request  : function({ uToken, tagId }) {
          const now    = new Date(),
              dateTo   = _util.date.formatForChart(now).slice(0, -3),
              dateFrom = _util.date.formatForChart(new Date(now.setHours(now.getHours() - 2))).slice(0, -3);
          return {
            request : {
              appToken : _APP_TOKEN,
              filters  : [
                {
                  dateTo,
                  dateFrom
                }
              ],
              tagId,
              userToken : uToken
            }
          };
        }
      },
      REQUEST_SENTIMENT =
      {
        endPoint : '1.0/result/sentiment',
        request  : function({ uToken, tagId }) {
          const now    = new Date(),
              dateTo   = _util.date.formatForChart(now).slice(0, -3),
              dateFrom = _util.date.formatForChart(new Date(now.setHours(now.getHours() - 2))).slice(0, -3);
          return {
            request : {
              appToken  : _APP_TOKEN,
              cloudType : '',
              filters   : [
                {
                  dateTo,
                  dateFrom
                }
              ],
              tagId,
              userToken : uToken
            }
          };

        }
      },
      REQUEST_CLOUD =
      {
        endPoint : '1.0/result/cloud',
        request  : function({ uToken, tagId, type }) {
          const now    = new Date(),
              dateTo   = _util.date.formatForChart(now).slice(0, -3),
              dateFrom = _util.date.formatForChart(new Date(now.setHours(now.getHours() - 2))).slice(0, -3);

          return {
            request : {
              appToken    : _APP_TOKEN,
              cloudType   : type,
              returnLimit : '4',
              searchLimit : '4',
              filters     : [
                {
                  include      : '',
                  canInclude   : '',
                  exclude      : '',
                  includeUser  : '',
                  excludeUser  : '',
                  excludeUrl   : '',
                  includeUrl   : '',
                  IncludeNlp   : '',
                  dataSources  : '',
                  sentiment    : '',
                  hasRetweets  : false,
                  onlyRetweets : false,
                  hasGeo       : false,
                  hasMedia     : false,
                  dateTo,
                  dateFrom
                }
              ],
              tagId,
              userToken : uToken
            }
          };

        }
      },
      REQUEST_COUNT =
      {
        endPoint : '1.0/result/count',
        request  : function({ uToken, tagId, hasGeo }) {
          const now    = new Date(),
              dateTo   = _util.date.formatForChart(now).slice(0, -3),
              dateFrom = _util.date.formatForChart(new Date(now.setHours(now.getHours() - 2))).slice(0, -3);

          return {
            request : {
              appToken    : _APP_TOKEN,
              cloudType   : '',
              returnLimit : '10',
              searchLimit : '10',
              filters     : [
                {
                  include      : '',
                  canInclude   : '',
                  exclude      : '',
                  includeUser  : '',
                  excludeUser  : '',
                  excludeUrl   : '',
                  includeUrl   : '',
                  IncludeNlp   : '',
                  dataSources  : '',
                  sentiment    : '',
                  hasRetweets  : false,
                  onlyRetweets : false,
                  hasGeo,
                  hasMedia     : false,
                  dateTo,
                  dateFrom
                }
              ],
              tagId,
              userToken : uToken
            }
          };
        }
      };
  /**
   * The $results service
   *
   * @class $results
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
      /*eslint-enable dot-notation*/
      _APP_TOKEN = _config.get('appToken');
    },

    /**
     * Gets a list of all sources with counts
     *
     * @method getSourceCounts
     * @public
     * @param  {String} options.uToken  User Token
     * @param  {Number} options.timeout Timeout of the call
     * @return {Object}                 Promise Object
     */
    getSourceCounts : function({ uToken, tagId, timeout }) {
      const $defer = $.Deferred(),
          done = (data) => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;
            if (typeof data === 'object') {
              $defer.resolve(data);
            } else {
              _util.log('$sources : getSourceCounts : Getting sources list for ' + uToken + ' failed. Data wasnt an object ');
              $defer.reject();
            }
          },
          data = JSON.stringify(REQUEST_DATASOURCES.request({ uToken, tagId })),
          endPoint = REQUEST_DATASOURCES.endPoint,
          fail = function(err) {
            _util.log('$sources : getSourceCounts : Getting sources for ' + uToken + ' failed. status: ' + err.statusText);
            $defer.reject();
          };

      _request.post({ endPoint, data, done, fail, timeout });
      return $defer.promise();
    },

   /**
     * Gets message count
     *
     * @method getCount
     * @public
     * @param  {Object} options Object with options
     *   @param  {String} options.uToken  User Token
     *   @param  {String} options.tagId   Tag id of the tag id results we want
     *   @param  {Number} options.timeout Timeout of the call
     *   @param  {Boolean} options.hasGeo Flag for geo messages. if True will return only the count of geo messages
     * @return {Object}                 Promise Object
     */
    getCount : function({ uToken, tagId, timeout, hasGeo }) {
      const $defer = $.Deferred(),
          done = (data) => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;
            if (typeof data === 'object') {
              $defer.resolve(data);
            } else {
              _util.log('$sources : getCount : Get Count for ' + uToken + ' failed. Data wasnt an object ');
              $defer.reject();
            }
          },
          data = JSON.stringify(REQUEST_COUNT.request({ uToken, tagId, hasGeo })),
          endPoint = REQUEST_COUNT.endPoint,
          fail = function(err) {
            _util.log('$sources : getCount : Get Count for ' + uToken + ' failed. status: ' + err.statusText);
            $defer.reject();
          };
      _request.post({ endPoint, data, done, fail, timeout });
      return $defer.promise();
    },

    /**
     * Gets sentiment result data from BE
     *
     * @method getSentiment
     * @public
     * @param  {Object} options           Object explained below
     *   @param  {String} options.uToken  User token making the request
     *   @param  {String} options.tagId   Tag id of the tag id results we want
     *   @param  {Number} options.timeout Number in milliseconds for timing out the request
     * @return {Object}                 Returns promise
     */
    getSentiment : function({ uToken, tagId, timeout }) {
      const $defer = $.Deferred(),
          done = (data) => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;
            if (typeof data === 'object') {
              $defer.resolve(data);
            } else {
              _util.log('$results : getSentiment : Getting sentiments for ' + uToken + ' failed. Data wasnt an object ');
              $defer.reject();
            }
          },
          data = JSON.stringify(REQUEST_SENTIMENT.request({ uToken, tagId })),
          endPoint = REQUEST_SENTIMENT.endPoint,
          fail = function(err) {
            _util.log('$results : getSentiment : Getting sentiments for ' + uToken + ' failed. status: ' + err.statusText);
            $defer.reject();
          };
      _request.post({ endPoint, data, done, fail, timeout });
      return $defer.promise();
    },

    /**
     * Gets results data from BE API about a tag id and the type of data
     *
     * @method getCloud
     * @public
     * @param  {Object} options    Object described below
     *   @param  {String} options.type    Type of data we want to fetch from BE. ex. topics, users, hashtag...
     *   @param  {[type]} options.uToken  User token making the request
     *   @param  {[type]} options.tagId   Tag id of the tag id results we want
     *   @param  {[type]} options.timeout Number in milliseconds for timing out the request
     * @return {Object}                 Returns promise
     */
    getCloud : function({ type, uToken, tagId, timeout }) {
      const $defer = $.Deferred(),
          done = (data) => {
            data = (typeof data === 'string' && data.length > 0) ? JSON.parse(data) : data;
            if (typeof data === 'object') {
              $defer.resolve(data);
            } else {
              _util.log('$results : getCloud : Getting ' + type + ' for ' + uToken + ' failed. Data wasnt an object ');
              $defer.reject();
            }
          },
          data = JSON.stringify(REQUEST_CLOUD.request({ uToken, tagId, type })),
          endPoint = REQUEST_CLOUD.endPoint,
          fail = function(err) {
            _util.log('$results : getCloud : Getting ' + type + ' for ' + uToken + ' failed. status: ' + err.statusText);
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
      _server.events.on('getSourcesCount', ({ uToken, tagId, timeout }) => {
        this.getSourceCounts({ uToken, tagId, timeout }).done(
          (data) => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;
            _server.events.trigger(sckt.id, 'gotSourcesCount_' + tagId, data);
          })
        .fail(() => {
          _util.log('$results : Event getSourcesCount : Couldnt find the requested page.');
        });
      });

      _server.events.on('getCount', ({ uToken, tagId, timeout, hasGeo }) => {
        hasGeo = !!hasGeo;
        this.getCount({ uToken, tagId, timeout, hasGeo }).done(
          (data) => {
            const eName = (hasGeo) ? 'gotCountGeo_' : 'gotCount_';

            data = (typeof data === 'string') ? JSON.parse(data) : data;
            _server.events.trigger(sckt.id, eName + tagId, data);
          })
        .fail(() => {
          _util.log('$results : Event getCount : Couldnt find the requested page.');
        });
      });

      _server.events.on('getSentiment', ({ uToken, tagId, timeout }) => {
        this.getSentiment({ uToken, tagId, timeout }).done(
          (data) => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;
            _server.events.trigger(sckt.id, 'gotSentiment_' + tagId, data);
          })
        .fail(() => {
          _util.log('$results : Event getSentiment : Couldnt find the requested page.');
        });
      });

      _server.events.on('getCloud', ({ type, uToken, tagId, timeout }) => {
        this.getCloud({ type, uToken, tagId, timeout }).done(
          (data) => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;
            _server.events.trigger(sckt.id, 'gotCloud_' + tagId, data);
          })
        .fail(() => {
          _util.log('$results : Event getCloud : Couldnt find the requested page.');
        });
      });
    }

  };
});
export default $results;
