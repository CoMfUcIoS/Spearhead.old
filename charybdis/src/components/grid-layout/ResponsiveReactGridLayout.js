// @flow
import Inferno   from 'inferno';
import Component from 'inferno-component';
import isEqual from 'lodash.isequal';

import { cloneLayout, synchronizeLayoutWithChildren, validateLayout } from './utils';
import { getBreakpointFromWidth, getColsFromBreakpoint, findOrGenerateResponsiveLayout } from './responsiveUtils';
import GridLayout from './GridLayout';

const noop = function() {};
const type = (obj) => Object.prototype.toString.call(obj);

import { Layout } from './utils';

export default class ResponsiveGridLayout extends Component {

  static defaultProps = {
    breakpoints        : { lg : 1200, md : 996, sm : 768, xs : 480, xxs : 0 },
    cols               : { lg : 12, md : 10, sm : 6, xs : 4, xxs : 2 },
    layouts            : {},
    onBreakpointChange : noop,
    onLayoutChange     : noop,
    onWidthChange      : noop,
  };

  static defaultState = this.generateInitialState();

  generateInitialState() {
    const { width, breakpoints, layouts, verticalCompact, cols } = this.props;
    const breakpoint = getBreakpointFromWidth(breakpoints, width);
    const colNo = getColsFromBreakpoint(breakpoint, cols);
    // Get the initial layout. This can tricky; we try to generate one however possible if one doesn't exist
    // for this layout.
    const initialLayout = findOrGenerateResponsiveLayout(layouts, breakpoints, breakpoint,
                                                         breakpoint, colNo, verticalCompact);

    return {
      layout     : initialLayout,
      breakpoint : breakpoint,
      cols       : colNo
    };
  }

  componentWillReceiveProps(nextProps) {

    // Allow parent to set width or breakpoint directly.
    if (
         nextProps.width != this.props.width ||
      nextProps.breakpoint !== this.props.breakpoint ||
      !isEqual(nextProps.breakpoints, this.props.breakpoints) ||
      !isEqual(nextProps.cols, this.props.cols)
    ) {
      this.onWidthChange(nextProps);
    }

    // Allow parent to set layouts directly.
    else if (!isEqual(nextProps.layouts, this.props.layouts)) {
      const { breakpoint, cols } = this.state;

      // Since we're setting an entirely new layout object, we must generate a new responsive layout
      // if one does not exist.
      const newLayout = findOrGenerateResponsiveLayout(
        nextProps.layouts, nextProps.breakpoints,
        breakpoint, breakpoint, cols, nextProps.verticalCompact
      );
      this.setState({ layout : newLayout });
    }
  }

  // wrap layouts so we do not need to pass layouts to child
  onLayoutChange(layout) {
    this.props.onLayoutChange(layout, { ...this.props.layouts, [this.state.breakpoint] : layout });
  }

  /**
   * When the width changes work through breakpoints and reset state with the new width & breakpoint.
   * Width changes are necessary to figure out the widget widths.
   */
  onWidthChange(nextProps) {
    const { breakpoints, cols, layouts, verticalCompact } = nextProps;
    const newBreakpoint = nextProps.breakpoint || getBreakpointFromWidth(nextProps.breakpoints, nextProps.width);

    const lastBreakpoint = this.state.breakpoint;

    // Breakpoint change
    if (lastBreakpoint !== newBreakpoint || this.props.breakpoints !== breakpoints || this.props.cols !== cols) {
      // Preserve the current layout if the current breakpoint is not present in the next layouts.
      if (!(lastBreakpoint in layouts)) { layouts[lastBreakpoint] = cloneLayout(this.state.layout); }

      // Find or generate a new layout.
      const newCols: number = getColsFromBreakpoint(newBreakpoint, cols);
      let layout = findOrGenerateResponsiveLayout(layouts, breakpoints, newBreakpoint,
                                                  lastBreakpoint, newCols, verticalCompact);

      // This adds missing items.
      layout = synchronizeLayoutWithChildren(layout, nextProps.children, newCols, verticalCompact);

      // Store the new layout.
      layouts[newBreakpoint] = layout;

      // callbacks
      this.props.onLayoutChange(layout, layouts);
      this.props.onBreakpointChange(newBreakpoint, newCols);
      this.props.onWidthChange(nextProps.width, nextProps.margin, newCols, nextProps.containerPadding);

      this.setState({ breakpoint : newBreakpoint, layout : layout, cols : newCols });
    }
  }

  render() {
    const { breakpoint, breakpoints, cols, layouts, onBreakpointChange,
           onLayoutChange, onWidthChange, ...other } = this.props;

    return (
      <GridLayout
        {...other}
        onLayoutChange={this.onLayoutChange}
        layout={this.state.layout}
        cols={this.state.cols}
      />
    );
  }
}
