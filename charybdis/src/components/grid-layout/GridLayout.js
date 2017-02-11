import Inferno   from 'inferno';
import Component from 'inferno-component';
import React from 'inferno-compat';
import isEqual from 'lodash.isequal';
import {autoBindHandlers, bottom, childrenEqual, cloneLayoutItem, compact, getLayoutItem, moveElement,
  synchronizeLayoutWithChildren, validateLayout} from './utils';
import GridItem from './GridItem';
const noop = function() {};

import {ResizeEvent, DragEvent, Layout, LayoutItem} from './utils';


/**
 * A reactive, fluid grid layout with draggable, resizable components.
 */

export default class GridLayout extends Component {
  // TODO publish internal ReactClass displayName transform
  static displayName = "GridLayout";

  static defaultProps = {
    autoSize: true,
    cols: 12,
    className: '',
    rowHeight: 150,
    maxRows: Infinity, // infinite vertical growth
    layout: [],
    margin: [10, 10],
    isDraggable: true,
    isResizable: true,
    useCSSTransforms: true,
    verticalCompact: true,
    onLayoutChange: noop,
    onDragStart: noop,
    onDrag: noop,
    onDragStop: noop,
    onResizeStart: noop,
    onResize: noop,
    onResizeStop: noop
  };

  constructor(props) {
    super(props);
    this.state = {
      activeDrag: null,
      layout: synchronizeLayoutWithChildren(props.layout, props.children,
                                            props.cols, props.verticalCompact),
      mounted: false,
      oldDragItem: null,
      oldLayout: null,
      oldResizeItem: null,
    };
    autoBindHandlers(this, ['onDragStart', 'onDrag', 'onDragStop', 'onResizeStart', 'onResize', 'onResizeStop']);
  }

  componentDidMount() {
    this.setState({mounted: true});
    // Possibly call back with layout on mount. This should be done after correcting the layout width
    // to ensure we don't rerender with the wrong width.
    this.onLayoutMaybeChanged(this.state.layout, this.props.layout);
  }

  componentWillReceiveProps(nextProps) {
    let newLayoutBase;
    // Allow parent to set layout directly.
    if (!isEqual(nextProps.layout, this.props.layout)) {
      newLayoutBase = nextProps.layout;
    }

    // If children change, also regenerate the layout. Use our state
    // as the base in case because it may be more up to date than
    // what is in props.
    else if (!childrenEqual(this.props.children, nextProps.children)) {
      newLayoutBase = this.state.layout;
    }

    // We need to regenerate the layout.
    if (newLayoutBase) {
      const newLayout = synchronizeLayoutWithChildren(newLayoutBase, nextProps.children,
                                                      nextProps.cols, nextProps.verticalCompact);
      const oldLayout = this.state.layout;
      this.setState({layout: newLayout});
      this.onLayoutMaybeChanged(newLayout, oldLayout);
    }
  }

  /**
   * Calculates a pixel value for the container.
   * @return {String} Container height in pixels.
   */
  containerHeight() {
    if (!this.props.autoSize) return;
    const nbRow = bottom(this.state.layout);
    const containerPaddingY = this.props.containerPadding ? this.props.containerPadding[1] : this.props.margin[1];
    return nbRow * this.props.rowHeight + (nbRow - 1) * this.props.margin[1] + containerPaddingY * 2 + 'px';
  }

  /**
   * When dragging starts
   * @param {String} i Id of the child
   * @param {Number} x X position of the move
   * @param {Number} y Y position of the move
   * @param {Event} e The mousedown event
   * @param {Element} node The current dragging DOM element
   */
  onDragStart(i, x, y, {e, node}) {
    const {layout} = this.state;
    var l = getLayoutItem(layout, i);
    if (!l) return;

    this.setState({oldDragItem: cloneLayoutItem(l), oldLayout: this.state.layout});

    this.props.onDragStart(layout, l, l, null, e, node);
  }

  /**
   * Each drag movement create a new dragelement and move the element to the dragged location
   * @param {String} i Id of the child
   * @param {Number} x X position of the move
   * @param {Number} y Y position of the move
   * @param {Event} e The mousedown event
   * @param {Element} node The current dragging DOM element
   */
  onDrag(i, x, y, {e, node}) {
    const {oldDragItem} = this.state;
    let {layout} = this.state;
    var l = getLayoutItem(layout, i);
    if (!l) return;

    // Create placeholder (display only)
    var placeholder = {
      w: l.w, h: l.h, x: l.x, y: l.y, placeholder: true, i: i
    };

    // Move the element to the dragged location.
    layout = moveElement(layout, l, x, y, true /* isUserAction */);

    this.props.onDrag(layout, oldDragItem, l, placeholder, e, node);

    this.setState({
      layout: compact(layout, this.props.verticalCompact),
      activeDrag: placeholder
    });
  }

