import path       from 'path';
import { Server } from 'http';
import Express    from 'express';
import Inferno    from 'inferno';
import routes     from './routes';
import Sockets from './Sockets';
import chimera    from '../../chimera/index.js';
import NotFoundPage             from './components/NotFoundPage';
import { renderToString }       from 'inferno-server';
import { match, RouterContext } from 'inferno-router';

// initialize the server and configure support for ejs templates
const app                  = new Express(),
    server                 = new Server(app),
    framework              = chimera.initialize(['config', 'keymetrics']),
    { config, keymetrics } = framework,
    keymetricsStart        = keymetrics.start(), //eslint-disable-line
    port                   = config.get('ports.charybdis') || 3000,
    sockets                = new Sockets(server, '/ws'); //eslint-disable-line

let env;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// define the folder that will be used for static assets
app.use(Express['static'](path.join(__dirname, 'static')));

// universal routing and rendering
app.get('*', (req, res) => {
  const renderProps = match(routes, req.originalUrl);
  let markup;

  // in case of error display the error message
  if (!renderProps) {
    // otherwise we can render a 404 page
    markup = renderToString(<NotFoundPage />);
    return res.render('index', { markup });
  }

  let { redirect, matched } = renderProps; //eslint-disable-line

  // in case of redirect propagate the redirect to the browser
  if (redirect) {
    return res.redirect(redirect);
  }

  // generate the inferno markup for the current route
  if (matched) {
    renderProps.framework = framework;
    // if the current route matched we have renderProps
    markup = renderToString(<RouterContext {...renderProps}/>);
  }
  // render the index template with the embedded inferno markup
  return res.render('index', { markup });
});

// start the server
env  = process.env.NODE_ENV || 'production';
server.listen(port, (err) => {
  if (err) {
    return console.error(err); //eslint-disable-line
  }
  console.info(`Server running on http://localhost:${port} [${env}]`); //eslint-disable-line
  return true;
});
