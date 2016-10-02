var http = require('http'),
    httpProxy = require('http-proxy'),
    vhosts = require('./vhosts.json');

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
  var port = vhosts[req.headers.host];
  
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
