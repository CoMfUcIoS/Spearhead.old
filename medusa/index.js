import express from 'express';
import chimera from '../chimera/index.js';

const requires = [
      'util',
      'config',
      'wsClient'
    ],
    { util, config, wsClient }  = chimera.initialize(requires),
    port = config.get('ports.medusa'),
    app = express();

app.get('/', function(req, res) {
  res.sendFile('index.html', { root : __dirname });
});

app.listen(port, function() {
  util.log(`Medusa app listening on port ${port}!`);
});

wsClient.connect({ origin : 'medusa', events : (connection) => {
  util.log('Medusa Connected to Websocket!');
  connection.on('error', function(error) {
    util.log(`Medusa ws Connection Error: ${error.toString()}`);
  });
  connection.on('close', function() {
    util.log('Medusa ws echo-protocol Connection Closed');
  });
  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      util.log(`Received: '${message.utf8Data }'`);
    }
  });
} });
