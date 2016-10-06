import express from 'express';
import chimera    from '../chimera/index.js';

const { util }  = chimera.initialize(),
    app = express();

app.get('/', function(req, res) {
  res.sendFile('index.html', { root : __dirname });
});

app.listen(1233, function() {
  util.log('Example app listening on port 1233!');
});
