'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { CartProvider } from '@/lib/cart';
import { WishlistProvider } from '@/lib/wishlist';
import { AuthProvider } from './auth';
import { ToastProvider } from './toast';
export default function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } }));
  return <QueryClientProvider client={qc}><ToastProvider><AuthProvider><CartProvider><WishlistProvider>{children}</WishlistProvider></CartProvider></AuthProvider></ToastProvider></QueryClientProvider>;
}
