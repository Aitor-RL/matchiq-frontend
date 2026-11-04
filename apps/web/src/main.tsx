import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@fontsource/barlow/latin-400.css';
import '@fontsource/barlow/latin-500.css';
import '@fontsource/barlow/latin-600.css';
import '@fontsource/barlow/latin-700.css';
import '@fontsource/barlow-condensed/latin-800-italic.css';
import '@fontsource/barlow-condensed/latin-900-italic.css';
import App from './App';
import './styles.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 60000, retry: false, refetchOnWindowFocus: false } } });
const root = document.getElementById('root')!;
const application = <React.StrictMode><QueryClientProvider client={queryClient}><BrowserRouter><App /></BrowserRouter></QueryClientProvider></React.StrictMode>;
if (root.hasChildNodes() && ['/', '/inicio', '/comparador', '/equipos'].includes(window.location.pathname) && !window.location.search) ReactDOM.hydrateRoot(root, application);
else ReactDOM.createRoot(root).render(application);
