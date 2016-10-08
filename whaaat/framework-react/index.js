/**
 * @module framework
 * @main framework
 * @namespace framework
 */

import * as importedModules from './src/index';

let modules   = {};

const framework = (function() {

    /*!
     * Fetches all the files in specified folder.
     *
     * @method _fetchFiles
     * @private
     */
  function _fetchFiles() {
    // fetch module files
    Object.keys(importedModules).forEach(function(module) {
      modules[module] = importedModules[module];
    });
  }

    /*!
     * Initialize module dependencies and module it self
     *
     * @method initializeModule
     * @private
     * @param  {Object} mod Module we want to initialize
     */
  function initializeModule(mod) {
    mod.requires.forEach(function(required) {
      if (typeof modules[required] === 'function') {
        modules[required] = modules[required]();
        initializeModule(modules[required]);
      }

      if (!mod.__initialized__) {
        mod._init_(modules);
        mod.__initialized__ = true;
      }
    });
  }
  return {
      /**
       * Initializes the framework
       *
       * @method  initialize
       * @public
       * @return {Object} Framework with its modules
       */
    initialize : function() {
      // Fetch modules
      _fetchFiles();

      Object.keys(modules).forEach(function(key) {
        if (typeof modules[key] === 'function') {
          modules[key] = modules[key]();
          initializeModule(modules[key]);
        }
      });
      modules.__initialized__ = true;
      return modules;
    }
  };
})();

export default framework;