  /**
   * When dragging stops, figure out which position the element is closest to and update its x and y.
   * @param  {String} i Index of the child.
   * @param {Number} x X position of the move
   * @param {Number} y Y position of the move
   * @param {Event} e The mousedown event
   * @param {Element} node The current dragging DOM element
   */
  onDragStop(i, x, y, {e, node}) {
    const {oldDragItem} = this.state;
    let {layout} = this.state;
    const l = getLayoutItem(layout, i);
    if (!l) return;

    // Move the element here
    layout = moveElement(layout, l, x, y, true /* isUserAction */);

    this.props.onDragStop(layout, oldDragItem, l, null, e, node);

    // Set state
    const newLayout = compact(layout, this.props.verticalCompact);
    const {oldLayout} = this.state;
    this.setState({
      activeDrag: null,
      layout: newLayout,
      oldDragItem: null,
      oldLayout: null,
    });

    this.onLayoutMaybeChanged(newLayout, oldLayout);
  }

  onLayoutMaybeChanged(newLayout, oldLayout) {
    if (!oldLayout) oldLayout = this.state.layout;
    if (!isEqual(oldLayout, newLayout)) {
      this.props.onLayoutChange(newLayout);
    }
  }

  onResizeStart(i, w, h, {e, node}) {
    const {layout} = this.state;
    var l = getLayoutItem(layout, i);
    if (!l) return;

    this.setState({
      oldResizeItem: cloneLayoutItem(l),
      oldLayout: this.state.layout
    });

    this.props.onResizeStart(layout, l, l, null, e, node);
  }

  onResize(i, w, h, {e, node}) {
    const {layout, oldResizeItem} = this.state;
    var l = getLayoutItem(layout, i);
    if (!l) return;

    // Set new width and height.
    l.w = w;
    l.h = h;

    // Create placeholder element (display only)
    var placeholder = {
      w: w, h: h, x: l.x, y: l.y, static: true, i: i
    };

    this.props.onResize(layout, oldResizeItem, l, placeholder, e, node);

    // Re-compact the layout and set the drag placeholder.
    this.setState({
      layout: compact(layout, this.props.verticalCompact),
      activeDrag: placeholder
    });
  }

  onResizeStop(i, w, h, {e, node}) {
    const {layout, oldResizeItem} = this.state;
    var l = getLayoutItem(layout, i);

    this.props.onResizeStop(layout, oldResizeItem, l, null, e, node);

    // Set state
    const newLayout = compact(layout, this.props.verticalCompact);
    const {oldLayout} = this.state;
    this.setState({
      activeDrag: null,
      layout: newLayout,
      oldResizeItem: null,
      oldLayout: null
    });

    this.onLayoutMaybeChanged(newLayout, oldLayout);
  }

  /**
   * Create a placeholder object.
   * @return {Element} Placeholder div.
   */
  placeholder() {
    const {activeDrag} = this.state;
    if (!activeDrag) return null;
    const {width, cols, margin, containerPadding, rowHeight, maxRows, useCSSTransforms} = this.props;

    // {...this.state.activeDrag} is pretty slow, actually
    return (
      <GridItem
        w={activeDrag.w}
        h={activeDrag.h}
        x={activeDrag.x}
        y={activeDrag.y}
        i={activeDrag.i}
        className="grid-placeholder"
        containerWidth={width}
        cols={cols}
        margin={margin}
        containerPadding={containerPadding || margin}
        maxRows={maxRows}
        rowHeight={rowHeight}
        isDraggable={false}
        isResizable={false}
        useCSSTransforms={useCSSTransforms}>
        <div />
      </GridItem>
    );
  }

  /**
   * Given a grid item, set its style attributes & surround in a <Draggable>.
   * @param  {Element} child React element.
   * @return {Element}       Element wrapped in draggable and properly placed.
   */
  processGridItem(child) {
    if (!child.key) return;
    const l = getLayoutItem(this.state.layout, child.key);
    if (!l) return null;
    const {width, cols, margin, containerPadding, rowHeight,
           maxRows, isDraggable, isResizable, useCSSTransforms,
           draggableCancel, draggableHandle} = this.props;
    const {mounted} = this.state;

    // Parse 'static'. Any properties defined directly on the grid item will take precedence.
    const draggable = Boolean(!l.static && isDraggable && (l.isDraggable || l.isDraggable == null));
    const resizable = Boolean(!l.static && isResizable && (l.isResizable || l.isResizable == null));

    return (
      <GridItem
        containerWidth={width}
        cols={cols}
        margin={margin}
        containerPadding={containerPadding || margin}
        maxRows={maxRows}
        rowHeight={rowHeight}
        cancel={draggableCancel}
        handle={draggableHandle}
        onDragStop={this.onDragStop}
        onDragStart={this.onDragStart}
        onDrag={this.onDrag}
        onResizeStart={this.onResizeStart}
        onResize={this.onResize}
        onResizeStop={this.onResizeStop}
        isDraggable={draggable}
        isResizable={resizable}
        useCSSTransforms={useCSSTransforms && mounted}
        usePercentages={!mounted}

        w={l.w}
        h={l.h}
        x={l.x}
        y={l.y}
        i={l.i}
        minH={l.minH}
        minW={l.minW}
        maxH={l.maxH}
        maxW={l.maxW}
        static={l.static}
        >
        {child}
      </GridItem>
    );
  }

  render() {
    const {className, style} = this.props;

    const mergedClassName = `grid-layout ${className}`;
    const mergedStyle = {
      height: this.containerHeight(),
      ...style
    };

    return (
      <div className={mergedClassName} style={mergedStyle}>
        {React.Children.map(this.props.children, (child) => this.processGridItem(child))}
        {this.placeholder()}
      </div>
    );
  }
}
