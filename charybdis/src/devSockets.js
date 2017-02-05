import { Server } from 'http';
import Express    from 'express';
import Sockets from './Sockets';

const app = new Express(),
    server = new Server(app),
    sockets = new Sockets(server, '/ws'), //eslint-disable-line
    port = process.env.PORT || 3000,
    env  = process.env.NODE_ENV || 'production';

app.get('*', (req, res) => {
  res.writeHead(200);
  res.end();
});

server.listen(port, (err) => {
  if (err) {
    return console.error(err); //eslint-disable-line
  }
  console.info(`Socket server running on http://localhost:${port} [${env}]`); //eslint-disable-line
  return true;
});
