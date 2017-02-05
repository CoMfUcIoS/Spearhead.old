import Inferno, { linkEvent } from 'inferno'; //eslint-disable-line
import Component from 'inferno-component';

export default class Clock extends Component {
  constructor(props) {
    super(props);
    // set initial time:
    this.state = {
      time : Date.now()
    };
  }

  componentDidMount() {
    const { socket } = this.props;
  // update time every second
    this.timer = setInterval(() => {
      socket.emit('getMem');
      socket.emit('getCpu');
      this.setState({ time : Date.now() });
    }, 1000);

    socket.on('gotMem', (data) => {
      this.setState({ memUsage : data.memoryUsagePercentage });
    });
    socket.on('gotCpu', (data) => {
      this.setState({ cpuUsage : data.cpuUsagePercentage });
    });

  }

  componentWillUnmount() {
    // stop when not renderable
    clearInterval(this.timer);
  }

  buttonClick(obj) {
    const { that } = obj;
    that.props.socket.emit('getMem');
  }

  render() {
    const { memUsage, cpuUsage, time } = this.state,
        newTime = new Date(time); //.toLocaleTimeString();
    return (
      <div>
        <span>{`${newTime}`}</span><br />
        <span>{`Mem usage : ${memUsage || 0}%`}</span><br />
        <span>{`Cpu usage : ${cpuUsage || 0}%`}</span><br />
      </div>
    );
  }
}
