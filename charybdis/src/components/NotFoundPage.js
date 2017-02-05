import Inferno from 'inferno';
import { IndexLink } from 'inferno-router';
import Component from 'inferno-component';

export default class NotFoundPage extends Component {
  render() {
    return (
      <div className="not-found">
        <h1>404</h1>
        <h2>Page not found!</h2>
        <p>
          <a href="/">Go back to the main page</a>
        </p>
      </div>
    );
  }
}
