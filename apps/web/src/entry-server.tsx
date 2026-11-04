import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
export { routeMeta, siteUrl, pageMeta } from './seo';
export { contextHref } from './navigation';

export function render(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 60000 } } });
  try { return renderToString(<QueryClientProvider client={queryClient}><StaticRouter location={path}><App /></StaticRouter></QueryClientProvider>); }
  finally { queryClient.clear(); }
}
