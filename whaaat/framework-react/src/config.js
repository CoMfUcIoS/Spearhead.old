/**
 * @module framework
 * @submodule config
 * @namespace framework
 *
 * @returns {Object} Module component
 */

import _config from '../config.json';

const config = (function() {

  let _util,
      _obj,
      _BEConfig = {};

  /**
   * The config component
   *
   * @class config
   */
  return {

    /*!
     * Module dependencies
     *
     * @hidden
     * @type {Array}
     */
    requires : [
      'util'
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
      _util = requires['util'];
      _obj  = _util.object;
      /*eslint-enable dot-notation*/


      // Grabs command line arguments and saves them to config object.
      Object.keys(process.env).forEach((keyValue) => {

        _config[keyValue] = process.env[keyValue];

      });
    },
    /**
     * Retrieves a key from the config
     *
     * @method  get
     * @public
     * @param  {String} key Key we want to retrieve from the config
     * @return {*}     Value of the key in the config
     */
    get : function(key) {
      const value = _obj.get(_BEConfig, key, undefined);

      return (_util.toType(value) !== 'undefined') ? value : _obj.get(_config, key, undefined);
    },

    /**
     * Sets a new/ updates a key to the BEConfig object.
     *
     * @method  set
     * @public
     * @param  {String}  key   Name of the key we want to save
     * @param  {*}       value Value of the key
     * @return {Boolean}       True if we set the value, false otherwise
     */
    set : function(key, value) {
      if (_util.toType(key) !== 'string') {
        return false;
      }

      _obj.set(_BEConfig, key, value);

      return true;
    },

    /**
     * Sets the initial BE config object.
     *
     * @method  setBEConfig
     * @public
     * @param  {Object} obj Object we want to set as the BE config
     */
    setBEConfig : function(obj) {
      const object = (_util.toType(obj) === 'string') ? JSON.parse(obj) : obj;
      if (_util.toType(object) === 'object') {
        _BEConfig = object;
      }
    },

    /**
     * Returns the BEconfig changes so far so we can
     * save it to the BE
     *
     * @method  getBEConfig
     * @public
     * @return {Object} Object to be saved to the BE
     */
    getBEConfig : function() {
      return _BEConfig;
    }
  };
});

export default config;
