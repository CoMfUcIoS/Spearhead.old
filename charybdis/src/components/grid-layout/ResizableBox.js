// @flow
import Inferno   from 'inferno';
import Component from 'inferno-component';
import Resizable from './Resizable';
import {Props as ResizableProps} from './Resizable';

// An example use of Resizable.
export default class ResizableBox extends Component {
  static defaultProps = {
    handleSize: [20,20]
  };


  onResize (e, {element, size}) {
    const {width, height} = size;

    if (this.props.onResize) {
      e.persist && e.persist();
      this.setState(size, () => this.props.onResize(e, {element, size}));
    } else {
      this.setState(size);
    }
  };

  componentWillReceiveProps(nextProps) {
    if (nextProps.width !== this.props.width || nextProps.height !== this.props.height) {
      this.setState({
        width: nextProps.width,
        height: nextProps.height
      });
    }
  }

  render() {
    // Basic wrapper around a Resizable instance.
    // If you use Resizable directly, you are responsible for updating the child component
    // with a new width and height.
    const {handleSize, onResize, onResizeStart, onResizeStop, draggableOpts,
         minConstraints, maxConstraints, lockAspectRatio, axis, width, height, ...props} = this.props;
    return (
      <Resizable
        handleSize={handleSize}
        width={this.state.width}
        height={this.state.height}
        onResizeStart={onResizeStart}
        onResize={this.onResize}
        onResizeStop={onResizeStop}
        draggableOpts={draggableOpts}
        minConstraints={minConstraints}
        maxConstraints={maxConstraints}
        lockAspectRatio={lockAspectRatio}
        axis={axis}
        >
        <div style={{width: this.state.width + 'px', height: this.state.height + 'px'}} {...props} />
      </Resizable>
    );
  }
}
