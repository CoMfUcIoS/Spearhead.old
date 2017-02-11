'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.PageContext = exports.createPage = undefined;

var _PageContext = require('./PageContext');

Object.defineProperty(exports, 'PageContext', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_PageContext).default;
  }
});

var _createPage2 = require('./createPage');

var _createPage3 = _interopRequireDefault(_createPage2);

var _PageContext2 = _interopRequireDefault(_PageContext);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.createPage = _createPage3.default; /**
                                            * Babel Starter Kit (https://www.kriasoft.com/babel-starter-kit)
                                            *
                                            * Copyright © 2015-2016 Kriasoft, LLC. All rights reserved.
                                            *
                                            * This source code is licensed under the MIT license found in the
                                            * LICENSE.txt file in the root directory of this source tree.
                                            */

exports.default = _PageContext2.default;