// On web, the browser's own localStorage keeps the login session.
export const authStorage = typeof window === 'undefined' ? undefined : window.localStorage;
