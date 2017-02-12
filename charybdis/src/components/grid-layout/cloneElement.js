// @flow
import Inferno   from 'inferno';
import Component from 'inferno-component';
import React from 'inferno-compat';

// React.addons.cloneWithProps look-alike that merges style & className.
module.exports = function cloneElement(element, props) {
  if (props.style && element.props.style) {
    props.style = { ...element.props.style, ...props.style };
  }
  if (props.className && element.props.className) {
    props.className = `${element.props.className} ${props.className}`;
  }
  return React.cloneElement(element, props);
};
