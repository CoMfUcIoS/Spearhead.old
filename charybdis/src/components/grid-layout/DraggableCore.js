import Inferno, { linkEvent }  from 'inferno';
import Component from 'inferno-component';
import React from 'inferno-compat';
import {matchesSelectorAndParentsTo, addEvent, removeEvent, addUserSelectStyles, getTouchIdentifier,
        removeUserSelectStyles, styleHacks} from './utils/domFns';
import {createCoreData, getControlPosition, snapToGrid} from './utils/positionFns';
import {dontSetMe} from './utils/shims';
import log from './utils/log';

import {EventHandler} from './utils/types';

// Simple abstraction for dragging events names.
const eventsFor = {
  touch: {
    start: 'touchstart',
    move: 'touchmove',
    stop: 'touchend'
  },
  mouse: {
    start: 'mousedown',
    move: 'mousemove',
    stop: 'mouseup'
  }
};

// Default to mouse events.
let dragEventFor = eventsFor.mouse;

//
// Define <DraggableCore>.
//
// <DraggableCore> is for advanced usage of <Draggable>. It maintains minimal internal state so it can
// work well with libraries that require more control over the element.
//

export default class DraggableCore extends Component {

  static displayName = 'DraggableCore';

  static defaultProps = {
    allowAnyClick: false, // by default only accept left click
    cancel: null,
    disabled: false,
    enableUserSelectHack: true,
    offsetParent: null,
    handle: null,
    grid: null,
    transform: null,
    onStart: function(){},
    onDrag: function(){},
    onStop: function(){},
    onMouseDown: function(){}
  };

  constructor(props) {
    super(props);

    this.state = {
      touchIdentifier : null,
      dragging: false,
      lastX: NaN,
      lastY: NaN
    }
  }

  componentWillUnmount() {
    // Remove any leftover event handlers. Remove both touch and mouse handlers in case
    // some browser quirk caused a touch event to fire during a mouse move, or vice versa.
    const {ownerDocument} = Inferno.findDOMNode(this);
    removeEvent(ownerDocument, eventsFor.mouse.move, () => this.handleDrag);
    removeEvent(ownerDocument, eventsFor.touch.move, () => this.handleDrag);
    removeEvent(ownerDocument, eventsFor.mouse.stop, () => this.handleDragStop);
    removeEvent(ownerDocument, eventsFor.touch.stop, () => this.handleDragStop);
    if (this.props.enableUserSelectHack) removeUserSelectStyles(ownerDocument.body);
  }

  handleDragStart(e) {
    // Make it possible to attach event handlers on top of this one.
    this.props.onMouseDown(e);

    // Only accept left-clicks.
    if (!this.props.allowAnyClick && typeof e.button === 'number' && e.button !== 0) return false;

    // Get nodes. Be sure to grab relative document (could be iframed)
    const domNode = Inferno.findDOMNode(this);
    const {ownerDocument} = domNode;

    // Short circuit if handle or cancel prop was provided and selector doesn't match.
    if (this.props.disabled ||
      (!(e.target instanceof ownerDocument.defaultView.Node)) ||
      (this.props.handle && !matchesSelectorAndParentsTo(e.target, this.props.handle, domNode)) ||
      (this.props.cancel && matchesSelectorAndParentsTo(e.target, this.props.cancel, domNode))) {
      return;
    }

    // Set touch identifier in component state if this is a touch event. This allows us to
    // distinguish between individual touches on multitouch screens by identifying which
    // touchpoint was set to this element.
    const touchIdentifier = getTouchIdentifier(e);
    this.setState({touchIdentifier});

    // Get the current drag point from the event. This is used as the offset.
    const position = getControlPosition(e, touchIdentifier, this);
    if (position == null) return; // not possible but satisfies flow
    const {x, y} = position;

    // Create an event object with all the data parents need to make a decision here.
    const coreEvent = createCoreData(this, x, y);

    log('DraggableCore: handleDragStart: %j', coreEvent);

    // Call event handler. If it returns explicit false, cancel.
    log('calling', this.props.onStart);
    const shouldUpdate = this.props.onStart(e, coreEvent);
    if (shouldUpdate === false) return;

    // Add a style to the body to disable user-select. This prevents text from
    // being selected all over the page.
    if (this.props.enableUserSelectHack) addUserSelectStyles(ownerDocument.body);

    // Initiate dragging. Set the current x and y as offsets
    // so we know how much we've moved during the drag. This allows us
    // to drag elements around even if they have been moved, without issue.
    this.setState({
      dragging: true,

      lastX: x,
      lastY: y
    });

    // Add events to the document directly so we catch when the user's mouse/touch moves outside of
    // this element. We use different events depending on whether or not we have detected that this
    // is a touch-capable device.
    addEvent(ownerDocument, dragEventFor.move, () => this.handleDrag);
    addEvent(ownerDocument, dragEventFor.stop, () => this.handleDragStop);
  };

