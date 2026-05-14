import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { queryClient } from './lib/query-client';
import { AuthProvider } from './lib/auth';
import { AuthGate } from './components/auth/AuthGate';
import './styles/globals.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root');

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGate>
          <RouterProvider router={router} />
        </AuthGate>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
