import http       from 'http';
import https      from 'https';
import httpProxy  from 'http-proxy';
import chimera    from '../chimera/index.js';
import fs         from 'fs';
import le         from 'letsencrypt-express';
import Challenge  from 'le-challenge-fs';
import store      from 'le-store-certbot';
import redirecthttps from 'redirect-https';

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
    debug = config.get('debug'),
    leStore = store.create({
      configDir     : '~/letsencrypt/etc',          // or /etc/letsencrypt or wherever
      privkeyPath   : ':configDir/live/:hostname/privkey.pem',          //
      fullchainPath : ':configDir/live/:hostname/fullchain.pem',      // Note: both that :configDir and :hostname
      certPath      : ':configDir/live/:hostname/cert.pem',                //       will be templated as expected by
      chainPath     : ':configDir/live/:hostname/chain.pem',              //       node-letsencrypt
      workDir       : '~/letsencrypt/var/lib',
      logsDir       : '~/letsencrypt/var/log',
      webrootPath   : '~/letsencrypt/srv/www/:hostname/.well-known/acme-challenge',
      debug         : debug
    }),
    lex = le.create({
      // set to https://acme-v01.api.letsencrypt.org/directory in production
      server     : debug ? 'staging' : 'https://acme-v01.api.letsencrypt.org/directory',
      // If you wish to replace the default plugins, you may do so here
      //
      challenges : { 'http-01' : Challenge.create({ webrootPath : '~/letsencrypt/var/acme-challenges' }) },
      store      : leStore,

      // You probably wouldn't need to replace the default sni handler
      // See https://github.com/Daplie/le-sni-auto if you think you do
      //, sni: require('le-sni-auto').create({})

      approveDomains : approveDomains
    }),
    proxyFun = (req, res) => {
      const host = req.headers.host.replace(/\.\w+.\w+/g, ''),
          appPort = util.object.get(vhosts, host, vhosts['default']);

      proxy.on('error', function(e) {
        util.log(e);
      });
      if (typeof appPort !== 'undefined') {
        proxy.web(req, res, {
          target : `http://127.0.0.1:${appPort}`
        });
        return true;
      } else {
        return null;
      }
    },
    allowedSSLDomains = config.get('allowedSSLDomains');

let client = {
      uuid : 'cerberus'
    },
    server;

function approveDomains(opts, certs, cb) {
  // This is where you check your database and associated
  // email addresses with domains and agreements and such

  if (allowedSSLDomains.indexOf(opts.domain) < 0) {
    return;
  }

  // The domains being approved for the first time are listed in opts.domains
  // Certs being renewed are listed in certs.altnames
  if (certs) {
    opts.domains = certs.altnames;
  } else {
    opts.email = 'john@studio110.eu';
    opts.agreeTos = true;
  }

  // NOTE: you can also change other options such as `challengeType` and `challenge`
  opts.challengeType = 'http-01';
  opts.challenge = Challenge.create({});

  cb(null, { options : opts, certs : certs });
}


// check debug to see if we are live or not to publish to avahi some aliases plus to force ssl.
if (debug) {
  server = http.createServer(proxyFun);
  server.listen(port);

  fs.access(config.get('avahiPath'), fs.F_OK, (err) => {
    if (!err) {
      // Then publish all subdomains from vhost
      util.object.forOwn(vhosts, (value, vhost) => {
        avahiAlias.publish(vhost);
      });
    }
  });

} else {
  // redirect traffic to https port
  http.createServer(lex.middleware(redirecthttps())).listen(80);
  server = https.createServer(lex.httpsOptions, lex.middleware(proxyFun)).listen(443);
}

//
// Listen to the `upgrade` event and proxy the
// WebSocket requests as well.
//
server.on('upgrade', function(req, socket, head) {
  proxy.ws(req, socket, head, {
    target : 'ws://127.0.0.1:4730',
    ws     : true
  });
});

util.log(`Cerberus is listening on port ${port}`);

wsClient.connect({ origin : 'cerberus', events : (connection) => {
  util.log('Cerberus Connected to Websocket!');
  connection.on('error', (error) => {
    util.log(`Cerberus ws Connection Error: ${error.toString()}`);
  });
  connection.on('close', () => {
    util.log('Cerberus ws echo-protocol Connection Closed');
  });
  connection.on('message', (message) => {
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

  setTimeout(() => {
    util.log('Send a test mesage to medusa');
    connection.send(JSON.stringify({ to : 'medusa', message : { message : 'Hello Bitch !', type : 'uuid' } }));
  }, 5000);

} });
