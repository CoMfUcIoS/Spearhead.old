import Inferno   from 'inferno';
import io        from 'socket.io-client';
import Component from 'inferno-component';
import Clock     from './simpleClock';
import GridLayout from './grid-layout/GridLayout';
// import Gauge from './Gauge';

export default class Layout extends Component {

  constructor(props) {
    super(props);
    this.socketIO = io('http://localhost:3000/ws');
    Inferno.options.findDOMNodeEnabled = true;
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
    var layout = [
      { i : 'a', x : 0, y : 0, w : 1, h : 2 },
      { i : 'b', x : 1, y : 0, w : 3, h : 2, minW : 2, maxW : 4 },
      { i : 'c', x : 4, y : 0, w : 1, h : 2 }
    ];
    return (
      <div>
        <center>
        <pre>
        {`
███████╗████████╗██╗   ██╗██████╗ ██╗ ██████╗  ██╗ ██╗ ██████╗    ███████╗██╗   ██╗
██╔════╝╚══██╔══╝██║   ██║██╔══██╗██║██╔═══██╗███║███║██╔═████╗   ██╔════╝██║   ██║
███████╗   ██║   ██║   ██║██║  ██║██║██║   ██║╚██║╚██║██║██╔██║   █████╗  ██║   ██║
╚════██║   ██║   ██║   ██║██║  ██║██║██║   ██║ ██║ ██║████╔╝██║   ██╔══╝  ██║   ██║
███████║   ██║   ╚██████╔╝██████╔╝██║╚██████╔╝ ██║ ██║╚██████╔╝██╗███████╗╚██████╔╝
╚══════╝   ╚═╝    ╚═════╝ ╚═════╝ ╚═╝ ╚═════╝  ╚═╝ ╚═╝ ╚═════╝ ╚═╝╚══════╝ ╚═════╝
        `}
        </pre>
        <pre>
        {`
 ██▀███   ▄▄▄        ██████  ██▓███   ▄▄▄▄   ▓█████  ██▀███   ██▀███ ▓██   ██▓    ██▓███   ██▓
▓██ ▒ ██▒▒████▄    ▒██    ▒ ▓██░  ██▒▓█████▄ ▓█   ▀ ▓██ ▒ ██▒▓██ ▒ ██▒▒██  ██▒   ▓██░  ██▒▓██▒
▓██ ░▄█ ▒▒██  ▀█▄  ░ ▓██▄   ▓██░ ██▓▒▒██▒ ▄██▒███   ▓██ ░▄█ ▒▓██ ░▄█ ▒ ▒██ ██░   ▓██░ ██▓▒▒██▒
▒██▀▀█▄  ░██▄▄▄▄██   ▒   ██▒▒██▄█▓▒ ▒▒██░█▀  ▒▓█  ▄ ▒██▀▀█▄  ▒██▀▀█▄   ░ ▐██▓░   ▒██▄█▓▒ ▒░██░
░██▓ ▒██▒ ▓█   ▓██▒▒██████▒▒▒██▒ ░  ░░▓█  ▀█▓░▒████▒░██▓ ▒██▒░██▓ ▒██▒ ░ ██▒▓░   ▒██▒ ░  ░░██░
░ ▒▓ ░▒▓░ ▒▒   ▓▒█░▒ ▒▓▒ ▒ ░▒▓▒░ ░  ░░▒▓███▀▒░░ ▒░ ░░ ▒▓ ░▒▓░░ ▒▓ ░▒▓░  ██▒▒▒    ▒▓▒░ ░  ░░▓
  ░▒ ░ ▒░  ▒   ▒▒ ░░ ░▒  ░ ░░▒ ░     ▒░▒   ░  ░ ░  ░  ░▒ ░ ▒░  ░▒ ░ ▒░▓██ ░▒░    ░▒ ░      ▒ ░
  ░░   ░   ░   ▒   ░  ░  ░  ░░        ░    ░    ░     ░░   ░   ░░   ░ ▒ ▒ ░░     ░░        ▒ ░
   ░           ░  ░      ░            ░         ░  ░   ░        ░     ░ ░                  ░
                                           ░                          ░ ░
        `}
        </pre>
        <Clock
          socket = {this.socketIO}
        />
        <br />
        <center> contact : <a href="mailto:john@studio110.eu"> john@studio110.eu</a> </center>
        </center>
        <GridLayout className="layout" layout={layout} cols={12} rowHeight={30} width={1200}>
          <div key={'a'}>a</div>
          <div key={'b'}>b</div>
          <div key={'c'}>c</div>
        </GridLayout>
      </div>
    );
  }
}
