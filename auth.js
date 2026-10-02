(function (global) {
  const PROTECTED_PAGES = new Set(['dashboard.html', 'html.html', 'css.html', 'javascript.html', 'php.html', 'python.html']);

  async function request(path, options = {}) {
    if (global.location.protocol === 'file:') {
      throw new Error('Start Snippet Studio with npm start, then open http://localhost:3000.');
    }

    const headers = new Headers(options.headers || {});
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    const response = await fetch(path, { ...options, headers, credentials: 'same-origin' });
    if (response.status === 204) return null;
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(result.error || 'The request could not be completed.');
      error.status = response.status;
      throw error;
    }
    return result;
  }

  async function getCurrentUser() {
    try {
      const result = await request('/api/auth/me');
      return result.user;
    } catch (error) {
      if (error.status === 401) return null;
      throw error;
    }
  }

  async function ensureRouteAccess() {
    const page = global.location.pathname.split('/').filter(Boolean).pop() || 'index.html';
    if (!PROTECTED_PAGES.has(page)) return null;

    if (global.location.protocol === 'file:') {
      global.location.href = 'login.html';
      return null;
    }

    const user = await getCurrentUser();
    if (!user) {
      const next = `${global.location.pathname}${global.location.search}${global.location.hash}`;
      global.location.replace(`/login.html?next=${encodeURIComponent(next)}`);
    }
    return user;
  }

  async function applyAuthNavigation() {
    let user = null;
    try {
      user = await getCurrentUser();
    } catch (error) {
      console.warn('Authentication service is unavailable.', error);
    }

    document.querySelectorAll('.nav-login, [data-auth-route]').forEach((element) => {
      element.setAttribute('href', user ? '/dashboard.html' : '/login.html');
      element.textContent = user ? 'Dashboard' : 'Login';
    });

    document.querySelectorAll('[data-logout]').forEach((button) => {
      button.addEventListener('click', async (event) => {
        event.preventDefault();
        try {
          await request('/api/auth/logout', { method: 'POST' });
        } finally {
          global.location.assign('/login.html');
        }
      });
    });

    document.querySelectorAll('[data-user-name]').forEach((element) => {
      if (user) element.textContent = user.name;
    });
    return user;
  }

  const api = {
    request,
    getCurrentUser,
    ensureRouteAccess,
    applyAuthNavigation,
    register: (details) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(details) }),
    login: (details) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(details) }),
    logout: () => request('/api/auth/logout', { method: 'POST' })
  };

  global.SnippetAuth = api;

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async () => {
      try {
        await ensureRouteAccess();
      } catch (error) {
        console.warn('Could not verify this page session.', error);
      }
      await applyAuthNavigation();
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
