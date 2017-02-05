import Inferno from 'inferno';
import { Route, IndexRoute } from 'inferno-router';

import Layout from './components/Layout';

const routes = (
  <Route path="/" component={Layout} />
);

export default routes;
