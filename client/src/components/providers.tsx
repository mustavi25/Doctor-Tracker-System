"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Toaster } from "@/components/ui/sonner";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Don't retry 4xx (validation / auth / not found); retry flaky network or 5xx twice
        retry: (failureCount, error) => {
          const status = isAxiosError(error) ? error.response?.status : undefined;
          if (status && status < 500) return false;
          return failureCount < 2;
        },
      },
    },
  });
}

export default function Providers({ children }: { children: React.ReactNode }) {
  // useState keeps one client per browser session (not recreated on re-render)
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
