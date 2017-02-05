import chimera from '../chimera/index.js';

const requires = [
      'util',
      'config',
      'keymetrics',
      '$websocket'
    ],
    { config, keymetrics, $websocket }  = chimera.initialize(requires),
    keymetricsStart = keymetrics.start(), //eslint-disable-line
    port = config.get('ports.hydra'),
    wsServer = $websocket.server.start({ port }); //eslint-disable-line
