import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 15, // 15 minutes
      refetchOnWindowFocus: true,
      retry: (failureCount, error) => {
        // Don't retry on 401/403 or specific auth errors
        if (error && typeof error === 'object' && 'status' in error && (error.status === 401 || error.status === 403)) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
