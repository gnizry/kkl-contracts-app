import {createRoot} from 'react-dom/client';
import { ConnectionProvider } from './connection';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<ConnectionProvider><App /></ConnectionProvider>);
