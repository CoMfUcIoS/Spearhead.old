import Inferno, { PropTypes } from 'inferno';
import Component from 'inferno-component';

export default class Gauge extends Component {
  propTypes = {
    color           : PropTypes.string,
    percentage      : PropTypes.number,
    backgroundColor : PropTypes.string,
    height          : PropTypes.number.isRequired,
    width           : PropTypes.number.isRequired
  }

  constructor(props) {
    super(props);
    // console.log('props', props);
    this.degrees = 0;

    const percentage = (!props.percentage) ? 0 : props.percentage;

    this.state = {
      percentage : percentage
    };
  }

  componentDidMount() {
    this.updateGauge();
  }

  // componentWillUpdate(nextProps) {
  //   console.log('nextProps', nextProps);
  // }

  componentDidUpdate(nextProps) {
    if (nextProps.percentage &&
        nextProps.percentage !== this.state.percentage) {
      this.draw(nextProps.percentage);
    }
  }

  //function to make the chart move to new degrees
  animateTo(newDegrees) {
    //clear animation loop if degrees reaches to new_degrees
    if (this.degrees === newDegrees) {
      clearInterval(this.animationLoopInterval);
    }

    if (this.degrees < newDegrees) {
      this.degrees++;
    } else {
      this.degrees--;
    }
    this.updateGauge();

  }

  draw(percentage) {
    // Cancel any movement animation if a new chart is requested
    if (typeof this.animationLoopInterval !== undefined) {
      clearInterval(this.animationLoopInterval);
    }

    let newDegrees = Math.round((percentage / 100) * 360),
        difference = newDegrees - this.degrees;
    // this.animateTo(newDegrees);
    // console.log('percentage:', percentage);
    // this.setState({ percentage });
    // This will animate the gauge to new positions
    // The animation will take 1 second
    // time for each frame is 1sec / difference in degrees
    this.animationLoopInterval = setInterval(this.animateTo.bind(this, newDegrees), 100 / difference);
  }

  updateGauge() {
    const canvas = this.gauge.getContext('2d'),
        { width, height, backgroundColor, color } = this.props;
    let radians,
        text,
        textWidth;

    // Clear  everytime a chart is drawn
    canvas.clearRect(0, 0, width, height);

    // Background 360 degree arc
    canvas.beginPath();
    canvas.strokeStyle = backgroundColor || '#222';
    canvas.lineWidth = width / 10;
    canvas.arc(width / 2, height / 2, 100, 0, Math.PI * 2, false); //you can see the arc now
    canvas.stroke();

    // gauge will be a simple arc
    // Angle in radians = angle in degrees * PI / 180
    radians = this.degrees * Math.PI / 180;
    canvas.beginPath();
    canvas.strokeStyle = color;
    canvas.lineWidth = width / 10;
    // The arc starts from the rightmost end. If we deduct 90 degrees from the angles
    // the arc will start from the topmost end
    canvas.arc(width / 2, height / 2, 100, 0 - 90 * Math.PI / 180, radians - 90 * Math.PI / 180, false);
    // you can see the arc now
    canvas.stroke();

    //Lets add the text
    canvas.fillStyle = color;
    canvas.font = '50px bebas';
    text = Math.floor(this.degrees / 360 * 100) + '%';
    //Lets center the text
    //deducting half of text width from position x
    textWidth = canvas.measureText(text).width;
    //adding manual value to position y since the height of the text cannot
    //be measured easily. There are hacks but we will keep it manual for now.
    canvas.fillText(text, width / 2 - textWidth / 2, height / 2 + 15);
  }

  componentWillUnmount() {
    // stop when not renderable
    clearInterval(this.animationLoopInterval);
  }

  render() {
    const { width, height } = this.props;
    return (
      <canvas
        ref    = {(ref) => { this.gauge = ref; }}
        height = {height}
        width  = {width}
      >
      </canvas>
    );
  }
}
