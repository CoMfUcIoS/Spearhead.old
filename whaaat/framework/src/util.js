/**
 * @module framework
 * @submodule util
 * @namespace framework
 *
 * @return {Object} Module component
 */
const util = function() {

  let _config;

  /*!
   * @see util.log
   */
  function _log(/* Something to log goes here */) {
    if (_config.get('debugging')) {
      const args = Array.prototype.slice.call(arguments);
      /*eslint-disable no-console*/
      if (!_config.get('unitTests')) { // For not logging in our unit tests
        console.log.apply(console, args);
        console.log('============================================================');
        /*eslint-enable no-console*/
      }
    }
  }

  /*!
   * @see util.object.sanity
   */
  function _checkSanity(obj, expected) {
    let sanity    = true,
        mandatory = 0,
        objKeys;

    if (_isEmpty(obj) || _isEmpty(expected)) {
      _log('framework : util : _checkSanity: Parameters are not an object or empty objects');
      return false;
    }

    Object.keys(expected).forEach((key) => {
      if (_objectGet(expected[key], 'mandatory', false)) {
        mandatory++;
      }
    });

    if (mandatory === 0) {
      return true;
    }

    objKeys = Object.keys(obj);

    if (objKeys.length < mandatory) {
      _log('framework : util : _checkSanity: Object\'s keys length is less than mandatory keys.');
      return false;
    }

    objKeys.forEach((key) => {
      var expectedKey = _objectGet(expected, key, null),
          type = _objectGet(expectedKey, 'type', null),
          isMandatory = _objectGet(expectedKey, 'mandatory', false);

      if (!isMandatory) {
        return;
      }

      if (!type || typeof obj[key] !== type) {
        sanity = false;
      }
    });
    return sanity;
  }

  /*!
   * Checks if an object is empty
   *
   * @method  _isEmpty
   * @private
   * @param  {Object}  obj The object to be checked
   * @return {Boolean}     True if it is empty, false otherwise
   */
  function _isEmpty(obj) {
    if (typeof obj !== 'object') {
      _log('framework : util : _isEmpty : Parameter is not an object');
      return true;
    }
    return (Object.keys(obj).length === 0 && obj.constructor === Object);
  }

  /*!
   * Deep value set in an object
   *
   * @method  _objectSet
   * @private
   * @param  {Object} obj   Object we want to add a path and a value
   * @param  {String} path  The path
   * @param  {[type]} value The value
   */
  function _objectSet(obj, path, value) {
    //const [obj, path, value] = Array.prototype.slice.call(arguments);
    let a = path.split('.'),
        o = obj,
        l = a.length,
        i,
        n;

    for (i = 0; i < l - 1; i++) {
      n = a[i];
      if (n in o) {
        o = o[n];
      } else {
        o[n] = {};
        o = o[n];
      }
    }
    o[a[a.length - 1]] = value;
  }

  /*!
   * Deep search inside an object
   *
   * @method  _objectGet
   * @private
   * @param  {Object} obj          Object to search
   * @param  {String} path         Desired path
   * @param  {Any}    defaultValue Default value if path is not defined
   * @param  {String} delimiter    Path delimiter. If it is different than .
   *                               then you must specify it here
   * @return {Any}                   Value found on that Path or
   *                               default value specified. or undefined.
   */
  /*eslint-disable max-params*/
  function _objectGet() {
  /*eslint-enable max-params*/
    let [obj, path, defaultValue, delimiter] = Array.prototype.slice.call(arguments),
        arr,
        i;
    if (typeof path === 'string') {
      arr = path.split(delimiter || '.');
      for (i = 0; i < arr.length; i++) {
        if (obj && (obj.hasOwnProperty(arr[i]) || obj[arr[i]])) {
          obj = obj[arr[i]];
        } else {
          return defaultValue;
        }
      }
      return obj;
    } else {
      return defaultValue;
    }
  }

  /**
   * The util component
   *
   * @class util
   */
  return {

    /*!
     * Module dependencies
     *
     * @hidden
     * @type {Array}
     */
    requires : [
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
      _config = requires['config'];
      /*eslint-enable dot-notation*/
    },

    /**
     * This function is use to log to the console.
     *
     * @method log
     * @public
     */
    log : _log,

    /**
     * Returns the type of the variable
     *
     * @method toType
     * @public
     * @param  {Any} variable Variable we want to check its type
     * @return {String}       The above variable type.
     */
    toType : function(variable) {
      if (variable === null) {
        return 'null';
      } else if (typeof variable === 'object') {
        if (Array.isArray(variable)) {
          return 'array';
        } else {
          return 'object';
        }
      } else {
        return typeof variable;
      }
    },

    /**
     * Creates a unique guid to use it for client matching.
     *
     * @method  guid
     * @public
     * @param  {Array}  clients Array with the already defined clients.
     * @return {String}         Unique Guid.
     */
    guid : function guid(clients) {
      const uid = s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();

      /*!
       * Creates a random alphanumeric string
       *
       * @method s4
       * @private
       * @return {String} A random alphanumeric
       */
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
              .toString(16)
              .substring(1);
      }

      if (_objectGet(clients, uid, null)) {
        return this.guid(clients);
      } else {
        return uid;
      }
    },
    date : {
      formatForChart : function(timestamp) {
        if (!timestamp || isNaN(timestamp)) {
          return false;
        }
        const time = new Date(timestamp),
            yyyy   = time.getFullYear(),
            dd     = (time.getDate() < 10) ? '0' + time.getDate() : time.getDate(),
            mm     = ((time.getMonth() + 1) < 10) ? '0' + (time.getMonth() + 1) : (time.getMonth()  + 1), //January is 0!
            min    = (time.getMinutes() < 10) ? '0' + time.getMinutes() : time.getMinutes(),
            hh     = (time.getHours() < 10) ? '0' + time.getHours() : time.getHours();

        return yyyy + '-' + mm + '-' + dd + ' ' + hh + ':' + min + ':00';
      }
    },
    /**
     * The util.object component
     *
     * @class util.object
     */
    object : {
      /**
       * Deep search inside an object
       *
       * @method  get
       * @public
       * @param  {Object} obj          Object to search
       * @param  {String} path         Desired path
       * @param  {*}      defaultValue Default value if path is not defined
       * @param  {String} delimiter    Path delimiter. If it is different than .
       *                               then you must specify it here
       * @return {*}                   Value found on that Path or
       *                               default value specified. or undefined.
       */
      get : _objectGet,

      /**
       * Deep value set in an object
       *
       * @method  set
       * @public
       * @param  {Object} obj   Object we want to add a path and a value
       * @param  {String} path  The path
       * @param  {[type]} value The value
       */
      set : _objectSet,

      /**
       * Checks if an object is empty
       *
       * @method  isEmpty
       * @public
       * @param  {Object}  obj The object to be checked
       * @return {Boolean}     True if it is empty, false otherwise
       */
      isEmpty : _isEmpty,

      /**
       * Checks the sanity of an object against the expected object
       *
       * @method  sanity
       * @public
       * @param  {Object}   obj      Object to check
       * @param  {Object}   expected Object with keys and their types
       *                             @example:
       *                             {
       *                               key1: {
       *                                 mandatory: true,
       *                                 type: 'object'
       *                                 },
       *                               key2: {
       *                                 mandatory: true,
       *                                 type: 'string'
       *                                 },
       *                               key3: {
       *                                 mandatory: false, // wont make any checks on that. Its false by default..
       *                                 }
       *                             }
       * @return {Boolean}           True if object is ok, false otherwise
       */
      sanity : _checkSanity,

      /**
       * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
       *
       * @method  merge
       * @public
       * @param {Object}  obj1   Object to be overwritten
       * @param {Object}  obj2   Object to overwritten obj1
       * @return {Object}        A new object based on obj1 and obj2
       */
      merge : function(obj1, obj2) {
        const obj3 = {};
        let   attrname;

        if (!_isEmpty(obj1)) {
          for (attrname in obj1) {
            obj3[attrname] = obj1[attrname];
          }
        }

        if (!_isEmpty(obj2)) {
          for (attrname in obj2) {
            obj3[attrname] = obj2[attrname];
          }
        }

        return obj3;
      }
    },

    /**
     * The util.random component
     *
     * @class util.random
     */
    random : {

      /**
       * Generates a random number
       *
       * @method number
       * @public
       * @param  {Number} from Lowest number we can generate
       * @param  {Number} to   Highest number we can generate
       * @return {Number}      Random number in the above range
       */
      number : function(from, to) {
        return Math.floor(Math.random() * to) + from;
      },

      /*!
       * Generates a random string
       *
       * @method string
       * @public
       * @param  {Number}  charCount  Characters count of the string.
       * @return {String}             Random String
       */
      string : function(charCount) {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ';

        let text     = '',
            i;

        for (i = 0; i < charCount; i++) {
          text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text;
      }
    }
  };
};

export default util;