  handleDrag(e) {

    // Prevent scrolling on mobile devices, like ipad/iphone.
    if (e.type === 'touchmove') e.preventDefault();

    // Get the current drag point from the event. This is used as the offset.
    const position = getControlPosition(e, this.state.touchIdentifier, this);
    if (position == null) return;
    let {x, y} = position;

    // Snap to grid if prop has been provided
    if (x !== x) debugger;

    if (Array.isArray(this.props.grid)) {
      let deltaX = x - this.state.lastX, deltaY = y - this.state.lastY;
      [deltaX, deltaY] = snapToGrid(this.props.grid, deltaX, deltaY);
      if (!deltaX && !deltaY) return; // skip useless drag
      x = this.state.lastX + deltaX, y = this.state.lastY + deltaY;
    }

    const coreEvent = createCoreData(this, x, y);

    log('DraggableCore: handleDrag: %j', coreEvent);

    // Call event handler. If it returns explicit false, trigger end.
    const shouldUpdate = this.props.onDrag(e, coreEvent);
    if (shouldUpdate === false) {
      try {
        // $FlowIgnore
        this.handleDragStop(new MouseEvent('mouseup'));
      } catch (err) {
        // Old browsers
        const event = ((document.createEvent('MouseEvents')));
        // I see why this insanity was deprecated
        // $FlowIgnore
        event.initMouseEvent('mouseup', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        this.handleDragStop(event);
      }
      return;
    }

    this.setState({
      lastX: x,
      lastY: y
    });
  };

  handleDragStop(e) {
    if (!this.state.dragging) return;

    const position = getControlPosition(e, this.state.touchIdentifier, this);
    if (position == null) return;
    const {x, y} = position;
    const coreEvent = createCoreData(this, x, y);
    const {ownerDocument} = Inferno.findDOMNode(this);

    // Remove user-select hack
    if (this.props.enableUserSelectHack) removeUserSelectStyles(ownerDocument.body);

    log('DraggableCore: handleDragStop: %j', coreEvent);

    // Reset the el.
    this.setState({
      dragging: false,
      lastX: NaN,
      lastY: NaN
    });

    // Call event handler
    this.props.onStop(e, coreEvent);

    // Remove event handlers
    log('DraggableCore: Removing handlers');
    removeEvent(ownerDocument, dragEventFor.move, () => this.handleDrag);
    removeEvent(ownerDocument, dragEventFor.stop, () => this.handleDragStop);
  };

  onMouseDown(that) {
    dragEventFor = eventsFor.mouse; // on touchscreen laptops we could switch back to mouse

    return that.handleDragStart(event);
  };

  onMouseUp (that) {
    dragEventFor = eventsFor.mouse;

    return that.handleDragStop(event);
  };

  // Same as onMouseDown (start drag), but now consider this a touch device.
  onTouchStart(that) {
    // We're on a touch device now, so change the event handlers
    dragEventFor = eventsFor.touch;

    return that.handleDragStart(event);
  };

  onTouchEnd(that) {
    // We're on a touch device now, so change the event handlers
    dragEventFor = eventsFor.touch;

    return that.handleDragStop(event);
  };

  render() {
    // Reuse the child provided
    // This makes it flexible to use whatever element is wanted (div, ul, etc)
    return React.cloneElement(React.Children.only(this.props.children), {
      style: styleHacks(this.props.children.props.style),
      // Note: mouseMove handler is attached to document so it will still function
      // when the user drags quickly and leaves the bounds of the element.
      onMouseDown:  linkEvent(this, this.onMouseDown) ,
      onTouchStart:  linkEvent(this, this.onTouchStart),
      onMouseUp:  linkEvent(this, this.onMouseUp) ,
      onTouchEnd:  linkEvent(this, this.onTouchEnd)
    });
  }
}
