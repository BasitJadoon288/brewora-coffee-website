'use client';
import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, refreshToken, setToken, type Portal } from '@/lib/api';
import type { User } from '@/lib/types';

interface AuthCtx { user: User | null; loading: boolean; login(email: string, password: string): Promise<User>; register(d: { fullName: string; email: string; password: string; phoneNumber?: string }): Promise<User>; logout(): Promise<void>; updateUser(u: User): void }
const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // One session per portal: signing in on the website never signs the admin out (and the other way round).
  const portal: Portal = usePathname().startsWith('/admin') ? 'admin' : 'customer';
  const [users, setUsers] = useState<Record<Portal, User | null>>({ admin: null, customer: null });
  const [ready, setReady] = useState<Record<Portal, boolean>>({ admin: false, customer: false });
  const started = useRef<Record<Portal, boolean>>({ admin: false, customer: false });
  useEffect(() => {
    if (started.current[portal]) return; started.current[portal] = true;
    (async () => { try { if (await refreshToken()) { const u = await api<User>('/auth/profile'); setUsers(s => ({ ...s, [portal]: u })); } } catch { /* signed out */ } finally { setReady(s => ({ ...s, [portal]: true })); } })();
  }, [portal]);
  const user = users[portal]; const loading = !ready[portal];
  const setUser = useCallback((u: User | null) => setUsers(s => ({ ...s, [portal]: u })), [portal]);
  const login = useCallback(async (email: string, password: string) => {
    const r = await api<{ user: User; accessToken: string }>('/auth/login', { method: 'POST', body: { email, password } });
    setToken(r.accessToken); setUser(r.user); return r.user;
  }, [setUser]);
  const register = useCallback(async (d: { fullName: string; email: string; password: string; phoneNumber?: string }) => {
    const r = await api<{ user: User; accessToken: string }>('/auth/register', { method: 'POST', body: d }); setToken(r.accessToken); setUser(r.user); return r.user;
  }, [setUser]);
  const logout = useCallback(async () => { try { await api('/auth/logout', { method: 'POST' }); } catch { /* ignore */ } setToken(null); setUser(null); }, [setUser]);
  const value = useMemo(() => ({ user, loading, login, register, logout, updateUser: setUser }), [user, loading, login, register, logout, setUser]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
