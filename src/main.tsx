import { render } from 'preact';
import { App } from './app/App';
import './styles/tokens.css';
import './styles/global.css';
import './styles/skins.css';
import './styles/handmade.css';
import './styles/navigation.css';
import './styles/motion.css';
render(<App />, document.getElementById('app')!);
