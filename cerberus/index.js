import http       from 'http';
import httpProxy  from 'http-proxy';
import chimera    from '../chimera/index.js';

const requires = [
      'util',
      'config',
      'avahiAlias'
    ],
    { config, util, avahiAlias }  = chimera.initialize(requires),
    vhosts = config.get('vhosts'),
    rootDomain = `${util.hostname().toLowerCase()}.local`,
    proxy = httpProxy.createProxyServer({}),

    server = http.createServer((req, res) => {

      const port = util.object.get(vhosts, req.headers.host.replace('/\.\w+\.\w+/g', '').toLowerCase(), vhosts['default']);

      proxy.on('error', function(e) {
        util.log(e);
      });

      if (typeof port !== 'undefined') {
        proxy.web(req, res, { target : 'http://127.0.0.1:' + port });
        return true;
      } else {
        return null;
      }
    });

util.log('Cerberus is listening on port 80');
server.listen(80);

// Then publish all subdomains from vhost
util.object.forOwn(vhosts, function(value, vhost) {
  avahiAlias.publish(`${vhost}.${rootDomain}`);
});
