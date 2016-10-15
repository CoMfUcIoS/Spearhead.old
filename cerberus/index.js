import http       from 'http';
import httpProxy  from 'http-proxy';
import chimera    from '../chimera/index.js';

const requires = [
      'util',
      'config',
      'avahiAlias',
      'wsClient'
    ],
    { config, util, avahiAlias, wsClient }  = chimera.initialize(requires),
    vhosts = config.get('vhosts'),
    proxy = httpProxy.createProxyServer({}),
    port = config.get('ports.cerberus'),
    server = http.createServer((req, res) => {
      const host = req.headers.host.replace(/\.\w+.\w+/g, ''),
          appPort = util.object.get(vhosts, host, vhosts['default']);

      proxy.on('error', function(e) {
        util.log(e);
      });

      if (typeof appPort !== 'undefined') {
        proxy.web(req, res, {
          target : `${(host === 'ws') ? 'ws' : 'http'}://127.0.0.1:${appPort}`,
          ws     : (host === 'ws')
        });
        return true;
      } else {
        return null;
      }
    });

let client = {
  uuid : 'cerberus'
};

server.listen(port);
util.log(`Cerberus is listening on port ${port}`);

// check debug to see if we are live or not to publish to avahi some aliases.
if (config.get('debug')) {
  // Then publish all subdomains from vhost
  util.object.forOwn(vhosts, function(value, vhost) {
    avahiAlias.publish(vhost);
  });
}

wsClient.connect({ origin : 'cerberus', events : (connection) => {
  util.log('Cerberus Connected to Websocket!');
  connection.on('error', function(error) {
    util.log(`Cerberus ws Connection Error: ${error.toString()}`);
  });
  connection.on('close', function() {
    util.log('Cerberus ws echo-protocol Connection Closed');
  });
  connection.on('message', function(message) {
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

  setTimeout(function() {
    util.log('Send a test mesage to medusa');
    connection.send(JSON.stringify({ to : 'medusa', message : { message : 'Hello Bitch !', type : 'uuid' } }));
  }, 5000);

} });
