'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, refreshToken, setToken } from '@/lib/api';
import type { User } from '@/lib/types';

interface AuthCtx { user: User | null; loading: boolean; login(email: string, password: string): Promise<User>; register(d: { fullName: string; email: string; password: string; phoneNumber?: string }): Promise<User>; logout(): Promise<void>; updateUser(u: User): void }
const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => { try { if (await refreshToken()) setUser(await api<User>('/auth/profile')); } catch { /* signed out */ } finally { setLoading(false); } })();
  }, []);
  const login = useCallback(async (email: string, password: string) => {
    const r = await api<{ user: User; accessToken: string }>('/auth/login', { method: 'POST', body: { email, password } });
    setToken(r.accessToken); setUser(r.user); return r.user;
  }, []);
  const register = useCallback(async (d: { fullName: string; email: string; password: string; phoneNumber?: string }) => {
    const r = await api<{ user: User; accessToken: string }>('/auth/register', { method: 'POST', body: d }); setToken(r.accessToken); setUser(r.user); return r.user;
  }, []);
  const logout = useCallback(async () => { try { await api('/auth/logout', { method: 'POST' }); } catch { /* ignore */ } setToken(null); setUser(null); }, []);
  const value = useMemo(() => ({ user, loading, login, register, logout, updateUser: setUser }), [user, loading, login, register, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
