  import { server as Server } from 'websocket';
  import http                 from 'http';
  import chimera              from '../chimera/index.js';


  const requires = [
        'util',
        'config'
      ],
      { config, util }  = chimera.initialize(requires),
      port = config.get('ports.hydra'),
      httpServer = http.createServer(function(request, response) {
        util.log((new Date()) + ' Received request for ' + request.url);
        response.writeHead(404);
        response.end();
      }),

      wsServer = new Server({
        httpServer,
      // You should not use autoAcceptConnections for production
      // applications, as it defeats all standard cross-origin protection
      // facilities built into the protocol and the browser.  You should
      // *always* verify the connection's origin and decide whether or not
      // to accept it.
        autoAcceptConnections : false
      }),
      CLIENTS = {};


  httpServer.listen(port, function() {
    util.log(`Hydra server is listening on port ${port}`);
  });


  function originIsAllowed(origin) {
    const allowedOrigins = Object.keys(config.get(ports));
    // accept our apps.
    let allowed = (allowedOrigins.indexOf(origin) > -1) && (!CLIENTS[origin]);

    if (!allowed && util.toType(origin) === 'string') {
      allowed = (origin.indexOf(`${util.hostname().toLowerCase()}.local`) > -1);
    }

    return allowed;
  }


  wsServer.on('request', function(request) {
    const origin = request.origin;

    if (!originIsAllowed(origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      util.log((new Date()) + ' Connection from origin ' + origin + ' rejected.');
      return;
    }

    let connection = request.accept('echo-protocol', origin);
    util.log(`Connection from ${origin} accepted.`);

    if ()

    CLIENTS[origin] = connection;

    connection.on('close', function(reasonCode, description) {
      delete CLIENTS[origin];
      util.log(`Peer ${connection.remoteAddress} disconnected.`);
    });
  });
