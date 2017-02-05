import Inferno from 'inferno';
import Component from 'inferno-component';
import { Router } from 'inferno-router';
import routes from '../routes';
import { createBrowserHistory } from 'history';

const browserHistory = createBrowserHistory();

export default class AppRoutes extends Component {
  render() {
    return (
      <Router history={browserHistory} children={routes} onUpdate={() => window.scrollTo(0, 0)}/>
    );
  }
}
