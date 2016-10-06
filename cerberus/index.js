import http       from 'http';
import httpProxy  from 'http-proxy';
import os         from 'os';
import _          from 'lodash';
import alias      from './avahiAlias.js';
import chimera    from '../chimera/index.js';

const { config, util }  = chimera.initialize(),
    vhosts = config.get('vhosts'),
    rootDomain = `${os.hostname().toLowerCase()}.local`,
    proxy = httpProxy.createProxyServer({}),

    server = http.createServer((req, res) => {

      const port = util.object.get(vhosts, req.headers.host.replace('/\.\w+\.\w+/g', '').toLowerCase(), vhosts.default);

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
_.forOwn(vhosts, function(value, vhost) {
  alias.publish(`${vhost}.${rootDomain}`);
});
