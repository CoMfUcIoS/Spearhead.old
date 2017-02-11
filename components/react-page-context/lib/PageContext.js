'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _react = require('react');

var _createPage = require('./createPage');

var _createPage2 = _interopRequireDefault(_createPage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * React Page Context (https://github.com/kriasoft/react-page-context)
 *
 * Copyright © 2016 Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

var PageContext = function (_Component) {
  (0, _inherits3.default)(PageContext, _Component);

  function PageContext(props, context) {
    (0, _classCallCheck3.default)(this, PageContext);

    var _this = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(PageContext).call(this, props, context));

    _this.page = props.page || (0, _createPage2.default)({ onChange: _this.props.onChange });
    return _this;
  }

  (0, _createClass3.default)(PageContext, [{
    key: 'getChildContext',
    value: function getChildContext() {
      return { page: this.page };
    }
  }, {
    key: 'render',
    value: function render() {
      return this.props.children;
    }
  }]);
  return PageContext;
}(_react.Component);

PageContext.propTypes = {
  page: _react.PropTypes.func,
  onChange: _react.PropTypes.func,
  children: _react.PropTypes.element.isRequired
};
PageContext.childContextTypes = {
  page: _react.PropTypes.func.isRequired
};
exports.default = PageContext;