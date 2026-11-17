import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { safeNext } from '../src/lib/nav';
import { paragraphs } from '../src/lib/text';

const replace = vi.fn(); const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace, push }), usePathname: () => '/admin', useSearchParams: () => new URLSearchParams() }));
vi.mock('next/link', () => ({ default: ({ href, children, ...r }: any) => <a href={href} {...r}>{children}</a> }));
let authState: any = { user: null, loading: false, logout: vi.fn() };
vi.mock('@/components/auth', () => ({ useAuth: () => authState }));
afterEach(() => { cleanup(); replace.mockClear(); vi.unstubAllGlobals(); });
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });
const wrap = (ui: React.ReactElement) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);

describe('helpers', () => {
  it('safeNext only allows same-site relative paths', () => { expect(safeNext('/checkout')).toBe('/checkout'); for (const bad of ['//evil.com', 'https://evil.com', 'javascript:alert(1)', '/\\evil.com', null]) expect(safeNext(bad as any)).toBe('/account'); });
  it('paragraphs splits admin text and never produces HTML', () => { expect(paragraphs('a\n\nb\n\n\n\nc ')).toEqual(['a', 'b', 'c']); expect(paragraphs('<b>x</b>')).toEqual(['<b>x</b>']); });
});
describe('admin protected routes', () => {
  it('redirects a signed-out visitor to the admin login and renders nothing sensitive', async () => {
    authState = { user: null, loading: false, logout: vi.fn() }; const { default: AdminLayout } = await import('../src/app/admin/(portal)/layout');
    wrap(<AdminLayout><p>secret dashboard</p></AdminLayout>); await waitFor(() => expect(replace).toHaveBeenCalledWith('/admin/login')); expect(screen.queryByText('secret dashboard')).toBeNull();
  });
  it('redirects a signed-in CUSTOMER away from the admin area', async () => {
    authState = { user: { id: '1', role: 'Customer', email: 'c@x.pk', fullName: 'C' }, loading: false, logout: vi.fn() }; const { default: AdminLayout } = await import('../src/app/admin/(portal)/layout');
    wrap(<AdminLayout><p>secret dashboard</p></AdminLayout>); await waitFor(() => expect(replace).toHaveBeenCalledWith('/admin/login')); expect(screen.queryByText('secret dashboard')).toBeNull();
  });
  it('shows the full admin navigation to an admin', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ items: [], unread: 0 }))); authState = { user: { id: '1', role: 'Admin', email: 'a@x.pk', fullName: 'A' }, loading: false, logout: vi.fn() };
    const { default: AdminLayout } = await import('../src/app/admin/(portal)/layout'); wrap(<AdminLayout><p>secret dashboard</p></AdminLayout>);
    expect(screen.getByText('secret dashboard')).toBeTruthy(); for (const l of ['Products', 'Orders', 'Customers', 'Inventory', 'Coupons', 'Banners', 'Pages & content', 'Reports', 'Settings']) expect(screen.getAllByText(l).length).toBeGreaterThan(0); expect(replace).not.toHaveBeenCalled();
  });
});
describe('contact form', () => {
  it('shows server-side field errors and success message', async () => {
    const { default: ContactForm } = await import('../src/components/ContactForm');
    const f = vi.fn().mockResolvedValueOnce(json({ message: 'Validation failed', errors: { message: ['String must contain at least 10 character(s)'] } }, 400)).mockResolvedValueOnce(json({ message: 'Thanks! We will get back to you soon.' }, 201)); vi.stubGlobal('fetch', f);
    const { container } = render(<ContactForm />); const set = (id: string, v: string) => fireEvent.change(container.querySelector(`#${id}`)!, { target: { value: v } });
    set('cn', 'Ali Khan'); set('ce', 'ali@example.com'); set('cm', 'short'); fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/at least 10/)); set('cm', 'Do you deliver to Lahore?'); fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/Thanks/));
  });
});
