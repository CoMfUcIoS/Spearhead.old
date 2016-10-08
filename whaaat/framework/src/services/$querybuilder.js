/**
 * @module framework
 * @submodule $querybuilder
 * @namespace framework
 *
 * @returns {Object} service component
 */

import $ from 'jquery-deferred';

const $querybuilder = (function() {
  let _util,
      _obj,
      _config,
      _server,
      _request,
      _TAG_CRUD_QUERY,
      _APP_TOKEN,

      /**
       * Define all of the requests to be made with each endpoint defined.
       * @type {Object}
       */
      REQUEST_DETAILS = {
        endPoint : '1.0/tag/details',
        request  : ({ uToken, tagId }) => {
          return {
            request : {
              userToken : uToken,
              tagId,
              appToken  : _APP_TOKEN
            }
          };
        }
      },
      REQUEST_CREATE = {
        endPoint : '1.0/tag/create',
        request  : ({ uToken, tag }) => {
          const ruleJson = _generateRuleJson(tag.queryData);
          return {
            request : _obj.merge(_obj.merge({
              userToken : uToken,
              appToken  : _APP_TOKEN,
              ruleJson
            }, tag), _TAG_CRUD_QUERY)
          };
        }
      },
      REQUEST_VALIDATE = {
        endPoint : '1.0/tag/validate',
        request  : ({ uToken, query }) => {
          return {
            request : {
              appToken  : _APP_TOKEN,
              userToken : uToken,
              query
            }
          };
        }
      },
      REQUEST_HISTORICCOUNT = {
        endPoint : '1.0/tag/historic/count',
        request  : ({ uToken, search }) => {
          const { historicalStartDate, historicalEndDate, query } = search;
          return {
            request : {
              appToken  : _APP_TOKEN,
              userToken : uToken,
              historicalStartDate,
              historicalEndDate,
              query
            }
          };
        }
      },
      REQUEST_HISTORICALDATA = {
        endPoint : '1.0/tag/historic/data',
        request  : ({ uToken, search }) => {
          const { historicalStartDate, historicalEndDate, query, containsType } = search;
          return {
            request : {
              appToken  : _APP_TOKEN,
              userToken : uToken,
              historicalStartDate,
              historicalEndDate,
              containsType,
              query
            }
          };
        }
      },
      REQUEST_UPDATE = {
        endPoint : '1.0/tag/update',
        request  : ({ uToken, tag, tagId }) => {
          const ruleJson = _generateRuleJson(tag.queryData);
          return {
            request : _obj.merge(_obj.merge({
              userToken : uToken,
              appToken  : _APP_TOKEN,
              ruleJson,
              tagId
            }, tag), _TAG_CRUD_QUERY)
          };
        }
      },
      REQUEST_FACEBOOK = {
        endPoint : '1.0/engagement/facebook/validate_page',
        request  : ({ uToken, query }) => {
          return {
            request : {
              userToken      : uToken,
              appToken       : _APP_TOKEN,
              facebookPageId : query
            }
          };
        }
      };

  /**
   * Takes the current queries and the queryArrangement and loops through the data
   * to create a json string that is used by the API to generate the sources on the
   * Tag.
   *
   * @method  _generateRuleJson
   * @private
   * @param  {Object} queryData     The object containing the queries and queryArrangement from the state on the frontend
   * @return {Object}               The json object with formatted operation, query and source
   */
  function _generateRuleJson(queryData) {
    const { queries, queryArrangement } = queryData;

    let json = {
          operation : '',
          query     : [],
          source    : ''
        },
        queryLength = queries.length,
        _query = Array.isArray(queries) && _obj.get(queries[0], 'query', [{}, {}, {}]),
        [source, contentType, value] = _query; //eslint-disable-line no-unused-vars

    json.source = source.path;
    json.query = _getFormattedQueryArray(queries, queryLength);
    json.operation = _getFormattedQueryOperation(queryArrangement, queryLength);

    return JSON.stringify(json);
  }

  /**
   * Part of the _generateRuleJson function that is responsible for generating the query array
   * in the overall json object. Loops through the queries and genertates a string for how each
   * one should match the other.
   * TODO : MM : Build in the brackets functionality as this may change the strings.
   *
   * @method getFormattedQueryArray
   * @private
   * @param  {Object} queries     The Queries object from the state that contains all the queries that have been added as components
   * @param  {Number} queryLength The length of the queries array for looping through the array;
   * @return {Array}              Returns the Array of query object string with how each component matches the other
   */
  function _getFormattedQueryArray(queries, queryLength) {
    let array = [],
        i = 0,
        id = 1,
        _value,
        entryVal = '',
        tags,
        condition,
        path,
        field;

    for (i; i < queryLength; i++) {
      const [source, contentType, value] = _obj.get(queries[i], 'query', [{}, {}, {}]); //eslint-disable-line no-unused-vars
      _value = _util.object.get(value, 'value');

      if (_value.matcher === 'or') {
        condition = 'contains_any';
      } else {
        condition = 'contains_all';
      }

      if (source.id === 'twitterfilter') {
        switch (contentType.path) {
          case 'author' :
            path = 'username';
            break;
          case 'content' :
            path = 'tweet';
            break;
          case 'geo' :
            path = 'geo_box';
            break;
          default:
            path = contentType.path;
        }
      } else {
        path = contentType.path;
      }

      field = source.path + '.' + path;

      if (contentType.id !== 'geo-input' && contentType.id !== 'geo_box-input') {
        tags = _util.object.get(_value, 'tags');
        entryVal = (_util.toType(tags) !== 'undefined') ? tags.join(',') : '';

      } else if (_value.type === 'rectangle') {

        field += (contentType.id !== 'geo_box-input') ? '.geo_box' : '';
        entryVal = `${_value.bounds.northEast.lat},${_value.bounds.northEast.lng}:${_value.bounds.southWest.lat},${_value.bounds.southWest.lng}`;
      } else if (_value.type === 'circle') {
        field += '.radius';
        entryVal = `${_value.center.lat},${_value.center.lng}:${_value.radius / 1000}`;
      } else if (_value.type === 'polygon') {
        field += '.polygon';
        _value.path.forEach((point) => { //eslint-disable-line
          entryVal += `${point.lat},${point.lng}:`;
        });
        entryVal = entryVal.substring(0, entryVal.length - 1);
      }
      array.push({
        condition,
        field,
        id,
        value : entryVal
      });

      id++;
    }

    return array;
  }

  /**
   * Part of the _generateRuleJson function that is responsible for generating the operation
   * string. Loops through the queries and using the matcher determines how each component matches
   * the other.
   *
   * @method  getFormattedQueryOperation
   * @private
   * @param  {Array}  queryArrangement   An array of the sources with a value for each query within
   * @param  {Number} queryLength        The number of queries currently on the state
   * @return {String}                    The operation string
   */
  function _getFormattedQueryOperation(queryArrangement, queryLength) {
    let j,
        key,
        value,
        join,
        query,
        id = 1,
        count = 1,
        operation = '';

    for (key in queryArrangement) {
      value = queryArrangement[key];
      for (j = 0; j < value.length; j++) {
        query = value[j];
        operation += id;
        join = _util.toType(query.join) === 'string' ? query.join : _obj.get(query.join, 'value', '');

        if (j < value.length - 1) {
          operation += ' ' + join.toUpperCase() + ' ';
        }

        id++;
      }

      if (count < queryLength) {
        operation += ' OR ';
      }

      count++;
    }

    if (operation.substr(operation.length - 3) === 'OR ') {
      return operation.substring(0, operation.length - 4);
    } else {
      return operation;
    }

  }

  /**
   * The $querybuilder service
   *
   * @class $querybuilder
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
      _obj     = _util.object;
      _config  = requires['config'];
      _server  = requires['server'];
      _request = requires['$request'];
      /*eslint-enable dot-notation*/

      _APP_TOKEN = _config.get('appToken');
      _TAG_CRUD_QUERY = _config.get('tagCRUDQuery');
    },

    /**
     * Gets the tags details from the tagId passed in.
     *
     * @method  detail
     * @public
     * @param  {String} uToken              The Users Unique Token.
     * @param  {Number} tagId               The tags id as a number
     * @param  {Number} timeout             A number to decide after what time the function should fail.
     * @return {Object}                     An object containing the Success/Error Message.
     */
    detail : function({ uToken, tagId, timeout }) {
      const $defer = $.Deferred(),
          done = data => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;

            if (typeof data === 'object') {
              $defer.resolve(data);
            } else {
              $defer.reject();
            }
          },
          data = JSON.stringify(REQUEST_DETAILS.request({ uToken, tagId })),
          endPoint = REQUEST_DETAILS.endPoint,
          fail = err => {
            _util.log('$querybuilder : create : Creating Querybuilder tag failed. status: ' + err);
            $defer.reject(err);
          };

      _request.post({ endPoint, data, done, fail, timeout });
      return $defer.promise();
    },

    /**
     * Creates the tag from the query passed in.
     *
     * @method  create
     * @public
     * @param  {String} uToken              The Users Unique Token.
     * @param  {Object} tag                 An Object of all the elements of the tag.
     *    @param  {String}  tag.description           The description of the tag.
     *    @param  {Boolean} tag.historical            Wether the tag is Historical or not.
     *    @param  {String}  tag.historicalEndDate     The End Date to limit the historical search to.
     *    @param  {String}  tag.historicalStartDate   The Start Date to limit the historical search to.
     *    @param  {[type]}  tag.jcsdl                 TODO : MM : jcsdl param description
     *    @param  {Array}   tag.keywordList           The array of keyword strings.
     *    @param  {String}  tag.keywordListOperator   The comparator for the keywords ('or', 'and')
     *    @param  {String}  tag.priority              The priotity string ('high', 'low')
     *    @param  {Number} tag.projectId             The Id of the project the tag is assigned to.
     *    @param  {String}  tag.query                 The query that the search will use to pull back messages
     *    @param  {Boolean} tag.realtime              Wether the tag is using realtime data.
     *    @param  {String}  tag.tagTitle              The Name of the tag
     * @param  {Number} timeout            A number to decide after what time the function should fail.
     * @return {Object}                     An object containing the Success/Error Message.
     */
    create : function({ uToken, tag, timeout }) {
      const $defer = $.Deferred(),
          done = data => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;

            if (typeof data === 'object') {
              $defer.resolve(data);
            } else {
              $defer.reject();
            }
          },
          data = JSON.stringify(REQUEST_CREATE.request({ uToken, tag })),
          endPoint = REQUEST_CREATE.endPoint,
          fail = err => {
            _util.log(JSON.stringify(err));
            _util.log('$querybuilder : create : Creating Querybuilder tag failed. status: ' + err.statusText);
            $defer.reject();
          };
      console.log(data);
      _request.post({ endPoint, data, done, fail, timeout });
      return $defer.promise();
    },

    /**
     * Validates the query passed in by looping through its components.
     *
     * @method  validate
     * @public
     * @param  {String} uToken              The Users Unique Token.
     * @param  {Object} query               An Object of all the elements of the query.
     *    @param  {Array} queries              An Array of objects of all the components of the query.
     *    @param  {Object} queryArrangement    An Object of the sources with uuid and the join method.
     * @param  {Number} timeout             A number to decide after what time the function should fail.
     * @return {Object}                     An object containing the Success/Error Message.
     */
    validate : function({ uToken, query, timeout }) {
      const $defer = $.Deferred(),
          done = data => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;

            if (typeof data === 'object') {
              $defer.resolve(data);
            } else {
              $defer.reject();
            }
          },
          data = JSON.stringify(REQUEST_VALIDATE.request({ uToken, query })),
          endPoint = REQUEST_VALIDATE.endPoint,
          fail = err => {
            _util.log(JSON.stringify(err));
            _util.log('$querybuilder : validate : Validating Querybuilder query failed. status: ' + err.statusText);
            $defer.reject();
          };

      _request.post({ endPoint, data, done, fail, timeout });
      return $defer.promise();
    },

    /**
     * Gets the number of historical results depending on the query and the time frame passed in.
     *
     * @method getHistoricCount
     * @public
     * @param  {String} uToken              The Users Unique Token.
     * @param  {Object} search                 An Object of all the elements of the search.
     *    @param  {String} historicalEndDate   The End Date to limit the historical search to.
     *    @param  {String} historicalStartDate The Start Date to limit the historical search to.
     *    @param  {String} matcher             The switch between 'or' and 'and' for comparing the data.
     *    @param  {String} query               The query that the search will use to pull back messages
     * @param  {Number} timeout            A number to decide after what time the function should fail.
     * @return {String}                     The number of results formatted.
     */
    getHistoricCount : function({ uToken, search, timeout }) {
      const $defer = $.Deferred(),
          done = data => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;

            if (typeof data === 'object') {
              $defer.resolve(data);
            } else {
              $defer.reject();
            }
          },
          data = JSON.stringify(REQUEST_HISTORICCOUNT.request({ uToken, search })),
          endPoint = REQUEST_HISTORICCOUNT.endPoint,
          fail = err => {
            _util.log('$querybuilder : getHistoricCount : Getting Querybuilder Historic Count failed. status: ' + err.statusText);
            $defer.reject();
          };

      _request.post({ endPoint, data, done, fail, timeout });
      return $defer.promise();
    },

    /**
     * Gets data needed to populate a graph of dates and numbers for the historical search
     *
     * @method getHistoricalData
     * @public
     * @param  {String} uToken              The Users Unique Token.
     * @param  {Object} search                 An Object of all the elements of the search.
     *    @param  {String} historicalEndDate   The End Date to limit the historical search to.
     *    @param  {String} historicalStartDate The Start Date to limit the historical search to.
     *    @param  {String} matcher             The switch between 'or' and 'and' for comparing the data.
     *    @param  {String} query               The query that the search will use to pull back messages
     * @param  {Number} timeout            A number to decide after what time the function should fail.
     * @return {String}                     The number of results formatted.
     */
    getHistoricalData : function({ uToken, search, timeout }) {
      const $defer = $.Deferred(),
          done = data => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;

            if (typeof data === 'object') {
              $defer.resolve(data);
            } else {
              $defer.reject();
            }
          },
          data = JSON.stringify(REQUEST_HISTORICALDATA.request({ uToken, search })),
          endPoint = REQUEST_HISTORICALDATA.endPoint,
          fail = err => {
            _util.log('$querybuilder : getHistoricalData : Getting Querybuilder Historical data failed. status: ' + err.statusText);
            $defer.reject();
          };

      _request.post({ endPoint, data, done, fail, timeout });
      return $defer.promise();
    },

    /**
     * Updates a tag with the ID passed in.
     *
     * @method update
     * @public
     * @param  {String} uToken              The Users Unique Token.
     * @param  {Object} tag                 An Object of all the elements of the tag.
     *    @param  {String} description         The description of the tag.
     *    @param  {[type]} jcsdl               TBD
     *    @param  {Number} projectId          The Id of the project the tag is assigned to.
     *    @param  {[type]} priority            TBD
     *    @param  {Number} tagId              The Id of the tag to update.
     *    @param  {String} tagTitle            The Name of the tag
     * @param  {Number} timeout            A number to decide after what time the function should fail.
     * @return {Object}                     An object containing the Success/Error Message.
     */
    update : function({ uToken, tag, timeout, tagId }) {
      const $defer = $.Deferred(),
          done = data => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;

            if (typeof data === 'object') {
              $defer.resolve(data);
            } else {
              $defer.reject();
            }
          },
          data = JSON.stringify(REQUEST_UPDATE.request({ uToken, tag, tagId })),
          endPoint = REQUEST_UPDATE.endPoint,
          fail = err => {
            _util.log('$querybuilder : update : Updating Querybuilder tag failed. status: ' + err.statusText);
            $defer.reject();
          };
      _request.post({ endPoint, data, done, fail, timeout });
      return $defer.promise();
    },

    /**
     * Finds the relevant Facebook Page from the ID passed in.
     *
     * @method facebook
     * @public
     * @param  {String} uToken       The Users Unique Token.
     * @param  {Object} query           The Facebook page query to search by.
     * @param  {Number} timeout      A number to decide after what time the function should fail.
     * @return {Object}              An object containing the Success/Error Message.
     */
    facebook : function({ uToken, query, timeout }) {
      const $defer = $.Deferred(),
          done = data => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;

            if (typeof data === 'object') {
              $defer.resolve(data);
            } else {
              $defer.reject();
            }
          },
          data = JSON.stringify(REQUEST_FACEBOOK.request({ uToken, query })),
          endPoint = REQUEST_FACEBOOK.endPoint,
          fail = err => {
            _util.log('$querybuilder : facebook : Finding facebook page failed. status: ' + err);
            $defer.reject(err);
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
      _server.events.on('getTagQuery', ({ uToken, tagId, timeout }) => {
        this.detail({ uToken, tagId, timeout }).done(
          (data) => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;
            _server.events.trigger(sckt.id, 'gotTagQuery', data);
          })
        .fail(() => {
          _util.log('$queryBuilder : Event getTagQuery : Couldnt find the details for this Tag.');
        });
      });

      _server.events.on('createQuerybuilderTag', ({ uToken, tag, timeout }) => {
        this.create({ uToken, tag, timeout }).done(
          (data) => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;
            _server.events.trigger(sckt.id, 'createdQuerybuilderTag', data);
          })
        .fail(() => {
          _util.log('$queryBuilder : Event createQuerybuilderTag : Couldnt create the Querybuilder Tag.');
        });
      });

      _server.events.on('validateQuerybuilderComponent', ({ uToken, query, timeout }) => {
        _util.log(query);
        this.validate({ uToken, query, timeout }).done(
          (data) => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;
            _server.events.trigger(sckt.id, 'validatedQuerybuilderComponent', data);
          })
        .fail(() => {
          _util.log('$queryBuilder : Event validateQuerybuilderComponent : Couldnt validate the Querybuilder Component.');
        });
      });

      _server.events.on('getQuerybuilderHistoricCount', ({ uToken, search, timeout }) => {
        this.getHistoricCount({ uToken, search, timeout }).done(
          (data) => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;
            _server.events.trigger(sckt.id, 'gotQuerybuilderHistoricCount', data);
          })
        .fail(() => {
          _util.log('$queryBuilder : Event getQuerybuilderHistoricCount : Couldnt get the Querybuilder Historic Count.');
        });
      });

      _server.events.on('updateQuerybuilderTag', ({ uToken, tag, timeout, tagId }) => {
        this.update({ uToken, tag, timeout, tagId }).done(
          (data) => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;
            _server.events.trigger(sckt.id, 'updatedQuerybuilderTag', data);
          })
        .fail(() => {
          _util.log('$queryBuilder : Event updateQuerybuilderTag : Couldnt update the Querybuilder Tag.');
        });
      });

      _server.events.on('getFacebookDetails', ({ uToken, query, timeout }) => {
        this.facebook({ uToken, query, timeout }).done(
          (data) => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;
            _server.events.trigger(sckt.id, 'gotFacebookDetails', data);
          })
        .fail((err) => {
          _util.log('$queryBuilder : Event getFacebookDetails : Couldnt find the requested page. status : ' + err);
        });
      });


      _server.events.on('getHistoricalData', ({ uToken, search, timeout }) => {
        this.getHistoricalData({ uToken, search, timeout }).done(
          (data) => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;
            _server.events.trigger(sckt.id, 'gotHistoricalData', data);
          })
        .fail(() => {
          _util.log('$queryBuilder : Event getHistoricalData : Couldnt get the Querybuilder Historical Data.');
        });
      });
    }
  };
});

export default $querybuilder;
