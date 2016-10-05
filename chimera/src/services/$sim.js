/**
 * @module $sim
 *
 * @return {Object} Service component
 */

import fs    from 'fs';
import path from 'path';
import net  from 'net';
import $    from 'jquery-deferred';
import casual from 'casual';

const $sim = function() {
  const _TRAFFIC_INTERVAL = 60000;
  let _util,
      _config,
      _api,
      _obj,
      _date,
      _configData,
      _modIntervals = {},
      _dummyData = {},
      _NUMBER_OF_TRENDS;

  /*!
   * Gets the ip address of the machine
   *
   * @method  _getNetworkIP
   * @private
   * @param  {Function} callback Function to call after fetching the ip
   */
  function _getNetworkIP(callback) {
    const socket = net.createConnection(80, 'www.repknight.com');
    socket.on('connect', () => {
      callback(undefined, socket.address().address);
      socket.end();
    });
    socket.on('error', (e) => {
      callback(e, 'error');
    });
  }

  /*!
   * Initialize the intervals for the data
   *
   * @method  _initializeIntervals
   * @private
   */
  function _initializeIntervals() {
    // Get configuration
    const intervalsRange = _config.get('simulator.interval') || { from : 1000, to : 10000 },
        dataToRun        = _config.get('simulator.data') || 'ALL';

    // get data from json files
    _configData = _jsonData('../../../data/', dataToRun);

    // Simulate the data change
    Object.keys(_configData).forEach((key) => {
      _startRealTimeFor(key, intervalsRange);
    });

  }

  /*!
   * TODO: IK : WRITE DOCUMENTATION
   * [_generateTrafficData description]
   * @param  {[type]} module [description]
   * @return {[type]}        [description]
   */
  function _generateTrafficData(module) {
    const data      = _dummyData[module],
        trafficData = _obj.get(data, 'traffic', []),
        spikesData  = _obj.get(data, 'spikes', []),
        now         = new Date(),
        // before12h   = new Date(now.setHours(now.getHours() - 12));
        before12h   = new Date(now.setHours(now.getHours() - 1));
    let i,
        j,
        entry,
        el,
        intervalKey,
        intervalId,
        type = 'traffic';

    // generate 12 hours history
    for (i = 0; i < 1; i++) {
      for (j = 0; j < 60; j++) {
        entry = {
          created : _date.formatForChart(before12h.setMinutes(before12h.getMinutes() + 1)),
          count   : _util.random.number(_config.get('simulator.traffic.from'), _config.get('simulator.traffic.to'))
        };
        trafficData.push(entry);
      }
    }

    // generate Random Spikes
    trafficData.forEach((trafficEntry, k) => {
      const spikeCount  = _config.get('simulator.traffic.spike');
      if (k > 0) {
        let spike = Math.abs(trafficData[k - 1].count - trafficEntry.count);
        if (spike >= spikeCount) {
          spikesData.push({
            tag            : '1abcBelfast',
            trafficSpikeId : _util.random.number(0, 1000000),
            created        : trafficEntry.created,
            count          : spikeCount,
            percentage     : _util.random.number(0, 100),
            fromDate       : trafficEntry.created,
            fromTime       : trafficEntry.created.split(' ')[1],
            toTime         : trafficEntry.created.split(' ')[1]
          });
        }
      }
    });

    _obj.set(_dummyData, module + '.traffic', trafficData);
    _obj.set(_dummyData, module + '.spikes', spikesData);

    el = {
      traffic : _obj.get(_dummyData, module + '.traffic'),
      spikes  : _obj.get(_dummyData, module + '.spikes')
    };


    intervalKey =  String(module);
    intervalId = _obj.get(_modIntervals, intervalKey, null);

    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
      // Save timer if we want to stop it later.
    _obj.set(
      _modIntervals,
      intervalKey,
      _changeData(
        {
          el,
          interval : _TRAFFIC_INTERVAL,
          module,
          type
        }
      )
    );
  }

  /*!
   * A Generator function that takes a casual function and a times and
   * creates an array of the random data with a random amount of entries
   *
   * @method _arrayOf
   * @private
   * @param  {Function} generator   The casual function to generate the data.
   * @param  {Number}  times       The number of entries to put into the array, defaults to a random number.
   * @return {Array}                The array of randomised data.
   */
  function _arrayOf(generator, times) {
    let results = [],
        i;

    times = typeof times === 'number' ? casual.integer(0, 50) : times;

    for (i = 0; i <= times; i++) {
      results.push(generator());
    }

    return results;
  }

  /*!
   * Create a new data entry for the Tag passed in, then generate dummy trends and traffic chart data
   *
   * @method _createTag
   * @private
   * @param  {Number}  options.tagId     The Id of the Tag
   * @param  {String}   options.tagTitle  The Tag Title string
   * @return {Boolean}  Returns true
   */
  function _createTag({ tagId, tagTitle }) {
    casual.define('trend', () => {
      return {
        trend   : casual.word + '-' + casual.integer(0, 100),
        tagId   : tagId,
        tag     : casual.words(3),
        angle   : 50.895517012369346,
        average : 7.250000026077039,
        created : casual.date('YYYY-MM-DD') + ' ' + casual.time('HH:mm:ss'),
        history : casual.array_of_doubles(10)
      };
    });

    const intervalsRange = _config.get('simulator.interval') || { from : 1000, to : 10000 },
        dummyTrends = _arrayOf(casual._trend, _NUMBER_OF_TRENDS);

    _obj.set(_dummyData, 'companyTags', {
      TagId       : tagId,
      Tag         : tagTitle,
      active      : true,
      ProjectName : 'Ioannis'
    });

    _obj.set(_configData, 'trends_' + tagId, {
      data   : dummyTrends,
      config : {
        average : 'float',
        history : 'array-float'
      }
    });

    _obj.set(_configData, 'trafficChart_' + tagId, {
      data : {
        spikes  : [],
        traffic : []
      },
      config : {
        count   : 'number',
        created : 'date'
      }
    });

    _startRealTimeFor('trends_' + tagId, intervalsRange);
    _startRealTimeFor('trafficChart_' + tagId, intervalsRange);

    return true;
  }

  /*!
   * Update a data entry for the TagId passed in,
   * then re-generate dummy trends and traffic chart data
   *
   * @method _updateTag
   * @private
   * @param  {String}    description   The tags description as a string  --not currently used
   * @param  {[type]}    jcsdl         TODO : MM : Write jcsdl documentation  --not currently used
   * @param  {String}    priority      The tags priority as a string ('high', 'low')  --not currently used
   * @param  {Number}   projectId     The tags Project Id  --not currently used
   * @param  {Number}   tagId         The tags Id
   * @param  {String}    tagTitle      The tags title as a string
   * @return {Boolean}  Returns true
   */
  function _updateTag({ tagId, tagTitle }) {
    casual.define('trend', () => {
      return {
        trend   : casual.word + '-' + casual.integer(0, 100),
        tagId   : tagId,
        tag     : casual.words(3),
        angle   : 50.895517012369346,
        average : 7.250000026077039,
        created : casual.date('YYYY-MM-DD') + ' ' + casual.time('HH:mm:ss'),
        history : casual.array_of_doubles(10)
      };
    });

    const intervalsRange = _config.get('simulator.interval') || { from : 1000, to : 10000 },
        dummyTrends = _arrayOf(casual._trend, _NUMBER_OF_TRENDS);
    let tagData = _obj.get(_dummyData, 'companyTags');

    tagData = tagData.filter((tag) => {
      return tag['TagId'] === tagId; //eslint-disable-line dot-notation
    })[0];
    tagData.Tag = tagTitle;

    if (_obj.get(_modIntervals, String('trafficChart_' + tagId), false)) {
      clearInterval(_obj.get(_modIntervals, String('trafficChart_' + tagId), false));
    }
    if (_obj.get(_modIntervals, String('trends' + tagId), false)) {
      clearInterval(_obj.get(_modIntervals, String('trends' + tagId), false));
    }


    _obj.set(_configData, 'trends_' + tagId, {
      data   : dummyTrends,
      config : {
        average : 'float',
        history : 'array-float'
      }
    });

    _obj.set(_configData, 'trafficChart_' + tagId, {
      data : {
        spikes  : [],
        traffic : []
      },
      config : {
        count   : 'number',
        created : 'date'
      }
    });

    _startRealTimeFor('trends_' + tagId, intervalsRange);
    _startRealTimeFor('trafficChart_' + tagId, intervalsRange);

    return true;
  }

  /*!
   * Creates an array of random chart data using casual
   *
   * @method _generateHistoricalCount
   * @private
   * @param  {Object} search    The Object that contains the details of the search
   *    @param  {String} search.historicalStartDate    The Date/Time String that starts the chart data
   *    @param  {String} search.historicalEndDate      The Date/Time String that ends the chart data
   *    @param  {String} search.matcher                The comparator to pair the query together ('and', 'or')
   *    @param  {String} search.query                  The String that contains the details of the search
   * @return {Array}                    The array of random chart data.
   */
  function _generateHistoricalCount({ search }) {
    const {
      matcher,
      query
    } = search;

    casual.define('bar', () => {
      return {
        count : casual.integer(0, 100),
        date  : casual.date('YYYY-MM-DD') + 'T' + casual.time('HH:mm:ss.SSS') + 'Z'
      };
    });

    _dummyData['historicCount_' + matcher + ':' + query] = _arrayOf(casual._bar);

    return _dummyData['historicCount_' + matcher + ':' + query];
  }

  /*!
   * Sets the interval to change the data
   *
   * @method _changeData
   * @private
   * @param  {Object} options.el       The data to be changed
   * @param  {Number} options.interval Interval on ms
   * @return {Object}                  Interval object
   */
  function _changeData({ el, interval, module, type }) {
    const config   = _obj.get(_configData, module + '.config'),
        changeKeys = (config && typeof config === 'object') ? Object.keys(config) : [];

    // Run the interval.
    if (typeof type === 'undefined') {
      return setInterval(() => {
        Object.keys(el).forEach((key) => {
          let keyType = _obj.get(config, key);
          if (changeKeys.indexOf(key) >= 0) {
            _changeKey({ el, key, keyType });
          }
        });

        let elementIndex = _dummyData[module].indexOf(el);
        if (elementIndex > 0) {
          _dummyData[module][elementIndex] = el;
        }
      }, interval);
    }


    if (Array.isArray(_dummyData[module][type])) {
      return setInterval(() => {
        if (type === 'traffic') {
          const spikeCount  = _config.get('simulator.traffic.spike');

           /*eslint-disable dot-notation*/
          let created = _date.formatForChart(new Date()),
              count = _util.random.number(_config.get('simulator.traffic.from'), _config.get('simulator.traffic.to')),
              trafficLength = _dummyData[module]['traffic'].length,
              spike = Math.abs(_dummyData[module]['traffic'][trafficLength - 1].count - count);

          _dummyData[module]['traffic'].shift();
          _dummyData[module]['spikes'].shift();

          _dummyData[module]['traffic'].push({
            count,
            created
          });

          if (spike >= spikeCount) {
            _dummyData[module]['spikes'].push({
              tag            : '1abcBelfast',
              trafficSpikeId : 290637,
              created,
              count          : spike
            });
          }
        }
         /*eslint-enable dot-notation*/

        let elementIndex = _dummyData[module][type].indexOf(el);
        if (elementIndex > 0) {
          _dummyData[module][type][elementIndex] = el;
        }

      }, interval);
    }

    return null;
  }

  function _changeKey({ el, key, keyType }) {
    switch (keyType) {
      case 'number':
        _obj.set(el, key, Math.floor(Math.random() * (10 - 0 + 5)) + 10);
        break;
      case 'float':
        _obj.set(el, key, Math.random() * (10 - 0 + -1.5) + 1.5);
        break;
      case 'array-float': {
        const alterArray = _obj.get(el, key);
        if (Array.isArray(alterArray)) {
          alterArray.shift();
          alterArray.push(Math.random() * (10 - 0 + -1.5) + 1.5);
          _obj.set(el, key, alterArray);
        }
        break;
      }
    }
  }

  /*!
   * Initialize/ generate the data
   * the data
   *
   * @method _startRealTimeFor
   * @private
   * @param  {String} module         The module of data we want to simulate the data
   * @param  {Object} intervalsRange Object which contains the interval range in ms
   */
  function _startRealTimeFor(module, intervalsRange) {
    const data = _obj.get(_configData, module + '.data');

    // Initialize the data.
    _dummyData[module] = data;

    if (module.split('_')[0] === 'trafficChart') {
      //Because of the size of trafficChart and dates are
      // involved we need to generate the object here
      _generateTrafficData(module);
    } else {
      _generateData(module, intervalsRange);
    }
  }

  /*!
   * TODO: IK : WRITE DOCUMENTATION
   * [_generateData description]
   * @param  {[type]} module         [description]
   * @param  {[type]} intervalsRange [description]
   * @return {[type]}                [description]
   */
  function _generateData(module, intervalsRange) {
    // For each one run a different interval and populate random data in it.
    _dummyData[module].forEach((el) => {
      let name = el.key || el.trend || el.name,
          interval = Math.floor(Math.random() * (intervalsRange.from - intervalsRange.to + 100)) + intervalsRange.to,
          intervalKey =  String(module + '.' + name),
          intervalId = _obj.get(_modIntervals, intervalKey, null);

      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      // Save timer if we want to stop it later.
      _obj.set(_modIntervals, intervalKey, _changeData({ el, interval, module }));
    });
  }

  /*!
   * Fetches json data.
   *
   * @method _fetchFiles
   * @private
   * @param  {String} folder Relative folder path
   */
  function _jsonData(folder, modules) {
    const data = {};

    modules = modules || null;

    // fetch module files
    fs.readdirSync(path.join(__dirname, folder))
      .filter(function(file) { return file.substr(-5) === '.json'; })
      .forEach(function(file) {
        let filename = file.replace(/\.[^/.]+$/, '');
        if (Array.isArray(modules) && modules.length > 0 &&
             modules.indexOf(filename) > -1) {
          data[filename] = require(folder + file);
        } else if (typeof modules === 'string' && modules === 'ALL') {
          data[filename] = require(folder + file);
        }
      });

    return data;
  }

  /**
   * $sim Service
   *
   * @class $sim
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
      'api'
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
      _api    = requires['api'];
      _config = requires['config'];
      _obj    = _util.object;
      _date   = _util.date;
      /*eslint-enable dot-notation*/

      _NUMBER_OF_TRENDS = _config.get('simulator.numberOfTrends') || 16;
    },

    /**
     * Returns the url of our server API
     *
     * @method url
     * @public
     * @return {Object} Promise object
     */
    url : function() {
      const $defer = $.Deferred();

      _getNetworkIP((error, ip) => {
        _util.log(ip);
        if (error) {
          _util.log('$sim : url : ERROR :', error);
          $defer.resolve('https://localhost:4730/'); //default
        } else {
          $defer.resolve('https://' + ip + ':' + _config.get('port') + '/');
        }
      });

      return $defer.promise();
    },

    /**
     * Starts the simulator.
     *
     * @method watch
     * @public
     * @return {Boolean} Returns true :P
     */
    watch : function() {
      _api.start();
      _initializeIntervals();
      return true;
    },

    /**
     * Returns the data from the sim
     *
     * @method  getData
     * @public
     * @param  {String} module The data you want to fetch ( ex. 'trends.global')
     * @return {Array}        Data
     */
    getData : function(module) {
      return (module) ? _dummyData[module] : _dummyData;
    },

    /**
     * Check the _createTag private function above
     */
    createTag : _createTag,

    /**
     * Check the _generateHistoricalCount private function above
     */
    generateHistoricalCount : _generateHistoricalCount,

    /**
     * Check the _updateTag private function above
     */
    updateTag : _updateTag
  };
};

export default $sim;
