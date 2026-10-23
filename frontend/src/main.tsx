import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './routes/App';
import './styles/global.css';
import './styles/inventory.css';
createRoot(document.getElementById('root')!).render(<StrictMode><BrowserRouter><App/></BrowserRouter></StrictMode>);
