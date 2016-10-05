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
      _config,
      _request,
      _APP_TOKEN,

      /**
       * Define all of the requests to be made with each endpoint defined.
       * @type {Object}
       */
      REQUEST_CREATE = {
        endPoint : '1.0/tag/create',
        request  : ({ uToken, tag }) => {
          let createRequest = {
            userToken           : uToken,
            appToken            : _APP_TOKEN,
            historical          : false,
            realtime            : tag.historical === 1 ? (tag.realtime === 1) : true,
            description         : tag.description,
            jcsdl               : tag.jcsdl,
            keywordList         : tag.keywordList,
            keywordListOperator : tag.keywordListOperator,
            priority            : tag.priority,
            projectId           : tag.projectId,
            tagTitle            : tag.tagTitle
          };

          if (tag.historical === 1) {
            if (tag.historicalStartDate !== '') {
              createRequest.historicalStartDate += ':00';
            }
            if (tag.historicalEndDate !== '') {
              createRequest.historicalEndDate += ':00';
            }

            createRequest.query = tag.query;
          }

          return {
            request : createRequest
          };
        }
      },
      REQUEST_HISTORICCOUNT = {
        endPoint : '1.0/tag/historic/count',
        request  : ({ uToken, search }) => {
          return {
            request : {
              appToken  : _APP_TOKEN,
              userToken : uToken,
              search
            }
          };
        }
      },
      REQUEST_CREATEHISTORIC = {
        endPoint : '1.0/tag/createGnipHistoric',
        request  : ({ uToken, tag }) => {
          const {
            description,
            historicalLength,
            priority,
            projectId,
            query,
            tagTitle
          } = tag;

          return {
            request : {
              appToken  : _APP_TOKEN,
              userToken : uToken,
              description,
              historicalLength,
              priority,
              projectId,
              query,
              tagTitle
            }
          };
        }
      },
      REQUEST_UPDATE = {
        endPoint : '1.0/tag/update',
        request  : ({ uToken, tag }) => {
          return {
            request : {
              userToken : uToken,
              appToken  : _APP_TOKEN,
              tag
            }
          };
        }
      };

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
      /*eslint-enable dot-notation*/

      _APP_TOKEN = _config.get('appToken');
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
     * Creates a historic search from the query passed in.
     *
     * @method  createHistoric
     * @public
     * @param  {String} uToken              The Users Unique Token.
     * @param  {Object} tag                 An Object of all the elements of the tag.
     *    @param  {String} description         The description of the tag.
     *    @param  {Number} projectId          The Id of the project the tag is assigned to.
     *    @param  {[type]} historicalLength    TBD
     *    @param  {[type]} priority            TBD
     *    @param  {String} query               The query that the search will use to pull back messages
     *    @param  {String} tagTitle            The Name of the tag
     * @param  {Number} timeout            A number to decide after what time the function should fail.
     * @return {Object}                     An object containing the Success/Error Message.
     */
    createHistoric : function({ uToken, tag, timeout }) {
      const $defer = $.Deferred(),
          done = data => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;

            if (typeof data === 'object') {
              $defer.resolve(data);
            } else {
              $defer.reject();
            }
          },
          data = JSON.stringify(REQUEST_CREATEHISTORIC.request({ uToken, tag })),
          endPoint = REQUEST_CREATEHISTORIC.endPoint,
          fail = err => {
            _util.log('$querybuilder : create : Creating Querybuilder tag failed. status: ' + err.statusText);
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
    update : function({ uToken, tag, timeout }) {
      const $defer = $.Deferred(),
          done = data => {
            data = (typeof data === 'string') ? JSON.parse(data) : data;

            if (typeof data === 'object') {
              $defer.resolve(data);
            } else {
              $defer.reject();
            }
          },
          data = JSON.stringify(REQUEST_UPDATE.request({ uToken, tag })),
          endPoint = REQUEST_UPDATE.endPoint,
          fail = err => {
            _util.log('$querybuilder : update : Creating Querybuilder tag failed. status: ' + err.statusText);
            $defer.reject();
          };

      _request.post({ endPoint, data, done, fail, timeout });
      return $defer.promise();
    }
  };
});

export default $querybuilder;
