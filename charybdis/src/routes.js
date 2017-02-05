import Inferno from 'inferno';
import { Route, IndexRoute } from 'inferno-router'; //eslint-disable-line

import Layout from './components/Layout';

const routes = (
  <Route path="/" component={Layout} />
);

export default routes;
