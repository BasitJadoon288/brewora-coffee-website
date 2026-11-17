declare global { namespace Express { interface Request { user?: { id: string; role: 'Admin' | 'Customer' } } } }
export {};
