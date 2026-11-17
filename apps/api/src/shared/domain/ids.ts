export const isObjectId = (id: unknown): id is string => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);
