import express from 'express';
import { client as Client } from 'websocket';
import chimera from '../chimera/index.js';

const requires = [
      'util',
      'config'
    ],
    { util, config }  = chimera.initialize(requires),
    port = config.get('ports.medusa'),
    wsPort = config.get('ports.hydra'),
    client = new Client(),
    app = express();

app.get('/', function(req, res) {
  res.sendFile('index.html', { root : __dirname });
});

app.listen(port, function() {
  util.log(`Medusa app listening on port ${port}!`);
});

client.on('connectFailed', function(error) {
  util.log(`Connect Error: ${error.toString()}`);
});

client.on('connect', function(connection) {
  util.log(`WebSocket Client Connected to ${wsPort}`);
  connection.on('error', function(error) {
    util.log(`Connection Error: ${error.toString()}`);
  });
  connection.on('close', function() {
    util.log('echo-protocol Connection Closed');
  });
  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      util.log(`Received: '${message.utf8Data }'`);
    }
  });
});

client.connect(`ws://localhost:${wsPort}/`, 'echo-protocol');
