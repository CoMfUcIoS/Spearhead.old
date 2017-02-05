import Inferno from 'inferno';
import Component from 'inferno-component';
import { Router } from 'inferno-router';
import routes from '../routes';
import { createBrowserHistory } from 'history';

const browserHistory = createBrowserHistory();

export default class AppRoutes extends Component {
  render() {
    const nRoutes = routes({});
    return (
      <Router history={browserHistory} children={nRoutes} onUpdate={() => window.scrollTo(0, 0)}/>
    );
  }
}
