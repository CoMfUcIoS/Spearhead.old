/**
 * @module framework
 * @main framework
 * @namespace framework
 */

import fs   from 'fs';
import path from 'path';
import _    from 'lodash';

const framework = (function() {


  var _modules   = {},
      _neededMods;

  /*!``
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
        _modules[file.replace(/\.[^/.]+$/, '')] = folder + file;
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
      //check if its in the mods array the user passed. if
      //this array is empty then load everything.
      if (_neededMods.length > 0 && _neededMods.indexOf(required) < 0) {
        _neededMods.push(required);
        _modules[required] = require(_modules[required])['default'];
      }
      if (typeof _modules[required] === 'function') {
        _modules[required] = _modules[required]();
        initializeModule(_modules[required]);
      }
    });

    if (!mod.__initialized__) {
      mod._init_(_modules);
      mod.__initialized__ = true;
    }

  }
  return {
    /**
     * Initializes the framework
     *
     * @method  initialize
     * @public
     * @param   {Array}   mods  Array with the modules we want to init
     * @return  {Object}  Framework with its modules
     */
    initialize : function(mods) {
      _neededMods = (Array.isArray(mods)) ? mods : [];

      // Fetch services
      _fetchFiles('./src/services/');
      // Fetch modules
      _fetchFiles('./src/');

      mods.forEach((mod) =>{
        // load the file of required.
        _modules[mod] = require(_modules[mod])['default'];
      });

      Object.keys(_modules).forEach((key) => {
        //check if its in the mods array the user passed. if
        //this array is empty then load everything.
        if (_neededMods.length > 0 && _neededMods.indexOf(key) < 0) {
          return;
        }

        if (typeof _modules[key] === 'function') {
          _modules[key] = _modules[key]();
          initializeModule(_modules[key]);
        }
      });
      _modules.__initialized__ = true;

      if (_modules && _modules.util && _modules.util.__initialized__) {
        _modules = _modules.util.object.pick(_modules, _neededMods);
      } else {
        _modules = _.pick(_modules, _neededMods);
      }

      if (_modules && _modules.events && _modules.events.trigger) {
        _modules.events.trigger('framework initialized');
      }

      return _modules;
    }
  };

})();

export default framework;
