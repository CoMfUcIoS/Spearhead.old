/**
 * @module framework
 * @submodule config
 * @namespace framework
 *
 * @return {Object} Module component
 */

import fs from 'fs';
import path from 'path';

const config = function() {

  const _config  = JSON.parse(fs.readFileSync(path.resolve() + '/config.json'));

  let _util,
      _obj;

  // Grabs command line arguments and saves them to config object.
  process.argv.forEach((keyValue) => {
    let split,
        key;
    // We need to use -- before each key ex. --port=1221
    if (keyValue.indexOf('--') === 0) {
      split = keyValue.split('=');
      if (split.length === 2) {
        key = split[0].substring(2, split[0].length);
        if (typeof _config[key] === 'number') {
          _config[key] = parseInt(split[1], 10);
        } else if (typeof _config[key] === 'boolean') {
          _config[key] = (split[1] === 'true');
        } else {
          _config[key] = split[1];
        }
      }
    }
  });

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
      _util   = requires['util'];
      _obj    = _util.object;
      /*eslint-enable dot-notation*/
    },

    get : function(key) {
      return _obj.get(_config, key, undefined);
    }
  };
};

export default config;
