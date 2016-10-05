/**
 * @module framework
 * @submodule storage
 * @namespace framework
 *
 * @return {Object} Module component
 */

import $ from 'jquery-deferred';
import * as _storage from 'node-persist';

const storage = function() {
  let _util,
      _config;

  /**
   * The storage component
   *
   * @class storage
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
      _util   = requires['util'];
      _config = requires['config'];
      /*eslint-enable dot-notation*/

      _storage.initSync({ // We need it syncronous to get the data after a crash.
        dir      : 'data',
        encoding : 'utf8',
        logging  : _config.get('debugging')
      }, function() {
        _util.log('is it really initialised ?');
      });

    },

    /**
     * Saves the client
     *
     * @method  save
     * @public
     * @param  {String} uToken   User token from the backend API
     * @param  {Object} data     Data object to be saved for this user
     *                           ex. {
     *                             sessionId: 'c16886c3-e328-a996-0e7d-b44183f28755',
     *                             socketId: '/#Yuosfi4p8OTPhXCQAAAA'
     *                           }
     * @return {Object}         Promise ll be resolved if user saves successfuly, ll be
     *                           rejected otherwise
     */
    save : function(uToken, data) {
      const $dfd = $.Deferred();

      if (!uToken) {
        _util.log('Storage : save : No uToken passed.');
        return $dfd.reject();
      }
      _storage.setItem(uToken, data,
            function() {
              return $dfd.resolve();
            },
            function() {
              return $dfd.reject();
            });

      return $dfd.promise();
    },
    /**
     * Gets stored data for the specified client
     *
     * @method  get
     * @public
     * @param  {String}  uToken   User token we want to fetch.
     * @return {Object}           Promise Object
     */
    get : function(uToken) {
      const $dfd = $.Deferred();

      if (!uToken) {
        $dfd.reject('Storage : get : No uToken passed ');
      }
      _storage.getItem(uToken,
            function(data) {
              return $dfd.resolve(data);
            },
            (err) => {
              return $dfd.reject(err);
            });

      return $dfd.promise();
    },
    /**
     * Gets stored data Synchronously for the specified client
     *
     * @method  getSync
     * @public
     * @param  {String}   uToken   User token we want to fetch.
     * @return {Object}            Returns null on error and data on success.
     */
    getSync : function(uToken) {
      if (!uToken) {
        _util.log('Storage : getSync : No uToken passed ');
        return null;
      }
      return _storage.getItemSync(uToken);
    },
    /**
     * Returns the number of users are connected.
     *
     * @method  connected
     * @public
     * @return {Number} Total of users connected
     */
    connected : function() {
      return _storage.length();
    },

    remove : function(uToken) {
      if (!uToken) {
        _util.log('Storage : remove : no uToken passed');
        return null;
      }
      return _storage.removeItem(uToken);
    }
  };
};

export default storage;
