import Inferno   from 'inferno';
import Component from 'inferno-component';
import React from 'inferno-compat';
import { DraggableCore } from './Draggable';
import Resizable from './Resizable';
import { perc, setTopLeft, setTransform } from './utils';

import { DragCallbackData, Position } from './utils';


/**
 * An individual item within a ReactGridLayout.
 */
export default class GridItem extends Component {

  static defaultProps = {
    className : '',
    cancel    : '',
    minH      : 1,
    minW      : 1,
    maxH      : Infinity,
    maxW      : Infinity
  };

  constructor(props) {
    super(props);
  }

  // Helper for generating column width
  calcColWidth() {
    const { margin, containerPadding, containerWidth, cols } = this.props;
    return (containerWidth - (margin[0] * (cols - 1)) - (containerPadding[0] * 2)) / cols;
  }

  /**
   * Return position on the page given an x, y, w, h.
   * left, top, width, height are all in pixels.
   * @param  {Number}  x             X coordinate in grid units.
   * @param  {Number}  y             Y coordinate in grid units.
   * @param  {Number}  w             W coordinate in grid units.
   * @param  {Number}  h             H coordinate in grid units.
   * @return {Object}                Object containing coords.
   */
  calcPosition(x, y, w, h, state) {
    const { margin, containerPadding, rowHeight } = this.props;
    const colWidth = this.calcColWidth();

    const out = {
      left   : Math.round((colWidth + margin[0]) * x + containerPadding[0]),
      top    : Math.round((rowHeight + margin[1]) * y + containerPadding[1]),
      // 0 * Infinity === NaN, which causes problems with resize constraints;
      // Fix this if it occurs.
      // Note we do it here rather than later because Math.round(Infinity) causes deopt
      width  : w === Infinity ? w : Math.round(colWidth * w + Math.max(0, w - 1) * margin[0]),
      height : h === Infinity ? h : Math.round(rowHeight * h + Math.max(0, h - 1) * margin[1])
    };

    if (state && state.resizing) {
      out.width = Math.round(state.resizing.width);
      out.height = Math.round(state.resizing.height);
    }

    if (state && state.dragging) {
      out.top = Math.round(state.dragging.top);
      out.left = Math.round(state.dragging.left);
    }

    return out;
  }

  /**
   * Translate x and y coordinates from pixels to grid units.
   * @param  {Number} top  Top position (relative to parent) in pixels.
   * @param  {Number} left Left position (relative to parent) in pixels.
   * @return {Object} x and y in grid units.
   */
  calcXY(top, left) {
    const { margin, cols, rowHeight, w, h, maxRows } = this.props;
    const colWidth = this.calcColWidth();

    // left = colWidth * x + margin * (x + 1)
    // l = cx + m(x+1)
    // l = cx + mx + m
    // l - m = cx + mx
    // l - m = x(c + m)
    // (l - m) / (c + m) = x
    // x = (left - margin) / (coldWidth + margin)
    let x = Math.round((left - margin[0]) / (colWidth + margin[0]));
    let y = Math.round((top - margin[1]) / (rowHeight + margin[1]));

    // Capping
    x = Math.max(Math.min(x, cols - w), 0);
    y = Math.max(Math.min(y, maxRows - h), 0);

    return { x, y };
  }

  /**
   * Given a height and width in pixel values, calculate grid units.
   * @param  {Number} height Height in pixels.
   * @param  {Number} width  Width in pixels.
   * @return {Object} w, h as grid units.
   */
  calcWH({ height, width }) {
    const { margin, maxRows, cols, rowHeight, x, y } = this.props;
    const colWidth = this.calcColWidth();

    // width = colWidth * w - (margin * (w - 1))
    // ...
    // w = (width + margin) / (colWidth + margin)
    let w = Math.round((width + margin[0]) / (colWidth + margin[0]));
    let h = Math.round((height + margin[1]) / (rowHeight + margin[1]));

    // Capping
    w = Math.max(Math.min(w, cols - x), 0);
    h = Math.max(Math.min(h, maxRows - y), 0);
    return { w, h };
  }

  /**
   * This is where we set the grid item's absolute placement. It gets a little tricky because we want to do it
   * well when server rendering, and the only way to do that properly is to use percentage width/left because
   * we don't know exactly what the browser viewport is.
   * Unfortunately, CSS Transforms, which are great for performance, break in this instance because a percentage
   * left is relative to the item itself, not its container! So we cannot use them on the server rendering pass.
   *
   * @param  {Object} pos Position object with width, height, left, top.
   * @return {Object}     Style object.
   */
  createStyle(pos) {
    const { usePercentages, containerWidth, useCSSTransforms } = this.props;

    let style;
    // CSS Transforms support (default)
    if (useCSSTransforms) {
      style = setTransform(pos);
    }
    // top,left (slow)
    else {
      style = setTopLeft(pos);

      // This is used for server rendering.
      if (usePercentages) {
        style.left = perc(pos.left / containerWidth);
        style.width = perc(pos.width / containerWidth);
      }
    }

    return style;
  }

