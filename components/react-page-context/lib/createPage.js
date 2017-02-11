'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _Page = require('./Page');

var _Page2 = _interopRequireDefault(_Page);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var cache = void 0; /**
                     * React Page Context (https://github.com/kriasoft/react-page-context)
                     *
                     * Copyright © 2016 Kriasoft, LLC. All rights reserved.
                     *
                     * This source code is licensed under the MIT license found in the
                     * LICENSE.txt file in the root directory of this source tree.
                     */

var canUseDOM = void 0;
var metaKeys = ['name', 'property', 'httpEquiv'];

function metaKeyToAttr(key) {
  return key === 'httpEquiv' ? 'http-equiv' : key;
}

function page(options, data) {
  var notifyChange = false;

  // Calling context.page() without any arguments returns the current's page metadata
  if (!data) {
    return options.cache;
  }

  var title = data.title;
  var description = data.description;
  var _data$meta = data.meta;
  var meta = _data$meta === undefined ? [] : _data$meta;

  // Set page title
  // -------------------------------------------------------------------------

  if (title !== undefined && options.cache.title !== title) {
    options.cache.title = title; // eslint-disable-line no-param-reassign

    if (options.canUseDOM && document.title !== title) {
      document.title = title;
    }

    notifyChange = true;
  }

  // Set page description
  // -------------------------------------------------------------------------
  if (description !== undefined) {
    meta.unshift({ name: 'description', content: description });
  }

  // Set meta tags
  // -------------------------------------------------------------------------
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator3.default)(meta), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var item = _step.value;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        var _loop = function _loop() {
          var key = _step2.value;
          // e.g. "name"
          var keyValue = item[key]; // e.g. "description"

          if (keyValue === undefined) {
            return 'continue';
          }

          var attr = metaKeyToAttr(key); // "httpEquiv" => "http-equiv"

          var node = void 0;
          var metaItem = options.cache.meta.find(function (x) {
            return x[attr] === keyValue;
          });

          if (metaItem) {
            if (metaItem.content === item.content) {
              return 'continue';
            }

            if (options.canUseDOM) {
              if (key === 'name' && keyValue === 'description') {
                node = document.querySelector('meta[name="description"]');
                if (node) {
                  node.parentNode.removeChild(node);
                  node = undefined;
                }
              } else {
                node = document.querySelector('meta[' + attr + '="' + keyValue + '"]');
              }
            }

            metaItem.content = item.content;
          } else {
            var _metaItem;

            metaItem = (_metaItem = {}, (0, _defineProperty3.default)(_metaItem, attr, keyValue), (0, _defineProperty3.default)(_metaItem, 'content', item.content), _metaItem);
            options.cache.meta.push(metaItem);
          }

          if (options.canUseDOM) {
            if (node) {
              node.setAttribute('content', item.content);
            } else {
              node = document.createElement('meta');
              node.setAttribute(attr, keyValue);
              node.setAttribute('content', item.content);
              document.head.appendChild(node);
            }
          }

          notifyChange = true;
        };

        for (var _iterator2 = (0, _getIterator3.default)(metaKeys), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _ret = _loop();

          if (_ret === 'continue') continue;
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  if (notifyChange && options.onChange) {
    options.onChange(options.cache);
  }

  return undefined;
}

function createPage() {
  var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  var onChange = _ref.onChange;

  canUseDOM = canUseDOM === undefined ? !!(typeof window !== 'undefined' && window.document && window.document.createElement) : canUseDOM;
  return page.bind(undefined, { cache: cache || new _Page2.default(), canUseDOM: canUseDOM, onChange: onChange });
}

exports.default = createPage;