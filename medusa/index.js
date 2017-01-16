import express from 'express';
import chimera from '../chimera/index.js';
import spdy    from 'spdy';

const requires = [
      'util',
      'config',
      'wsClient'
    ],
    { util, config, wsClient }  = chimera.initialize(requires),
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


var options = {
  // // Private key
  key : '/home/osmc/letsencrypt/etc/live/rpi.studio110.eu/privkey.pem',

  // // Fullchain file or cert file (prefer the former)
  cert : '/home/osmc/letsencrypt/etc/live/rpi.studio110.eu/fullchain.pem',

  // **optional** SPDY-specific options
  // spdy : {
  //   protocols : ['h2', 'spdy/3.1', 'http/1.1'],
  //   plain     : false,

  //   // **optional**
  //   // Parse first incoming X_FORWARDED_FOR frame and put it to the
  //   // headers of every request.
  //   // NOTE: Use with care! This should not be used without some proxy that
  //   // will *always* send X_FORWARDED_FOR
  //   'x-forwarded-for' : true,

  //   connection : {
  //     windowSize : 1024 * 1024, // Server's window size

  //     // **optional** if true - server will send 3.1 frames on 3.0 *plain* spdy
  //     autoSpdy31 : false
  //   }
  // }
};

spdy
  .createServer(options, app).listen(port, (error) => {
    if (error) {
      console.error(error);
      return process.exit(1);
    } else {
      console.log('Listening on port: ' + port + '.');
    }
  });

// app.listen(port, function() {
//   util.log(`Medusa app listening on port ${port}!`);
// });

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
