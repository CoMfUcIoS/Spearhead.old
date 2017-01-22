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

  function _startAlerts() {
    const  probe = pmx.probe();

    probe.metric({
      name  : 'CPU usage',
      value : function() {
            return cpu_usage; //eslint-disable-line
      },
      alert : {
        mode   : 'threshold',
        value  : 95,
        msg    : 'Detected over 95% CPU usage', // optional
        action : function() { //optional
          _util.log('WARNING : Detected over 95% CPU usage');
        },
        cmp : function(value, threshold) { //optional
          return (parseFloat(value) > threshold); // default check
        }
      }
    });
  }

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

      _startAlerts();
      _startHistorgram();
    }
  };
};

export default keymetrics;
