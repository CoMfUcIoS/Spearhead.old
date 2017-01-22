import express from 'express';
import chimera from '../chimera/index.js';

const requires = [
      'util',
      'config',
      'wsClient',
      'keymetrics'
    ],
    { util, config, wsClient, keymetrics }  = chimera.initialize(requires),
    keymetricsStart = keymetrics.start(), //eslint-disable-line
    port = config.get('ports.medusa'),
    app = express();
let client = {
  uuid : 'medusa'
};
app.get('/', function(req, res) {
  res.sendFile('index.html', { root : __dirname });
});

app.get('/overview', function(req, res) {
  res.sendFile('overview.html', { root : __dirname });
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

    util.log(message);
    message = JSON.parse(message.utf8Data);
    if (util.toType(message) !== 'object') {
      util.log('What i got smth without a type? Huh ?');
    } else {
      switch (message.type) {
        case 'uuid' : {
          client.id = message.uuid;
          connection.send(JSON.stringify({ type : 'message', message : 'thanks' }));
          break;
        }
      }
    }
  });
} });
