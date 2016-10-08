import express from 'express';
import chimera from '../chimera/index.js';

const requires = [
      'util',
      'config'
    ],
    { util, config }  = chimera.initialize(requires),
    port = config.get('ports.medusa'),
    app = express();

app.get('/', function(req, res) {
  res.sendFile('index.html', { root : __dirname });
});

app.listen(port, function() {
  util.log(`Medusa app listening on port ${port}!`);
});
