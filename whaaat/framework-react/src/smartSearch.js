/**
 * @module framework
 * @submodule smartSearch
 * @namespace framework
 *
 * @returns {Object} Module component
 */

'use strict';

const smartSearch = (function() {
  let _util,
      _obj;

  /*!
   * Set undefined passed options to a default value
   *
   * @method _buildOptions
   * @private
   * @param  {Object} options Options object passed to the module
   * @return {Object}         Sanitized Options object
   */
  function _buildOptions(options) {
    const defaultOptions = {
      caseSensitive : false,
      fieldMatching : false,
      maxInsertions : -1
    };
    if (options === undefined) {
      return defaultOptions;
    }
    for (var option in defaultOptions) {
      if (options[option] !== undefined) {
        defaultOptions[option] = options[option];
      }
    }
    return defaultOptions;
  }

  /*!
   * Sanitizes the array of patterns we want to search
   *
   * @method _sanitizeArray
   * @private
   * @param  {Array}    array           Array we want to sanitize
   * @param  {Boolean}  caseSensitive   True if it is caseSenitive false otherwise
   * @return {Array}                    Sanitized Array
   */
  function _sanitizeArray(array, caseSensitive) {
    const values = {},
        newArray = [];
    let element;

    if (array === undefined ||
        array.length === undefined ||
        array.length === 0) {
      _util.log('smartSearch : _sanitizeArray : passed Array is empty');
      return [];
    }

    array.forEach(function(elem) {
      if (typeof elem !== 'string') {
        return;
      }
      element = !caseSensitive ? elem.toLowerCase() : elem;
      if (element && (element in values) === false) {
        values[element] = true;
        newArray.push(element);
      }
    });
    return newArray;
  }

  /*!
   * Searches for patterns in the fields of entries array objects.
   *
   * @method _search
   * @private
   * @param  {Array}    options.entries   Array of Objects to be searched
   * @param  {Array}    options.patterns  Array of patterns to be searched
   * @param  {Array}    options.fields    Array of fields to be searched for patterns
   * @param  {Object}   options.options   Options object
   * @return {Array}                      Matching results
   */
  function _search({ entries, patterns, fields, options }) {
    const results = [];
    entries.forEach(function(entry) {
      let match = false;
      const entryMatch = [],
          entryResults = [];
      fields.forEach(function(field) {
        const fieldString = _getFieldString(entry, field);
        let fieldMatch = [],
            fieldResults;
        if (fieldString === null) {
          return;
        }
        fieldResults = { field : field, patterns : [] };
        patterns.forEach(function(pattern) {
          var res = _find(pattern, fieldString, options);
          if (res) {
            fieldResults.patterns.push(res);
            fieldMatch.push(pattern);
            if (entryMatch.indexOf(pattern) === -1) {
              entryMatch.push(pattern);
            }
          }
        });
        if (fieldMatch.length === patterns.length) {
          entryResults.push(fieldResults);
          match = true;
        } else if (options.fieldMatching === false &&
               fieldResults.patterns.length > 0) {
          entryResults.push(fieldResults);
        }
      });
      if ((options.fieldMatching === true && match === true) ||
    (options.fieldMatching === false &&
     entryMatch.length === patterns.length)) {
        results.push({
          entry : entry,
          info  : entryResults,
          score : _score(entryResults)
        });
      }
    });
    return results;
  }

  /*!
   * Gets the value of a key in an object
   * and checks it if it is a string
   *
   * @method _getFieldString
   * @private
   * @param  {Object} entry Object to be search for field
   * @param  {String} field Field/path we want to search
   * @return {String|null}       String Value or null
   */
  function _getFieldString(entry, field) {
    const current = _obj.get(entry, field, null);
    if (typeof current !== 'string') {
      return null;
    }
    return current;
  }

  /*!
   * Finds a pattern in a text
   *
   * @method _find
   * @private
   * @param  {String}     pattern   Pattern we want to search
   * @param  {String}     text      Text we want to search for a pattern
   * @param  {Object}     options   Searching options
   * @return {Object|null}          Results
   */
  function _find(pattern, text, options) {
    let match = false,
        insertions = null,
        matchIndexes = null,
        iPattern = 0,
        res = null;
    if (options.caseSensitive === false) {
      pattern = pattern.toLowerCase();
      text = text.toLowerCase();
    }
    for (var iText = 0; iText < text.length; iText++) {
      if (text[iText] === pattern[iPattern]) {
        res = _match({ pattern, text, iText, options });
        if (res && (match === false || res.insertions <= insertions)) {
          if (match === false || res.insertions < insertions) {
            match = true;
            insertions = res.insertions;
            matchIndexes = res.matchIndexes;
          } else {
            matchIndexes = matchIndexes.concat(res.matchIndexes);
          }
        }
      }
    }
    if (match) {
      return ({
        value        : pattern,
        insertions   : insertions,
        matchIndexes : matchIndexes
      });
    }
    return null;
  }

  /*!
   * Returns a score for the matching pattern
   *
   * @method _score
   * @private
   * @param  {Array} entryResults  Matching results
   * @return {Float}              Score float
   */
  function _score(entryResults) {
    let patternsMinInsertions = {},
        patternsMinMatchIndex = {},
        minInsertions = 0,
        minMatchIndex = [];
    entryResults.forEach(function(fieldResults) {
      fieldResults.patterns.forEach(function(pattern) {
        if (patternsMinInsertions[pattern.value] === undefined ||
        pattern.insertions < patternsMinInsertions[pattern.value]) {
          patternsMinInsertions[pattern.value] = pattern.insertions;
          patternsMinMatchIndex[pattern.value] = pattern.matchIndexes;
        }
      });
    });
    for (var pattern in patternsMinInsertions) {
      if (patternsMinInsertions.hasOwnProperty(pattern)) {
        minInsertions += patternsMinInsertions[pattern];
        minMatchIndex = minMatchIndex.concat(patternsMinMatchIndex[pattern]);
      }
    }
    return minInsertions + minMatchIndex.sort()[0] / 1000;
  }

  /*!
   * Check for match in the text
   *
   * @method _match
   * @private
   * @param  {String}       options.pattern   Pattern to be searched
   * @param  {String}       options.text      Text to be searched
   * @param  {Number}       options.iText     iText of the search
   * @param  {Objet}        options.options   Search options
   * @return {Object|null}                    Object with the results
   */
  function _match({ pattern, text, iText, options }) {
    let insertions   = 0,
        matchIndexes = [],
        iPattern     = 0,
        offset       = iText;

    for (iText = offset; iText < text.length; iText++) {
      if (text[iText] === pattern[iPattern]) {
        matchIndexes.push(iText);
        if (++iPattern === pattern.length) {
          return ({
            insertions   : insertions,
            matchIndexes : matchIndexes
          });
        }
      } else if (matchIndexes.length) {
        insertions++;
        if (options.maxInsertions > -1 &&
            insertions > options.maxInsertions) {
          return null;
        }
      }
    }
    return null;
  }


  /**
   * The smartSearch component
   *
   * @class smartSearch
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
    },

    /**
     * Searches entries for patterns in the specified fields
     *
     * @method search
     * @public
     * @param  {Array}          options.entries   Array of objects we want to search in
     * @param  {Array}          options.patterns  Patterns we want to search in entries
     * @param  {Array}          options.fields    Which fields we want to search for patterns
     * @param  {Object}         options.options   Search Options
     * @return {Array|Boolean}                    Results array or false if entries is empty
     */
    search : function({ entries, patterns, fields, options }) {
      let results;
      options = _buildOptions(options);
      patterns = _sanitizeArray(patterns, options.caseSensitive);
      if (entries.length === 0 || patterns.length === 0 || fields.length === 0) {
        _util.log('smartSearch : search : Entries Array is empty');
        return false;
      }
      results = _search({ entries, patterns, fields, options });
      results.sort(function(a, b) {
        return (a.score - b.score);
      });
      return results;
    }
  };
});

export default smartSearch;
