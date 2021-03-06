/**
 * @module framework
 * @submodule api
 * @namespace framework
 *
 * @return {Object} Module component
 */
const api = function() {
  const _USERS_CONFIG = {};

  let _util,
      _obj,
      _server,
      _eventsIO,
      $sim,
      _endPointCb;

  /*!
   * Will take an input of an array, sort the array
   * from low to high then get the last element of
   * the array and add 1 to the number.
   *
   * @method _getNextId
   * @private
   * @param  {Array}    array     This is the array to sort and get the last element of
   * @return {Number}   id        This is the id that is passed back after adding one to last element of the array.
   */
  function _getNextId(array) {
    let id = array.sort((a, b) => {
      return a - b;
    }).pop();

    id += 1;
    return id;
  }

  /*!
   * Will prepare the data ready for the simulator to
   * generate a new tag once data is ready call the
   * $sim.createTag function. If data is not valid
   * return a fail object from the API.
   *
   * TODO : MM : Add additonal functionality for if historical
   *
   * @method _prepareCreateTag
   * @private
   * @param  {Object}    request     The request object sent from the API with the data.
   * @param  {Object}    respond     The respond object sent from the API to return the success/fail object.
   * @return {Boolean}               Returns true after the respond has assigned the json object.
   */
  function _prepareCreateTag({ request, respond }) {
    const tags = $sim.getData('companyTags') || [],
        body = JSON.parse(JSON.parse(request.body)),
        fail   = {
          success : false
        };
    let tagIdArray = [],
        data,
        i,
        newId;

    for (i = tags.length - 1; i >= 0; i--) {
      tagIdArray.push(tags[i].TagId);
    }

    newId = _getNextId(tagIdArray);

    if (_util.toType(body) === 'object') {
      data = _obj.get(body, 'request', false);

      if (newId && _obj.get(data, 'userToken', false) && _obj.get(data, 'appToken', false)) {
        $sim.createTag({
          tagId    : newId,
          tagTitle : data.tagTitle
        });
        respond.json({ success : true });
      } else {
        respond.json(fail);
      }
    } else {
      respond.json(fail);
    }

    return true;
  }

  /*!
   * Contains all the cb for our API
   *
   * @type {Object}
   *
   * TODO: IK: Maybe we need to make the endpoints config driven ??? Or better make for each on a different file ?
   */
  _endPointCb = {
    '/1.0/trendv2/getTrends' : function({ request, respond }) {
      const body = JSON.parse(JSON.parse(request.body));

      if (typeof body === 'object' &&
          _obj.get(body, 'request.id', false)) {
        const data = $sim.getData('globalTrends') || [],
            trends = {
              maps : {
                KEYWORDS : data.sort((a, b) => a.avgCount < b.avgCount)
              }
            };
        respond.json(trends);
      } else {
        respond.json(
          {
            success : false
          }
        );
      }
    },
    '/1.0/trend/latest/minute' : function({ request, respond }) {

      const body = JSON.parse(JSON.parse(request.body));
      let trendsData = null,
          data,
          trends;

      if (typeof body === 'object') {
        trendsData =  (typeof body.request.tagId !== 'undefined') ? 'trends_' + body.request.tagId : 'companyTrends';
        data = $sim.getData(trendsData) || [];
        trends = {
          results : data.sort((a, b) => a.average < b.average),
          success : true
        };

        respond.json(trends);
      } else {
        respond.json(
          {
            success : false
          }
          );
      }
    },
    '/1.0/traffic/tagV2' : function({ request, respond }) {
      const body = (typeof request.body === 'string') ? JSON.parse(JSON.parse(request.body)) : 0;
      let trafficChart = null,
          data,
          response;

      if (typeof body === 'object') {
        trafficChart = (typeof _obj.get(body, 'request.tagId') !== 'undefined') ? 'trafficChart_' + body.request.tagId : null;
        if (!trafficChart) {
          return false;
        }
        data = $sim.getData(trafficChart) || [];
        response = {
          results : data,
          success : true
        };
        respond.json(response);
      } else {
        respond.json(
          {
            success : false
          }
          );
      }

      return true;
    },
    '/1.0/tag/companies' : function({ request, respond }) {
      const data = $sim.getData('companyTags') || [],
          response = {
            results : data,
            success : true
          };

      respond.json(response);

      return true;
    },
    '/1.0/user/configurations/get' : function({ request, respond }) {
      const body = JSON.parse(JSON.parse(request.body)),
          fail   = {
            success : false
          };

      if (_util.toType(body) === 'object') {

        const userToken = _obj.get(body, 'request.userToken', false);
        if (userToken) {
          const data        = _obj.get(_USERS_CONFIG, userToken, {}),
              config = {
                success : true,
                config  : JSON.stringify(data)
              };
          respond.json(config);
        } else {
          respond.json(fail);
        }
      } else {
        respond.json(fail);
      }
    },
    '/1.0/user/configurations/update' : function({ request, respond }) {
      const body = JSON.parse(JSON.parse(request.body)),
          fail   = {
            success : false
          };

      if (_util.toType(body) === 'object') {

        const userToken = _obj.get(body, 'request.userToken', false),
            data      = _obj.get(body, 'request.config', false);
        if (userToken && data) {
          _obj.set(_USERS_CONFIG, userToken, data);
          respond.json({
            success : true
          });
        } else {
          respond.json(fail);
        }
      } else {
        respond.json(fail);
      }
    },
    '/1.0/tag/create'             : _prepareCreateTag,
    '/1.0/tag/createGnipHistoric' : _prepareCreateTag,
    '/1.0/tag/historic/count'     : ({ request, respond }) => {
      const body = JSON.parse(JSON.parse(request.body)),
          fail   = {
            success : false
          },
          data = _obj.get(body, 'request', false);
      let results;

      if (_util.toType(body) === 'object' &&
        _util.toType(data) === 'object' &&
        _obj.get(data, 'userToken', false) &&
        _obj.get(data, 'appToken', false)
      ) {

        results = $sim.generateHistoricalCount({
          search : _obj.get(data, 'search')
        });

        respond.json({
          success : true,
          results
        });
      } else {
        respond.json(fail);
      }
    },
    '/1.0/tag/update' : ({ request, respond }) => {
      const body = JSON.parse(JSON.parse(request.body)),
          fail   = {
            success : false
          },
          data = _obj.get(body, 'request', false),
          tag = _obj.get(data, 'tag', false);

      if (_util.toType(body) === 'object' &&
        _util.toType(data) === 'object' &&
        _obj.get(data, 'userToken', false) &&
        _obj.get(data, 'appToken', false) &&
        _obj.get(data, 'tag', false)
      ) {

        $sim.updateTag({
          description : _obj.get(tag, 'description'),
          jcsdl       : _obj.get(tag, 'jcsdl'),
          priority    : _obj.get(tag, 'priority'),
          projectId   : _obj.get(tag, 'projectId'),
          tagId       : _obj.get(tag, 'tagId'),
          tagTitle    : _obj.get(tag, 'tagTitle')
        });

        respond.json({ success : true });
      } else {
        respond.json(fail);
      }
    },
    defaultCb : function({ respond }) {
      respond.json({ success : false });
    }
  };

  /*!
   * For each endPoint and method creates a route in server
   *
   * @method _setApiEndPoints
   * @private
   * @param {Array} endPoints Array contains all endPoints
   */
  function _setApiEndPoints(endPoints) {
    if (Array.isArray(endPoints)) {
      endPoints.forEach((endPoint) => {
        let cb = _endPointCb[endPoint.uri] || _endPointCb.defaultCb;
        _server[endPoint.method](endPoint.uri, cb);
      });
    }
  }

  /**
   * The api component
   *
   * @class api
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
      'server',
      '$sim'
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
      _util     = requires['util'];
      _server   = requires['server'];
      $sim      = requires['$sim'];
      _obj      = _util.object;
      _eventsIO = _server.events;
      /*eslint-enable dot-notation*/
    },

    /**
     * Starts the RESTful API for the Simulator
     *
     * @method  start
     * @public
     */
    start : function() {
      // Initialize the server
      _server.initialize();

      _setApiEndPoints([
        {
          uri    : '/test',
          method : 'get'
        },
        {
          uri    : '/1.0/trendv2/getTrends',
          method : 'post'
        },
        {
          uri    : '/1.0/trend/latest/minute',
          method : 'post'
        },
        {
          uri    : '/1.0/trendv2/getTrends',
          method : 'get'
        },
        {
          uri    : '/1.0/traffic/tagV2',
          method : 'post'
        },
        {
          uri    : '/1.0/tag/companies',
          method : 'post'
        },
        {
          uri    : '/1.0/user/configurations/get',
          method : 'post'
        },
        {
          uri    : '/1.0/user/configurations/update',
          method : 'post'
        },
        {
          uri    : '/1.0/tag/create',
          method : 'post'
        },
        {
          uri    : '/1.0/tag/historic/count',
          method : 'post'
        },
        {
          uri    : '/1.0/tag/createGnipHistoric',
          method : 'post'
        },
        {
          uri    : '/1.0/tag/update',
          method : 'post'
        }
      ]);

        // Start the server
      _server.start();
    }
  };
};

export default api;
