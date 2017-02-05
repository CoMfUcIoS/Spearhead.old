import './scss/main.scss';
import Inferno from 'inferno';
import AppRoutes from './components/AppRoutes';

window.onload = () => {
  Inferno.render(<AppRoutes/>, document.getElementById('main'));
};
