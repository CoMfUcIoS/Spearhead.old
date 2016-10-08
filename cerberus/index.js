import http       from 'http';
import httpProxy  from 'http-proxy';
import { client as Client } from 'websocket';
import chimera    from '../chimera/index.js';

const requires = [
      'util',
      'config',
      'avahiAlias'
    ],
    { config, util, avahiAlias }  = chimera.initialize(requires),
    vhosts = config.get('vhosts'),
    proxy = httpProxy.createProxyServer({}),
    port = config.get('ports.cerberus'),
    wsPort = config.get('ports.hydra'),
    client = new Client(),
    server = http.createServer((req, res) => {
      const appPort = util.object.get(vhosts, req.headers.host.replace(/\.\w+.\w+/g, '').toLowerCase(), vhosts['default']);

      proxy.on('error', function(e) {
        util.log(e);
      });

      if (typeof appPort !== 'undefined') {
        proxy.web(req, res, { target : `http://127.0.0.1:${appPort}` });
        return true;
      } else {
        return null;
      }
    });

server.listen(port);
util.log(`Cerberus is listening on port ${port}`);

// check debug to see if we are live or not to publish to avahi some aliases.
if (config.get('debug')) {
  // Then publish all subdomains from vhost
  util.object.forOwn(vhosts, function(value, vhost) {
    avahiAlias.publish(vhost);
  });
}

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