  /**
   * Mix a Draggable instance into a child.
   * @param  {Element} child    Child element.
   * @return {Element}          Child wrapped in Draggable.
   */
  mixinDraggable(child) {
    return (
      <DraggableCore
        onStart={this.onDragHandler('onDragStart')}
        onDrag={this.onDragHandler('onDrag')}
        onStop={this.onDragHandler('onDragStop')}
        handle={this.props.handle}
        cancel={'.resizable-handle' + (this.props.cancel ? ',' + this.props.cancel : '')}>
        {child}
      </DraggableCore>
    );
  }

  /**
   * Mix a Resizable instance into a child.
   * @param  {Element} child    Child element.
   * @param  {Object} position  Position object (pixel values)
   * @return {Element}          Child wrapped in Resizable.
   */
  mixinResizable(child, position) {
    const { cols, x, minW, minH, maxW, maxH } = this.props;

    // This is the max possible width - doesn't go to infinity because of the width of the window
    const maxWidth = this.calcPosition(0, 0, cols - x, 0).width;

    // Calculate min/max constraints using our min & maxes
    const mins = this.calcPosition(0, 0, minW, minH);
    const maxes = this.calcPosition(0, 0, maxW, maxH);
    const minConstraints = [mins.width, mins.height];
    const maxConstraints = [Math.min(maxes.width, maxWidth), Math.min(maxes.height, Infinity)];
    return (
      <Resizable
        width={position.width}
        height={position.height}
        minConstraints={minConstraints}
        maxConstraints={maxConstraints}
        onResizeStop={this.onResizeHandler('onResizeStop')}
        onResizeStart={this.onResizeHandler('onResizeStart')}
        onResize={this.onResizeHandler('onResize')}>
        {child}
      </Resizable>
    );
  }

  /**
   * Wrapper around drag events to provide more useful data.
   * All drag events call the function with the given handler name,
   * with the signature (index, x, y).
   *
   * @param  {String} handlerName Handler name to wrap.
   * @return {Function}           Handler function.
   */
  onDragHandler(handlerName) {
    return (e, { node, deltaX, deltaY }) => {
      if (!this.props[handlerName]) { return; }

      const newPosition = { top : 0, left : 0 };

      // Get new XY
      switch (handlerName) {
        case 'onDragStart': {
          // ToDo this wont work on nested parents
          const parentRect = node.offsetParent.getBoundingClientRect();
          const clientRect = node.getBoundingClientRect();
          newPosition.left = clientRect.left - parentRect.left;
          newPosition.top = clientRect.top - parentRect.top;
          this.setState({ dragging : newPosition });
          break;
        }
        case 'onDrag':
          if (!this.state.dragging) { throw new Error('onDrag called before onDragStart.'); }
          newPosition.left = this.state.dragging.left + deltaX;
          newPosition.top = this.state.dragging.top + deltaY;
          this.setState({ dragging : newPosition });
          break;
        case 'onDragStop':
          if (!this.state.dragging) { throw new Error('onDragEnd called before onDragStart.'); }
          newPosition.left = this.state.dragging.left;
          newPosition.top = this.state.dragging.top;
          this.setState({ dragging : null });
          break;
        default:
          throw new Error('onDragHandler called with unrecognized handlerName: ' + handlerName);
      }

      const { x, y } = this.calcXY(newPosition.top, newPosition.left);

      this.props[handlerName](this.props.i, x, y, { e, node, newPosition });
    };
  }

  /**
   * Wrapper around drag events to provide more useful data.
   * All drag events call the function with the given handler name,
   * with the signature (index, x, y).
   *
   * @param  {String} handlerName Handler name to wrap.
   * @return {Function}           Handler function.
   */
  onResizeHandler(handlerName) {
    return (e, { node, size }) => {
      if (!this.props[handlerName]) { return; }
      const { cols, x, i, maxW, minW, maxH, minH } = this.props;

      // Get new XY
      let { w, h } = this.calcWH(size);

      // Cap w at numCols
      w = Math.min(w, cols - x);
      // Ensure w is at least 1
      w = Math.max(w, 1);

      // Min/max capping
      w = Math.max(Math.min(w, maxW), minW);
      h = Math.max(Math.min(h, maxH), minH);

      this.setState({ resizing : handlerName === 'onResizeStop' ? null : size });

      this.props[handlerName](i, w, h, { e, node, size });
    };
  }

  render() {
    const { x, y, w, h, isDraggable, isResizable, useCSSTransforms } = this.props;

    const pos = this.calcPosition(x, y, w, h, this.state);
    const child = React.Children.only(this.props.children);

    // Create the child element. We clone the existing element but modify its className and style.
    let newChild = React.cloneElement(child, {
      // Munge a classname. Use passed in classnames and resizing.
      // React will merge the classNames.
      className : [
        'grid-item',
        child.props.className || '',
        this.props.className,
        this.props['static'] ? 'static' : '',
        this.state.resizing ? 'resizing' : '',
        this.state.dragging ? 'draggable-dragging' : '',
        useCSSTransforms ? 'cssTransforms' : ''
      ].join(' '),
      // We can set the width and height on the child, but unfortunately we can't set the position.
      style : { ...this.props.style, ...child.props.style, ...this.createStyle(pos) }
    });

    // Resizable support. This is usually on but the user can toggle it off.
    if (isResizable) {
      return this.mixinResizable(newChild, pos);
    }
    // Draggable support. This is always on, except for with placeholders.
    if (isDraggable) {
      return this.mixinDraggable(newChild);
    }
    return newChild;
  }
}