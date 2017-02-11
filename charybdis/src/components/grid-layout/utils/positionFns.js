import {isNum, int} from './shims';
import Inferno   from 'inferno';
import {getTouch, innerWidth, innerHeight, offsetXYFromParent, outerWidth, outerHeight} from './domFns';
import Draggable from '../Draggable';
import {Bounds, ControlPosition, DraggableData} from './types';
import DraggableCore from '../DraggableCore';

export function getBoundPosition(draggable, x, y){
  // If no bounds, short-circuit and move on
  if (!draggable.props.bounds) return [x, y];

  // Clone new bounds
  let {bounds} = draggable.props;
  bounds = typeof bounds === 'string' ? bounds : cloneBounds(bounds);
  const node = Inferno.findDOMNode(draggable);

  if (typeof bounds === 'string') {
    const {ownerDocument} = node;
    const ownerWindow = ownerDocument.defaultView;
    let boundNode;
    if (bounds === 'parent') {
      boundNode = node.parentNode;
    } else {
      boundNode = ownerDocument.querySelector(bounds);
      if (!boundNode) throw new Error('Bounds selector "' + bounds + '" could not find an element.');
    }
    const nodeStyle = ownerWindow.getComputedStyle(node);
    const boundNodeStyle = ownerWindow.getComputedStyle(boundNode);
    // Compute bounds. This is a pain with padding and offsets but this gets it exactly right.
    bounds = {
      left: -node.offsetLeft + int(boundNodeStyle.paddingLeft) +
            int(nodeStyle.borderLeftWidth) + int(nodeStyle.marginLeft),
      top: -node.offsetTop + int(boundNodeStyle.paddingTop) +
            int(nodeStyle.borderTopWidth) + int(nodeStyle.marginTop),
      right: innerWidth(boundNode) - outerWidth(node) - node.offsetLeft,
      bottom: innerHeight(boundNode) - outerHeight(node) - node.offsetTop
    };
  }

  // Keep x and y below right and bottom limits...
  if (isNum(bounds.right)) x = Math.min(x, bounds.right);
  if (isNum(bounds.bottom)) y = Math.min(y, bounds.bottom);

  // But above left and top limits.
  if (isNum(bounds.left)) x = Math.max(x, bounds.left);
  if (isNum(bounds.top)) y = Math.max(y, bounds.top);

  return [x, y];
}

export function snapToGrid(grid, pendingX, pendingY) {
  const x = Math.round(pendingX / grid[0]) * grid[0];
  const y = Math.round(pendingY / grid[1]) * grid[1];
  return [x, y];
}

export function canDragX(draggable) {
  return draggable.props.axis === 'both' || draggable.props.axis === 'x';
}

export function canDragY(draggable){
  return draggable.props.axis === 'both' || draggable.props.axis === 'y';
}

// Get {x, y} positions from event.
export function getControlPosition(e, touchIdentifier, draggableCore) {
  const touchObj = typeof touchIdentifier === 'number' ? getTouch(e, touchIdentifier) : null;
  if (typeof touchIdentifier === 'number' && !touchObj) return null; // not the right touch
  const node = e.target;
  // User can provide an offsetParent if desired.
  const offsetParent = draggableCore.props.offsetParent || node.offsetParent || node.ownerDocument.body;
  return offsetXYFromParent(touchObj || e, offsetParent);
}

// Create an data object exposed by <DraggableCore>'s events
export function createCoreData(draggable, x, y, node) {
  const state = draggable.state;
  const isStart = !isNum(state.lastX);

  if (isStart) {
    // If this is our first move, use the x and y as last coords.
    return {
      node: node,
      deltaX: 0, deltaY: 0,
      lastX: x, lastY: y,
      x: x, y: y
    };
  } else {
    // Otherwise calculate proper values.
    return {
      node: node,
      deltaX: x - state.lastX, deltaY: y - state.lastY,
      lastX: state.lastX, lastY: state.lastY,
      x: x, y: y
    };
  }
}

// Create an data exposed by <Draggable>'s events
export function createDraggableData(draggable, coreData) {
  return {
    node: coreData.node,
    x: draggable.state.x + coreData.deltaX,
    y: draggable.state.y + coreData.deltaY,
    deltaX: coreData.deltaX,
    deltaY: coreData.deltaY,
    lastX: draggable.state.x,
    lastY: draggable.state.y
  };
}

// A lot faster than stringify/parse
function cloneBounds(bounds) {
  return {
    left: bounds.left,
    top: bounds.top,
    right: bounds.right,
    bottom: bounds.bottom
  };
}
