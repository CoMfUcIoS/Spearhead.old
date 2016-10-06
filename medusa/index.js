import express from 'express';


var app = express();

app.get('/', function(req, res) {
  res.sendFile('index.html', { root : __dirname });
});

app.listen(1233, function() {
  console.log('Example app listening on port 1233!');
});
