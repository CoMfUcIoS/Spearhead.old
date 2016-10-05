import http from 'http';
import httpProxy from 'http-proxy';
import vhosts from './vhosts.json';
import os from 'os';
import _ from 'lodash';
import alias from './avahiAlias.js';
import chimera from '../chimera/index.js';

const    fw  = chimera.initialize();


_.forOwn(vhosts, function(value, vhost) {
  if (vhost !== `${os.hostname().toLowerCase()}.local`) { 
    alias.publish(vhost);
  }
});

//
// Create a proxy server with custom application logic
//
var proxy = httpProxy.createProxyServer({});

//
// Create your custom server and just call `proxy.web()` to proxy
// a web request to the target passed in the options
// also you can use `proxy.ws()` to proxy a websockets request
//
var server = http.createServer(function(req, res) {
  // You can define here your custom logic to handle the request
  // and then proxy the request.
  var port = vhosts[req.headers.host.toLowerCase()];

  proxy.on('error', function(e) {
   console.log(e);
  });

  if (typeof port !== 'undefined') {
    proxy.web(req, res, { target: 'http://127.0.0.1:'+port });
  } else {
   return null;
  } 
});

console.log("listening on port 80")
server.listen(80);