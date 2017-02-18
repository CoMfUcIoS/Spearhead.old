/**
 * @module framework
 * @submodule keymetrics
 * @namespace framework
 *
 * @returns {Object} Module component
 */

import pmx from 'pmx';

const keymetrics = function() {

  let _util;

  function _startHistorgram() {
    const probe = pmx.probe(),
        histogram = probe.histogram({
          name        : 'latency',
          measurement : 'mean'
        });
    let latency = 0;

    setInterval(function() {
      latency = Math.round(Math.random() * 100);
      histogram.update(latency);
    }, 100);
  }

  /**
   * The keymetrics component
   *
   * @class keymetrics
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
      /*eslint-enable dot-notation*/
    },

    start : function() {
      pmx.init({
        http    : true,
        network : true,  // Network monitoring at the application level
        ports   : true,  // Shows which ports your app is listening on (default: false)
      });

      _startHistorgram();
    }
  };
};

export default keymetrics;