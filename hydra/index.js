import { server as Server } from 'websocket';
import http                 from 'http';
import chimera              from '../chimera/index.js';


const requires = [
      'util',
      'config'
    ],
    { config, util }  = chimera.initialize(requires),
    port = config.get('ports.hydra'),
    // httpServer = (config.get('debug')) ? http.createServer(httpserver) : https.createServer(httpserver),
    httpServer = http.createServer(httpserverFn),

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

function httpserverFn(request, response) {
  util.log((new Date()) + ' Received request for ' + request.url);
  response.writeHead(404);
  response.end();
}

function originIsAllowed(origin) {
  // accept our apps.
  let allowed = _itsOurOwnApp(origin) && (!CLIENTS[origin]);

  if (!allowed && util.toType(origin) === 'string') {
    allowed = (origin.indexOf(`${util.hostname().toLowerCase()}.local`) > -1);
  }

  return allowed;
}

function _itsOurOwnApp(app) {
  const allowedOrigins = Object.keys(config.get('ports')),
      matchArr = app.match(/\w+\.\w+[.\w+]+/g),
      domain = util.array.isArray(matchArr) && matchArr[0],
      ownApp = (allowedOrigins.indexOf(app) > -1);

  return (!ownApp) ? (allowedOrigins.indexOf(domain) > -1) : true;
}


wsServer.on('request', function(request) {
  const origin = request.origin,
      ownApp = _itsOurOwnApp(origin),
      uuid = util.uuid();

  if (!originIsAllowed(origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    util.log(' Connection from origin ' + origin + ' rejected.');
    return;
  }

  let connection = request.accept('echo-protocol', origin);
  util.log(`Connection from ${origin} accepted. Client Id ${uuid}`);

  if (ownApp) {
    CLIENTS[origin] = connection;
  } else {
    if (util.toType(CLIENTS[origin]) !== 'object') {
      CLIENTS[origin] = {};
    }
    CLIENTS[origin][uuid] = connection;
  }

  connection.on('message', function(message) {
    message = JSON.parse(message.utf8Data);
    if (util.object.get(message, 'to')) {
      let connectionTo;
      if (message.to !== 'all') {
        if (_itsOurOwnApp(message.to)) {
          connectionTo = util.object.get(CLIENTS, message.to);
        } else {
          connectionTo = util.object.get(CLIENTS[origin], message.to);
        }

        if (connectionTo) {
          connectionTo.send(JSON.stringify(message.message));
        }
      } else {
        util.log('To ALl ... but who ? ownApps or not ?');
      }
    } else if (util.toType(message) !== 'object') {
      util.log('What i got smth without a type? Huh ?');
    } else {
      switch (message.type) {
        case 'message' : {
          util.log(`Got a mesage from ${origin} - ${uuid}, message : ${message.message}`);
          break;
        }
      }
    }
  });

  connection.send(JSON.stringify({ type : 'uuid', uuid }));

  connection.on('close', function(reasonCode, description) {
    if (!ownApp) {
      delete CLIENTS[origin][uuid];
    } else {
      delete CLIENTS[origin];
    }
    util.log(`Peer ${connection.remoteAddress} with uuid : ${uuid} disconnected.`);
  });
});
