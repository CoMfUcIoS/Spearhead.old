/**
 * @module framework
 * @main framework
 * @namespace framework
 */

import fs from 'fs';
import path from 'path';

const framework = (function() {


  var modules   = {};

  /*!
   * Fetches all the files in specified folder.
   *
   * @method _fetchFiles
   * @private
   * @param  {String} folder Relative folder path
   */
  function _fetchFiles(folder) {
    // fetch module files
    fs.readdirSync(path.join(__dirname, folder))
      .filter(function(file) { return file.substr(-3) === '.js'; })
      .forEach(function(file) {
        modules[file.replace(/\.[^/.]+$/, '')] = require(folder + file).default;
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
    mod.requires.forEach((required) => {
      if (typeof modules[required] === 'function') {
        modules[required] = modules[required]();
        initializeModule(modules[required]);
      }
    });

    if (!mod.__initialized__) {
      mod._init_(modules);
      mod.__initialized__ = true;
    }

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
        // Fetch services
      _fetchFiles('./src/services/');
        // Fetch modules
      _fetchFiles('./src/');

      Object.keys(modules).forEach((key) => {
        if (typeof modules[key] === 'function') {
          modules[key] = modules[key]();
          initializeModule(modules[key]);
        }
      });
      modules.__initialized__ = true;

      modules.events.trigger('framework initialized');
      return modules;
    }
  };

})();

export default framework;
