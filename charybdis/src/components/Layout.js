import Inferno from 'inferno';
import io from 'socket.io-client';
import Component from 'inferno-component';
import Clock from './simpleClock';
// import Gauge from './Gauge';

export default class Layout extends Component {

  constructor(props) {
    super(props);

    this.socketIO = io('http://localhost:3000/ws');
  }

  componentDidMount() {
    // this.updateInterval = setInterval(() => {
    //   const percentage = Math.floor(Math.random() * 100) + 1;
    //   this.setState({ percentage });
    // }, 1000);
    // this.updateGauge();
  }


  componentWillUnmount() {
    // stop when not renderable
    // clearInterval(this.animationLoopInterval);
  }

  render() {

    return (
      <div>
        <Clock
          socket = {this.socketIO}
        />
      </div>
    );
  }
}
