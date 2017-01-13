/**
 * @module framework
 * @submodule util
 * @namespace framework
 *
 * @returns {Object} Module component
 */

import _    from 'lodash';
import os   from 'os';
import uuid from 'uuid';


const util = (function() {
  let _config,
      _util;

  /*!
   * @see util.log
   */
  function _log(/* Something to log goes here */) {
    if (_config.get('debug')) {
      const args = Array.prototype.slice.call(arguments);
      let call;
      call = _util.find(args, (o) => { //eslint-disable-line
        if (_util.toType(o) === 'string') {
          let str = o.toLowerCase();
          if (str.indexOf('error:') > -1) {
            return 'error';
          } else if (str.indexOf('warn:') > -1) {
            return 'warn';
          }
        }
      });
      call = (_util.toType(call) === 'undefined') ? 'info' : call;
      args.unshift(`[APP] ${call.toUpperCase()}: ${new Date().toISOString().slice(11, -5)}`); //eslint-disable-line
      /*eslint-disable no-console*/
      if (typeof console[call] === 'function') { // This is added because jest tests uses console.warn with nodejs
        console[call].apply(console, args);
      } else {
        console.log(args);
      }
      /*eslint-enable no-console*/
    }
  }

  /*!
   * @see util.toType
   */
  function _toType(variable) {
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
  }

  /*!
   * @see util.object.sanity
   */
  function _checkSanity(obj, expected) {
    let sanity    = true,
        mandatory = 0,
        type,
        objKeys;

    if (_isEmpty(obj) || _isEmpty(expected)) {
      _log('framework : util : _checkSanity: Parameters are not an object or empty objects');
      return false;
    }

    Object.keys(expected).forEach(function(key) {
      if (_objectGet(expected[key], 'mandatory', false)) {
        mandatory++;
      }
      if (_objectGet(expected[key], 'type', false)) {
        type = _objectGet(expected[key], 'type', false);
        if (!type || typeof obj[key] !== type) {
          sanity = false;
        }
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

    return sanity;
  }

  /*!
   * Gets the first element of array or string.
   *
   * @method _head
   * @private
   * @param   {Array|String}   array   The array or string to query.
   * @param   {Number}  [n]            The number of elements to take.
   * @return  {*}                      Returns the first element of array or string.
   */
  function _head(array) {
    if (_toType(array) === 'array' || _toType(array) === 'string') {
      return array[0];
    }
    return _util.noop;
  }


  /*!
   * Checks if a value is empty
   *
   * @method  _isEmpty
   * @private
   * @param  {*}  value    The value we want to check
   * @return {Boolean}     True if it is empty, false otherwise
   */
  function _isEmpty(value) {
    const type = _toType(value);
    if (type === 'object') {
      return Object.keys(value).length === 0 && value.constructor === Object;
    } else if (type === 'array' || type === 'string') {
      return !(value.length > 0);
    } else if (type === 'undefined' || type === 'null') {
      return true;
    }

    return true;
  }

  /*!
   * Deep search inside an object
   *
   * @method  _objectGet
   * @private
   * @param  {Object}   obj           Object to search
   * @param  {String}   path          Desired path
   * @param  {*}        defaultValue  Default value if path is not defined
   * @param  {Boolean}  [execute]     Executes the value if it is a function.
   * @param  {String}   [delimiter]   Path delimiter. If it is different than .
   *                                  then you must specify it here
   * @return {*}                      Value found on that Path or
   *                                  default value specified. or undefined.
   */
  /*eslint-disable max-params*/
  function _objectGet(obj, path, defaultValue, execute, delimiter) {
  /*eslint-enable max-params*/
    let arr,
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
      return (execute && _toType(obj) === 'function') ? obj() : obj;
    } else {
      return defaultValue;
    }
  }

  /*!
   * Deep value set in an object
   *
   * @method  _objectSet
   * @private
   * @param  {Object} obj   Object we want to add a path and a value
   * @param  {String} path  The path
   * @param  {*}      value The value
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
   * Fetches the cookies from the browser and returns them as an array
   *
   * @method _getCookies
   * @private
   * @return {Object} Object containing our cookies.
   */
  function _getCookies() {
    const cookies = {};
    let c = document.cookie,
        v = 0;

    if (document.cookie.match(/^\s*\$Version=(?:"1"|1);\s*(.*)/)) {
      c = RegExp.$1;
      v = 1;
    }
    if (v === 0) {
      c.split(/[,;]/).map((cookie) => {
        const parts = cookie.split(/=/, 2),
            name    = decodeURIComponent(parts[0].trimLeft()),
            value   = (parts.length > 1) ? decodeURIComponent(parts[1].trimRight()) : null;
        cookies[name] = value;
        return true;
      });
    } else {
      c.match(/(?:^|\s+)([!#$%&'*+\-.0-9A-Z^`a-z|~]+)=([!#$%&'*+\-.0-9A-Z^`a-z|~]*|"(?:[\x20-\x7E\x80\xFF]|\\[\x00-\x7F])*")(?=\s*[,;]|$)/g).map(($0, $1) => {
        const name = $0,
            value  = ($1.charAt(0) === '"') ? $1.substr(1, -1).replace(/\\(.)/g, '$1') : $1;
        cookies[name] = value;
        return true;
      });
    }
    return cookies;
  }

  /*!
   * Iterates over elements of collection and invokes iteratee for each element.
   * The iteratee is invoked with three arguments: (value, index|key, collection).
   * Iteratee functions may exit iteration early by explicitly returning false.
   *
   * @method _each
   * @private
   * @param    {Array|Object}  collection  The collection to iterate over.
   * @param   {Function}      [iteratee]  The function invoked per iteration.
   * @return  {*}                         Returns collection.
   */
  function _each() {
    return _.each.apply(_util, arguments);
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
      _util = this;
      /*eslint-enable dot-notation*/
    },

    /**
     * Returns a unique user identifier
     *
     * @method uuid
     * @public
     * @return {String} The uuid
     */
    uuid : function() {
      return uuid.v4();
    },

    /**
     * Checks if a value is empty
     *
     * @method  _isEmpty
     * @public
    */
    isEmpty : _isEmpty,

    /**
     * This returns undefined.
     *
     * @variable noop
     * @static
     */
    noop : undefined,

    /**
     * This function is use to log to the console.
     *
     * @method log
     * @public
     */
    log : _log,

    /**
     * Returns operating system's hostname
     *
     * @method hostname
     * @public
     * @return {String} Hostname of the os.
     */
    hostname : function() {
      return os.hostname();
    },

    /**
     * Creates a lodash wrapper instance that wraps value with explicit method chain sequences
     * enabled. The result of such sequences must be unwrapped with _#value.
     *
     * @method chain
     * @public
     * @param  {*}      value  The value to wrap.
     * @return {Object}        Returns the new lodash wrapper instance.
     */
    chain : function() {
      return _.chain.apply(this, arguments);
    },

    /**
     * Creates an array of numbers (positive and/or negative) progressing from start up to,
     * but not including, end. A step of -1 is used if a negative start is specified without
     * an end or step. If end is not specified, it's set to start with start then set to 0.
     *
     * @method range
     * @public
     * @param {Number} [start]  The start of the range.
     * @param {Number} end      The end of the range.
     * @param {Number} [step]   The value to increment or decrement by.
     * @return {Array}          Returns the range of numbers.
     */
    range : function() {
      return _.range.apply(this, arguments);
    },

    /**
     * This method returns the first argument it receives.
     *
     * @method  identity
     * @public
     * @param {*} value Any value
     * @return {*} Value
     */
    identity : function() {
      return _.identity.apply(this, arguments);
    },

    /**
     * Creates a debounced function that delays invoking func until after wait
     * milliseconds have elapsed since the last time the debounced function was invoked.
     * The debounced function comes with a cancel method to cancel delayed func invocations
     * and a flush method to immediately invoke them. Provide options to indicate whether
     * func should be invoked on the leading and/or trailing edge of the wait timeout.
     * The func is invoked with the last arguments provided to the debounced function.
     * Subsequent calls to the debounced function return the result of the last func invocation.
     *
     * @method debounce
     * @public
     * @param {Function} func                 The function to debounce.
     * @param  {Number}  [wait]               The number of milliseconds to delay.
     * @param {Object}   [options]            The options object.
     *   @param {Boolean} [options.leading]   Specify invoking on the leading edge of the timeout.
     *   @param {Number}  [options.maxWait]   The maximum time func is allowed to be delayed before it's invoked.
     *   @param {Boolean} [options.trailing]  Specify invoking on the trailing edge of the timeout.
     * @return {Function}                     Returns the new debounced function.
     */
    debounce : function() {
      return _.debounce.apply(this, arguments);
    },

    /**
     * Iterates over elements of collection and invokes iteratee for each element.
     * The iteratee is invoked with three arguments: (value, index|key, collection).
     * Iteratee functions may exit iteration early by explicitly returning false.
     *
     * @method forEach
     * @private
     * @param    {Array|Object}  collection  The collection to iterate over.
     * @param   {Function}      [iteratee]  The function invoked per iteration.
     * @return  {*}                         Returns collection.
     */
    forEach : _each,

    /**
     * Iterates over elements of collection and invokes iteratee for each element.
     * The iteratee is invoked with three arguments: (value, index|key, collection).
     * Iteratee functions may exit iteration early by explicitly returning false.
     *
     * @method each
     * @private
     * @param    {Array|Object}  collection  The collection to iterate over.
     * @param   {Function}      [iteratee]  The function invoked per iteration.
     * @return  {*}                         Returns collection.
     */
    each : _each,

    /**
     * Checks if predicate returns truthy for all elements of collection.
     * Iteration is stopped once predicate returns falsey. The predicate
     * is invoked with three arguments: (value, index|key, collection).
     *
     * @method every
     * @public
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [predicate] The function invoked per iteration.
     * @return {Boolean} Returns true if all elements pass the predicate check, else false.
     */
    every : function() {
      return _.every.apply(this, arguments);
    },

    /**
     * Creates a function that invokes func with partials prepended to the arguments
     * it receives. This method is like _.bind except it does not alter the this binding.
     *
     * @method  partial
     * @public
     * @param   {Function}  func        The function to partially apply arguments to.
     * @params  {...*}      partials]   The arguments to be partially applied.
     * @return  {Function}              Returns the new partially applied function.
     */
    partial : function() {
      return _.partial.apply(this, arguments);
    },

    /**
     * Checks if value is null.
     *
     * @method isNull
     * @public
     * @param  {*}        value The value to check
     * @return {Boolean}        Returns true if value is null, else false.
     */
    isNull : function(value) {
      return (_toType(value) === 'null');
    },

    /**
     * Defers invoking the func until the current call stack has cleared. Any additional
     * arguments are provided to func when it's invoked.
     *
     * @method defer
     * @public
     * @param  {Function} func   The function to defer.
     * @params {...*}    [args] The arguments to invoke func with.
     * @return {Number}  Returns the timer id.
     */
    defer : function() {
      return _.defer.apply(this, arguments);
    },

    /**
     * Performs a deep comparison between each element in collection and
     * the source object, returning the first element that has equivalent
     * property values.
     *
     * @method findWhere
     * @public
     * @param  {Array|Object|String}  collection  The collection to search.
     * @param  {Object}               source      The object of property values to match.
     * @return {*}                                Returns the matched element, else undefined.
     */
    findWhere : function(collection, source) {
      return this.find(collection, (n) => {
        if (this.matches(source)(n)) {
          return n;
        }
        return false;
      });
    },

    /**
     * Creates a function that performs a partial deep comparison between a
     * given object and source, returning true if the given object has equivalent
     * property values, else false.
     *
     * @method matches
     * @public
     * @param   {Object}    source  The object of property values to match.
     * @return  {Function}          Returns the new spec function.
     */
    matches : function() {
      return _.matches.apply(this, arguments);
    },

    /**
     * Iterates over elements of collection, returning the first element predicate
     * returns truthy for. The predicate is invoked with three arguments:
     * (value, index|key, collection).
     *
     * @method  find
     * @public
     * @param   {Array|Object}  collection  The collection to inspect.
     * @param   {Function}      [predicate] The function invoked per iteration.
     * @param   {Number}        [fromIndex] The index to search from.
     * @return  {*}                         Returns the matched element, else undefined.
     */
    find : function() {
      return _.find.apply(this, arguments);
    },

    /**
     * Checks if value is classified as a String primitive or object.
     *
     * @method isString
     * @public
     * @param  {*}       value  The value to check.
     * @return {Boolean}        Returns true if value is a string, else false.
     */
    isString : function(value) {
      return (_toType(value) === 'string');
    },

    /**
     * Creates a shallow clone of value.
     *
     * @method clone
     * @public
     * @param {*}   value   The value to clone.
     * @return {*}          Returns the cloned value.
     */
    clone : function() {
      return _.clone.apply(this, arguments);
    },

    /**
     * Recursively clones value
     *
     * @method   cloneDeep
     * @public
     * @param {*}   value   The value to clone.
     * @return {*}          Returns the cloned value.
     */
    cloneDeep : function() {
      return _.cloneDeep.apply(this, arguments);
    },

    /**
     * Checks if predicate returns truthy for any element of collection. Iteration is stopped once predicate
     * returns truthy. The predicate is invoked with three arguments: (value, index|key, collection).
     *
     * @method  some
     * @public
     * @param {Array|Object} collection   The collection to iterate over.
     * @param {Function}     [predicate]  The function invoked per iteration.
     * @return {Boolean}                  Returns true if any element passes the predicate check, else false.
     */
    some : function() {
      return _.some.apply(this, arguments);
    },

    /**
     * Reduces collection to a value which is the accumulated result of running each element in collection thru iteratee,
     * where each successive invocation is supplied the return value of the previous. If accumulator is not given,
     * the first element of collection is used as the initial value. The iteratee is invoked with four arguments:
     * (accumulator, value, index|key, collection).
     *
     * @method  reduce
     * @public
     * @param {Array|Object} collection      The collection to iterate over.
     * @param {Function}     [iteratee]      The function invoked per iteration.
     * @param {*}            [accumulator]   The initial value.
     * @return {*}                           Returns the accumulated value.
     */
    reduce : function() {
      return _.reduce.apply(this, arguments);
    },

    /**
     * Checks if value is in collection. If collection is a string,
     * it’s checked for a substring of value, otherwise SameValueZero is
     * used for equality comparisons. If fromIndex is negative, it’s used as
     * the offset from the end of collection.
     *
     * @method  includes
     * @public
     * @param  {Array|Object|String}  collection    The collection to inspect.
     * @param  {*}                    value         The value to search for.
     * @param  {Number}               [fromIndex]   The index to search from.
     * @return {Boolean}                            Returns true if value is found, else false.
     */
    includes : function() {
      return _.includes.apply(this, arguments);
    },

    /**
     * This method returns the elements of collection that predicate does not return truthy for.
     *
     * @method  reject
     * @public
     * @param {Array|Object} collection   The collection to iterate over.
     * @param {Function}     [predicate]  The function invoked per iteration. [description]
     * @return {Array}                    Returns the new filtered array.
     */
    reject : function() {
      return _.reject.apply(this, arguments);
    },

    /**
     * Performs a deep comparison between two values to determine if they are equivalent.
     * This method supports comparing arrays, array buffers, booleans, date objects,
     * error objects, maps, numbers, Object objects, regexes, sets, strings, symbols,
     * and typed arrays. Object objects are compared by their own, not inherited, enumerable
     * properties. Functions and DOM nodes are not supported.
     *
     * @method isEqual
     * @public
     * @param {*}        value  The value to compare.
     * @param {*}        other  The other value to compare.
     * @return {Boolean}        Returns true if the values are equivalent, else false.
     */
    isEqual : function() {
      return _.isEqual.apply(this, arguments);
    },

    /**
     * Creates an array of values by running each element in collection thru iteratee.
     * The iteratee is invoked with three arguments: (value, index|key, collection).
     *
     * @method map
     * @pubic
     * @param {Array|Object} collection  The collection to iterate over.
     * @param {Function}     [iteratee]  The function invoked per iteration.
     * @return {Array}                   Returns the new mapped array.
     */
    map : function() {
      return _.map.apply(this, arguments);
    },

    /**
     * Iterates over elements of collection, returning an array of all elements predicate
     * returns truthy for. The predicate is invoked with three arguments: (value, index|key, collection).
     *
     * @method  filter
     * @public
     * @param   {Array|Object} collection   The collection to iterate over.
     * @param   {Function}     [predicate]  The function invoked per iteration.
     * @return  {Array}                     Returns the new filtered array.
     */
    filter : function() {
      return _.filter.apply(this, arguments);
    },

    /**
     * Checks if value is undefined.
     *
     * @method isUndefined
     * @public
     * @param  {*}       value   The value to check.
     * @return {Boolean}         Returns true if value is undefined, else false.
     */
    isUndefined : function(value) {
      return (this.toType(value) === 'undefined');
    },

    /**
     * Checks if value is classified as a Function object.
     *
     * @method isFunction
     * @public
     * @param  {*}        value The value to check
     * @return {Boolean}        Returns true if value is a function, else false.
     */
    isFunction : function(value) {
      return (_toType(value) === 'function');
    },

    /**
     * Checks if value is classified as a Number primitive or object.
     *
     * @method isNumber
     * @public
     * @param  {*}        value The value to check
     * @return {Boolean}        Returns true if value is a number, else false.
     */
    isNumber : function(value) {
      return (_toType(value) === 'number');
    },

    /**
     * Returns true if the number passed is odd
     *
     * @method   isOdd
     * @public
     * @param    {Number}   num  Number to check
     * @return   {Boolean}       True if it's odd, false otherwise
     */
    isOdd : function(num) {
      return (num % 2 === 1);
    },

    /**
     * Escapes html from jsx files
     *
     * @method escapeHTML
     * @public
     * @param  {String} jsx Jsx string
     * @return {String}     Escaped string
     */
    escapeHTML : function(jsx) {
      return jsx.replace(/&/g, '&amp;')
      .replace(/</g, '&#60;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    },

    /**
     * Returns the type of the variable
     *
     * @method toType
     * @public
     * @param  {Any} variable Variable we want to check its type
     * @return {String}       The above variable type.
     */
    toType : _toType,

    /**
     * Fetches the csrf Token from csrf_repknight_cookie_name in the cookie
     *
     * @method  getCSRFToken
     * @public
     * @return {String|null} Csrf token as string or null if not found
     */
    getCSRFToken : function() {
      return this.object.get(_getCookies(), 'csrf_repknight_cookie_name', null);
    },

    /**
     * Recursively flattens the array then maps the results.
     *
     * @method flatMapDeep
     * @public
     * @param  {Array}  array   The array to flatten.
     * @return {Array}          Returns the new mapped flattened array.
     */
    flatMapDeep : function() {
      return _.flatMapDeep.apply(this, arguments);
    },

    /**
     * The util.array component
     *
     * @class util.array
     */
    array : {

      /**
       * Computes the maximum value of array. If array is empty or falsey, undefined is returned.
       * Accepts iteratee which is invoked for each element in array to generate the criterion by
       * which the value is ranked.
       *
       * @method   maxBy
       * @public
       * @param   {Array}            array       The array to iterate over.
       * @param   {Function|String}  [iteratee]  The iteratee invoked per element.
       * @return  {*}                            Returns the maximum value
       */
      maxBy : function() {
        return _.maxBy.apply(this, arguments);
      },

      /**
       * Removes all elements from array that predicate returns truthy for and returns an array of the removed elements.
       * The predicate is invoked with three arguments: (value, index, array).
       *
       * @method   remove
       * @private
       * @param  {Array}    array      The array to modify.
       * @param  {Function} predicate  The function invoked per iteration.
       * @return {Array}               Returns the new array of removed elements.
       */
      remove : function() {
        return _.remove.apply(this, arguments);
      },

      /**
       * Gets all but the first element of array.
       *
       * @method tail
       * @public
       * @param {Array}  array  Array to tail
       * @return {Array}        Tailed array
       */
      tail : function() {
        return _.tail.apply(this, arguments);
      },

      /**
       * Computes the minimum value of array. If array is empty or falsey, undefined is returned.
       *
       * @method min
       * @public
       * @param {Array} array The array to iterate over.
       * @return {*}          Returns the minimum value.
       */
      min : function() {
        return _.min.apply(this, arguments);
      },

      /**
       * Computes the maximum value of array. If array is empty or falsey, undefined is returned.
       *
       * @method max
       * @public
       * @param {Array} array The array to iterate over.
       * @return {*} Returns the maximum value.
       */
      max : function() {
        return _.max.apply(this, arguments);
      },

      /**
       * Creates an array of unique values, in order, from all given arrays using SameValueZero for equality comparisons.
       *
       * @method union
       * @public
       * @param {...Array} arrays The arrays to inspect.
       * @return {Array} Returns the new array of combined values.
       */
      union : function() {
        return _.union.apply(this, arguments);
      },

      /**
       * Creates an array of array values not included in the other given arrays using SameValueZero for equality comparisons.
       * The order and references of result values are determined by the first array.
       *
       * @method difference
       * @public
       * @param {Array} array The array to inspect.
       * @param {...Array} values The values to exclude.
       * @return {Array} Returns the new array of filtered values.
       */
      difference : function() {
        return _.difference.apply(this, arguments);
      },

      /**
       * Creates an array of grouped elements, the first of which contains
       * the first elements of the given arrays, the second of which contains
       * the second elements of the given arrays, and so on.
       *
       * @method zip
       * @public
       * @params {...Arrays} arrays The arrays to process.
       * @return {Array}            Returns the new array of grouped elements.
       */
      zip : function() {
        return _.zip.apply(this, arguments);
      },

      /**
       * Creates a slice of array with n elements dropped from the beginning.
       *
       * @method drop
       * @public
       * @param   {Array}   array The array to query.
       * @param   {Number}  [n]   The number of elements to drop.
       * @return  {Array}         Returns the slice of array.
       */
      drop : function() {
        return _.drop.apply(this, arguments);
      },

      /**
       * Gets the first element of array.
       *
       * @method head
       * @public
       * @param   {Array}   array   The array to query.
       * @param   {Number}  [n]     The number of elements to take.
       * @return  {*}               Returns the first element of array.
       */
      head : _head,

      /**
       * Gets the first element of array.
       *
       * @method first
       * @public
       * @param   {Array}   array   The array to query.
       * @param   {Number}  [n]     The number of elements to take.
       * @return  {*}               Returns the first element of array.
       */
      first : _head,

      /**
       * Gets the last element of array
       *
       * @method last
       * @public
       * @param   {Array|String}   array  The array to query.
       * @param   {Number}  [n]    The number of elements to take.
       * @return {*}               Returns the last element of array.
       */
      last : function(array) {
        if ((_toType(array) === 'array' || _toType(array) === 'string') && array.length > 0) {
          return array[array.length - 1];
        }
        return _util.noop;
      },

      /**
       * Creates a slice of array with n elements taken from the end.
       *
       * @method takeRight
       * @public
       * @param   {Array}   array  The array to query.
       * @param   {Number}  [n]    The number of elements to take.
       * @return {*}               Returns the slice of array.
       */
      takeRight : function() {
        return _.takeRight(this, arguments);
      },

      /**
       * Creates a slice of array with n elements taken from the beginning.
       *
       * @method take
       * @public
       * @param   {Array}   array  The array to query.
       * @param   {Number}  [n]    The number of elements to take.
       * @return {*}               Returns the slice of array.
       */
      take : function() {
        return _.take(this, arguments);
      },

      /**
       * Flattens array a single level deep.
       *
       * @method flatten
       * @public
       * @param  {Array}  array   The array to flatten.
       * @return {Array}          Returns the new flattened array.
       */
      flatten : function() {
        return _.flatten.apply(this, arguments);
      },

      /**
       * Recursively flattens array.
       *
       * @method flattenDeep
       * @public
       * @param  {Array}  array   The array to flatten.
       * @return {Array}          Returns the new flattened array.
       */
      flattenDeep : function() {
        return _.flattenDeep.apply(this, arguments);
      },

      /**
       * Creates a duplicate-free version of an array, using SameValueZero
       * for equality comparisons, in which only the first occurrence of each element is kept.
       *
       * @method uniq
       * @public
       * @param   {Array}   array   The array to inspect.
       * @return  {Array}          Returns the new duplicate free array.
       */
      uniq : function() {
        return _.uniq.apply(this, arguments);
      },

      /**
       * This method returns the index of the first element predicate returns truthy for instead of the element itself.
       *
       * @method findIndex
       * @public
       * @param   {Array}     array         The array to inspect.
       * @param   {Function}  [predicate]   The function invoked per iteration.
       * @param   {Number}    [fromIndex]   The index to search from.
       * @return  {Number}                 Returns the index of the found element, else -1.
       */
      findIndex : function() {
        return _.findIndex.apply(this, arguments);
      },

      /**
       * Creates an array of elements, sorted in ascending order by the results of running
       * each element in a collection thru each iteratee. This method performs a stable sort,
       * that is, it preserves the original sort order of equal elements. The iteratees are
       * invoked with one argument: (value).
       *
       * @method  sortBy
       * @public
       * @param   {Array|Object}        collection    The collection to iterate over.
       * @param   {Function|Function[]} [iteratees]   The iteratees to sort by.
       * @return  {Array}                            Returns the new sorted array.
       */
      sortBy : function() {
        return _.sortBy.apply(this, arguments);
      },

      /**
       * Gets the index at which the first occurrence of value is found in array
       *
       * @method  indexOf
       * @public
       * @param  {Array}  array  The array to inspect.
       * @param  {*}      value  The value to search for.
       * @return {Number}         Returns the index of the matched value, else -1.
       */
      indexOf : function(array, value) {
        if (!this.isArray(array)) {
          _log('util : array : indexOf : Variable passed in is not an Array, aborting...');
          return -1;
        }
        return array.indexOf(value);
      },

      /**
       * Creates an array of unique values that are included in all given arrays
       * using SameValueZero for equality comparisons. The order of result values
       * is determined by the order they occur in the first array.
       *
       * @method  intersection
       * @public
       * @params  {Arrays} ..Arrays  The arrays to inspect.
       * @return  {Array}            Returns the new array of intersecting values.
       */
      intersection : function() {
        return _.intersection.apply(this, arguments);
      },

      /**
       * Checks if value is classified as an Array object.
       *
       * @method  isArray
       * @public
       * @param  {*}        value   The value to check.
       * @return {Boolean}          Returns true if value is an array, else false.
       */
      isArray : function() {
        return _.isArray.apply(this, arguments);
      },

      /**
       * Moves an array element to the index specified
       *
       * @method  move
       * @public
       * @param  {Array}  array    Array we want to change
       * @param  {Number} oldIndex Old index the element lives
       * @param  {Number} newIndex The new index we want to the element to be
       */
      move : function(array, oldIndex, newIndex) {
        let k;

        if (newIndex >= array.length) {
          k = newIndex - array.length;
          while ((k--) + 1) {
            array.push(_util.noop);
          }
        }
        array.splice(newIndex, 0, array.splice(oldIndex, 1)[0]);
      },

      /**
       * Swap two elements in an array
       *
       * @method  swap
       * @public
       * @param  {Array}  array    Array we want to change
       * @param  {Number} oldIndex Old index the element lives
       * @param  {Number} newIndex The new index we want to the element to be
       */
      swap : function(array, oldIndex, newIndex) {
        let temp = array[oldIndex];

        array[oldIndex] = array[newIndex];
        array[newIndex] = temp;
      },

      /**
       * Searches an Array of objects for a value in a specific key
       *
       * @method search
       * @public
       * @param  {String}       field   Field we want to search
       * @param  {Array}        array   Array of Objects we want to search
       * @param  {String}       value   Value we are searching for
       * @return {Object|null}          The object we found that contains the value in its key
       */
      search : function(field, array, value) {
        if (!Array.isArray(array)) {
          return false;
        }
        const l = array.length;
        let i,
            found = null;
        for (i = 0; i < l; i++) {
          if (array[i][field] === value) {
            found = array[i];
          }
        }

        return found;
      },

      /**
       * Checks 2 arrays if are equls
       *
       * @method areEquals
       * @public
       * @param  {Array}    arr1   Array 1 we want to check
       * @param  {Array}    arr2   Array 2 we want to check
       * @return {Boolean}         True if equal, false otherwise
       */
      areEquals(arr1, arr2) {
        if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
          return false;
        }
        return JSON.stringify(arr1) === JSON.stringify(arr2);
      }
    },
    /**
     * The util.date component
     *
     * @class util.date
     */
    date : {
      /**
       * Date formating for chart usage.
       *
       * @method   formatForChart
       * @private
       * @param    {Number}   timestamp  Timestamp
       * @return   {String}              Formated date.
       */
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
       * Creates an object composed of the inverted keys and values of object. If object
       * contains duplicate values, subsequent values overwrite property assignments of previous values.
       *
       * @method invert
       * @public
       * @param {Object}  object  The object to invert.
       * @return {Object}         The new inverted object
       */
      invert : function() {
        return _.invert.apply(this, arguments);
      },

      /**
       * This method is like _.find except that it returns the key of the first element predicate
       * returns truthy for instead of the element itself.
       *
       * @method findKey
       * @public
       * @param {Object}    object     The object to inspect.
       * @param {Function}  predicate  The function invoked per iteration.
       * @return {*}                   Returns the key of the matched element, else undefined.
       */
      findKey : function() {
        return _.findKey.apply(this, arguments);
      },

      /**
       * Iterates over own enumerable string keyed properties of an object and invokes iteratee for each property.
       * The iteratee is invoked with three arguments: (value, key, object).
       * Iteratee functions may exit iteration early by explicitly returning false.
       *
       * @method forOwn
       * @public
       * @param {Object}   object     The object to iterate over.
       * @param {Function} iteratee   The function invoked per iteration.
       * @return {Object}             object.
       */
      forOwn : function() {
        return _.forOwn.apply(this, arguments);
      },

      /**
       * Creates an array of the own enumerable string keyed property values of object.
       *
       * @method values
       * @public
       * @param   {Object} object   The object to query.
       * @return  {Array}           Returns the array of property values.
       */
      values : function() {
        return _.values.apply(this, arguments);
      },

      /**
       * Creates an object composed of the picked object properties.
       *
       * @method pick
       * @public
       * @param  {Object}                object   The source object.
       * @param  {...(string|string[])}  [props]  The property identifiers to pick.
       * @return {Object}                         Returns the new object.
       */
      pick : function() {
        return _.pick.apply(this, arguments);
      },

      /**
       * This method iterates over own and inherited source properties.
       *
       * @method extend
       * @public
       * @param  {Object}    object  The destination object.
       * @params {...Object} sources The source objects.
       * @return {Object}            Returns object.
       */
      extend : function() {
        return _.extend.apply(this, arguments);
      },

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
       * Creates an array of the own enumerable property names of object.
       *
       * @method keys
       * @public
       * @param  {Object} obj The object to query.
       * @return {Array}      Returns the array of property names.
       */
      keys : function(obj) {
        if (this.isObject(obj)) {
          return Object.keys(obj);
        } else {
          _log('util : object : keys : Value passed is not an object');
          return _util.noop;
        }
      },

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
       * Creates an object with the same keys as object and values generated by running each own
       * enumerable string keyed property of object thru iteratee. The iteratee is invoked with
       * three arguments: (value, key, object).
       *
       * @method  mapValues
       * @public
       * @param  {Object}   object      The object to iterate over.
       * @param  {Function} [iteratee]  The function invoked per iteration.
       * @return {Object}               Returns the new mapped object.
       */
      mapValues : function() {
        return _.mapValues.apply(this, arguments);
      },

      /**
       * check mapValues documentation
       *
       * @method  mapObject
       * @public
       */
      mapObject : function() {
        this.mapValues.apply(this, arguments);
      },

      /**
       * This method is recursively merges own and inherited enumerable
       * string keyed properties of source objects into the destination object.
       * Source properties that resolve to undefined are skipped if a destination
       * value exists. Array and plain object properties are merged recursively.
       * Other objects and value types are overridden by assignment. Source objects
       * are applied from left to right. Subsequent sources overwrite property assignments
       * of previous sources.
       *
       * @method merge
       * @public
       * @param  {Object}    object     The destination object.
       * @params {...Object} [sources]  The source objects.
       * @return {Object}               Returns object.
       */
      merge : function() {
        return _.merge.apply(this, arguments);
      },

      /**
       * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
       *
       * TODO: IK : Test performance between lodash merge and yours.
       *
       * @method  mergeOld
       * @public
       * @param {Object}  obj1   Object to be overwritten
       * @param {Object}  obj2   Object to overwritten obj1
       * @return {Object}        A new object based on obj1 and obj2
       */
      mergeOld : function(obj1, obj2) {
        const obj3 = {};
        let attrname;

        if (!_isEmpty(obj1)) {
          for (attrname in obj1) {
            _objectSet(obj3, attrname,  _objectGet(obj1, attrname));
          }
        }

        if (!_isEmpty(obj2)) {
          for (attrname in obj2) {
            _objectSet(obj3, attrname,  _objectGet(obj2, attrname));
          }
        }

        return obj3;
      },

      /**
       * Checks 2 objects if they are equals
       *
       * @method areEquals
       * @public
       * @param  {Object} obj1  Object 1
       * @param  {Object} obj2  Object 2
       * @return {Boolean}      True if they are equals, false otherwise
       */
      areEquals : function(obj1, obj2) {
        if (obj1 && obj2 &&
            typeof obj1 === 'object' &&
            typeof obj2 === 'object') {

          if (Object.keys(obj1).length === Object.keys(obj2).length) {
            return Object.keys(obj1).every((key) => {
              return this.areEquals(obj1[key], obj2[key]);
            });
          } else {
            return false;
          }
        } else {
          return (obj1 === obj2);
        }
      },

      /**
       * Renames a key in an object
       *
       * @method renameKey
       * @public
       * @param  {Object} obj     Object which we want to rename the key
       * @param  {String} oldName The key we want to rename
       * @param  {String} newName The new name we want to give to the key
       */
      renameKey : function(obj, oldName, newName) {
        if (obj && typeof obj === 'object') {
          Object.defineProperty(obj, newName,
                  Object.getOwnPropertyDescriptor(obj, oldName));
          delete obj[oldName];
        }
      },

      /**
       * Checks if value is the language type of Object.
       * (e.g. arrays, functions, objects, regexes, new Number(0), and new String(''))
       *
       * @method  isObject
       * @public
       * @param {*}        value  The value to check.
       * @return {Boolean}        Returns true if value is an object, else false.
       */
      isObject : function() {
        return _.isObject.apply(this, arguments);
      },

      /**
       * Creates an object composed of the own and inherited enumerable property
       * paths of object that are not omitted.
       *
       * @method omit
       * @public
       * @param {Object} value  The object to loop over
       * @param {*}      paths  The check for what should be omitted
       * @return {Object} The newly created object
       */
      omit : function() {
        return _.omit.apply(this, arguments);
      },

      /**
       * Creates an object composed of the own and inherited enumerable string keyed properties of
       * object that predicate doesn't return truthy for
       *
       * @method omit
       * @public
       * @param {Object} value  The object to loop over
       * @param {*}      paths  The check for what should be omitted
       * @return {Object} The newly created object
       */
      omitBy : function() {
        return _.omitBy.apply(this, arguments);
      }
    },

    /**
     * The util.random component
     *
     * @class util.random
     */
    random : {

      /**
       * Generates a unique ID. If prefix is given, the ID is appended to it.
       *
       * @method uniqueId
       * @public
       * @param  {String} [prefix]  The value to prefix the ID with.
       * @return {String}           Returns the unique ID.
       */
      uniqueId : function() {
        return _.uniqueId.apply(this, arguments);
      },

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
});

export default util;
