import chimera              from './chimera/index.js';
import monitor    from 'monitor';

const requires = [
      'util',
      'config'
    ],
    { config, util }  = chimera.initialize(requires);

// Connecting a monitor to a probe
var processMonitor = new monitor({
  probeClass: 'Process'
});
processMonitor.connect();

// Monitoring the probe
processMonitor.on('change', function(){
  util.log(arguments);
  // util.log('Changes:', monitor.getChangedAttributes());
});

// Remote control
processMonitor.control('ping', function(error, response) {
  util.log('Ping response: ', response);
});
