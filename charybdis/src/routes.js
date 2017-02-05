import Inferno from 'inferno';
import { Route, IndexRoute } from 'inferno-router'; //eslint-disable-line

import Layout from './components/Layout';

const routes = function(framework) {
  return (
    <Route path="/" framework={framework} component={Layout} />
  );
};

export default routes;
