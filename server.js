const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { promisify } = require('node:util');
const express = require('express');
const { createDatabase } = require('./lib/database');

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(path.join(__dirname, '.env'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

const scrypt = promisify(crypto.scrypt);
const ROOT = __dirname;
const SESSION_COOKIE = 'snippetstudio_session';
const PROTECTED_PAGES = new Set([
  'dashboard.html',
  'html.html',
  'css.html',
  'javascript.html',
  'php.html',
  'python.html'
]);
const PAGE_ALIASES = {
  '/dashboard': '/dashboard.html',
  '/login': '/login.html',
  '/register': '/login.html?mode=register',
  '/about': '/about.html',
  '/faqs': '/faqs.html',
  '/terms': '/terms.html',
  '/privacy': '/privacy.html',
  '/forgot': '/forgot.html',
  '/html': '/html.html',
  '/css': '/css.html',
  '/javascript': '/javascript.html',
  '/php': '/php.html',
  '/python': '/python.html'
};
const PUBLIC_FILES = new Set([
  'index.html', 'login.html', 'forgot.html', 'about.html', 'faqs.html', 'terms.html', 'privacy.html', '404.html',
  'dashboard.html', 'html.html', 'css.html', 'javascript.html', 'php.html', 'python.html',
  'style.css', 'dashboard.css', 'script.js', 'dashboard.js', 'auth.js', 'community.js', 'dashboard-api.js', 'img.jpeg', 'Example.png.png'
]);
const TEMPLATE_CATEGORIES = new Set(['landing', 'saas', 'dashboard', 'marketing', 'layout', 'forms', 'media', 'advanced', 'basic', 'content', 'components']);

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function readCookie(request, cookieName) {
  const cookies = String(request.headers.cookie || '').split(';');
  const cookie = cookies.find((entry) => entry.trim().startsWith(`${cookieName}=`));
  if (!cookie) return null;
  try {
    return decodeURIComponent(cookie.trim().slice(cookieName.length + 1));
  } catch (error) {
    return null;
  }
}

function setSessionCookie(response, token, maxAgeSeconds, secure) {
  const flags = [`${SESSION_COOKIE}=${encodeURIComponent(token)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAgeSeconds}`];
  if (secure) flags.push('Secure');
  response.setHeader('Set-Cookie', flags.join('; '));
}

function clearSessionCookie(response, secure) {
  const flags = [`${SESSION_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (secure) flags.push('Secure');
  response.setHeader('Set-Cookie', flags.join('; '));
}

function createApp(options = {}) {
  const app = express();
  const configuredDataFile = options.dataFile || process.env.DATA_FILE || path.join(ROOT, 'data', 'store.json');
  const databasePath = path.isAbsolute(configuredDataFile) ? configuredDataFile : path.resolve(ROOT, configuredDataFile);
  const database = createDatabase(databasePath);
  const sessionHours = Number.parseInt(process.env.SESSION_HOURS || '12', 10) || 12;
  const secureCookies = process.env.NODE_ENV === 'production';
  const authAttempts = new Map();
  const eventClients = new Set();

  function broadcast(eventName, payload) {
    const message = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
    eventClients.forEach((client) => {
      if (client.response.destroyed) {
        clearInterval(client.heartbeat);
        eventClients.delete(client);
        return;
      }
      client.response.write(message);
    });
  }

  app.disable('x-powered-by');
  app.use(express.json({ limit: '256kb' }));

  app.use((request, response, next) => {
    const state = database.read();
    const token = readCookie(request, SESSION_COOKIE);
    const session = token ? state.sessions.find((item) => item.tokenHash === hashToken(token) && Date.parse(item.expiresAt) > Date.now()) : null;
    request.user = session ? state.users.find((user) => user.id === session.userId) || null : null;
    request.sessionTokenHash = session ? session.tokenHash : null;
    next();
  });

  function requireAuth(request, response, next) {
    if (!request.user) {
      return response.status(401).json({ error: 'Sign in to continue.' });
    }
    next();
  }

  app.get('/api/events', requireAuth, (request, response) => {
    response.status(200).set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    response.flushHeaders();
    response.write('event: ready\ndata: {}\n\n');

    const client = { userId: request.user.id, response, heartbeat: null };
    const cleanup = () => {
      clearInterval(client.heartbeat);
      eventClients.delete(client);
    };
    client.heartbeat = setInterval(() => response.write(': keepalive\n\n'), 20000);
    client.heartbeat.unref();
    eventClients.add(client);
    request.on('close', cleanup);
    response.on('close', cleanup);
  });

  function limitAuthAttempts(request, response, next) {
    const key = request.ip || request.socket.remoteAddress || 'unknown';
    const current = authAttempts.get(key);
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    if (current && current.expiresAt > now && current.count >= 30) {
      return response.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
    }
    if (!current || current.expiresAt <= now) {
      authAttempts.set(key, { count: 1, expiresAt: now + windowMs });
    } else {
      current.count += 1;
    }
    next();
  }

  async function createSession(response, user, remember = false) {
    const state = database.read();
    const token = crypto.randomBytes(32).toString('base64url');
    const durationSeconds = remember ? 30 * 24 * 60 * 60 : sessionHours * 60 * 60;
    const expiresAt = new Date(Date.now() + durationSeconds * 1000).toISOString();
    state.sessions = state.sessions.filter((session) => Date.parse(session.expiresAt) > Date.now());
    state.sessions.push({ tokenHash: hashToken(token), userId: user.id, expiresAt });
    database.write(state);
    setSessionCookie(response, token, durationSeconds, secureCookies);
  }

  app.post('/api/auth/register', limitAuthAttempts, async (request, response, next) => {
    try {
      const name = String(request.body?.name || '').trim();
      const email = normalizeEmail(request.body?.email);
      const password = String(request.body?.password || '');
      if (name.length < 2 || name.length > 60) return response.status(400).json({ error: 'Name must be between 2 and 60 characters.' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return response.status(400).json({ error: 'Enter a valid email address.' });
      if (password.length < 10 || password.length > 128) return response.status(400).json({ error: 'Password must be between 10 and 128 characters.' });

      if (database.read().users.some((user) => user.email === email)) return response.status(409).json({ error: 'An account with that email already exists.' });
      const salt = crypto.randomBytes(16).toString('hex');
      const derived = await scrypt(password, salt, 64);
      const user = {
        id: crypto.randomUUID(),
        name,
        email,
        passwordHash: `scrypt$${salt}$${derived.toString('hex')}`,
        createdAt: new Date().toISOString()
      };
      const state = database.read();
      if (state.users.some((existingUser) => existingUser.email === email)) return response.status(409).json({ error: 'An account with that email already exists.' });
      state.users.push(user);
      database.write(state);
      await createSession(response, user, Boolean(request.body?.remember));
      response.status(201).json({ user: publicUser(user) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/auth/login', limitAuthAttempts, async (request, response, next) => {
    try {
      const email = normalizeEmail(request.body?.email);
      const password = String(request.body?.password || '');
      const state = database.read();
      const user = state.users.find((item) => item.email === email);
      let valid = false;

      if (user?.passwordHash) {
        const [, salt, expectedHex] = user.passwordHash.split('$');
        const actual = await scrypt(password, salt, 64);
        const expected = Buffer.from(expectedHex, 'hex');
        valid = actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
      } else {
        const salt = 'snippet-studio-invalid-account-check';
        await scrypt(password, salt, 64);
      }

      if (!valid) return response.status(401).json({ error: 'Email or password is incorrect.' });
      await createSession(response, user, Boolean(request.body?.remember));
      response.json({ user: publicUser(user) });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/auth/me', (request, response) => {
    if (!request.user) return response.status(401).json({ error: 'No active session.' });
    response.json({ user: publicUser(request.user) });
  });

  app.post('/api/auth/logout', (request, response) => {
    if (request.sessionTokenHash) {
      const state = database.read();
      state.sessions = state.sessions.filter((session) => session.tokenHash !== request.sessionTokenHash);
      database.write(state);
    }
    clearSessionCookie(response, secureCookies);
    response.status(204).end();
  });

  app.get('/api/templates', requireAuth, (request, response) => {
    const state = database.read();
    const query = String(request.query.q || '').trim().toLowerCase();
    const category = String(request.query.category || '').trim().toLowerCase();
    const templates = state.templates.filter((template) => {
      const matchesCategory = !category || category === 'all' || template.category === category;
      const matchesQuery = !query || `${template.title} ${template.description} ${template.category} ${template.author}`.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
    response.json({ templates });
  });

  app.get('/api/templates/:id', requireAuth, (request, response) => {
    const template = database.read().templates.find((item) => item.id === request.params.id);
    if (!template) return response.status(404).json({ error: 'Template not found.' });
    response.json({ template });
  });

  app.post('/api/templates', requireAuth, (request, response) => {
    const title = String(request.body?.title || '').trim();
    const category = String(request.body?.category || '').trim().toLowerCase();
    const description = String(request.body?.description || '').trim();
    const code = String(request.body?.code || '').trim();
    if (!title || title.length > 100 || !TEMPLATE_CATEGORIES.has(category) || !description || description.length > 500 || !code || code.length > 50000) {
      return response.status(400).json({ error: 'Provide a title (100 characters max), a supported category, a description (500 characters max), and code (50 KB max).' });
    }

    const state = database.read();
    const template = {
      id: crypto.randomUUID(),
      title,
      category,
      description,
      code,
      author: request.user.name,
      authorId: request.user.id,
      createdAt: new Date().toISOString()
    };
    state.templates.unshift(template);
    state.notifications.unshift({ id: crypto.randomUUID(), userId: null, author: request.user.name, message: `published “${title}”.`, createdAt: template.createdAt });
    database.write(state);
    broadcast('template-published', { template });
    response.status(201).json({ template });
  });

  app.patch('/api/templates/:id', requireAuth, (request, response) => {
    const state = database.read();
    const template = state.templates.find((item) => item.id === request.params.id);
    if (!template) return response.status(404).json({ error: 'Template not found.' });
    if (template.authorId !== request.user.id) return response.status(403).json({ error: 'You can only edit your own templates.' });

    const updates = {};
    if (request.body?.title !== undefined) updates.title = String(request.body.title).trim();
    if (request.body?.category !== undefined) updates.category = String(request.body.category).trim().toLowerCase();
    if (request.body?.description !== undefined) updates.description = String(request.body.description).trim();
    if (request.body?.code !== undefined) updates.code = String(request.body.code).trim();
    if (updates.title !== undefined && (!updates.title || updates.title.length > 100)) return response.status(400).json({ error: 'Title is required and must be 100 characters or fewer.' });
    if (updates.category !== undefined && !TEMPLATE_CATEGORIES.has(updates.category)) return response.status(400).json({ error: 'Choose a supported category.' });
    if (updates.description !== undefined && (!updates.description || updates.description.length > 500)) return response.status(400).json({ error: 'Description is required and must be 500 characters or fewer.' });
    if (updates.code !== undefined && (!updates.code || updates.code.length > 50000)) return response.status(400).json({ error: 'Code is required and must be 50 KB or fewer.' });
    Object.assign(template, updates, { updatedAt: new Date().toISOString() });
    database.write(state);
    broadcast('template-updated', { template });
    response.json({ template });
  });

  app.delete('/api/templates/:id', requireAuth, (request, response) => {
    const state = database.read();
    const index = state.templates.findIndex((item) => item.id === request.params.id);
    if (index < 0) return response.status(404).json({ error: 'Template not found.' });
    if (state.templates[index].authorId !== request.user.id) return response.status(403).json({ error: 'You can only delete your own templates.' });
    const [template] = state.templates.splice(index, 1);
    database.write(state);
    broadcast('template-deleted', { id: template.id });
    response.status(204).end();
  });

  app.get('/api/reviews', requireAuth, (request, response) => {
    const reviews = database.read().reviews.filter((review) => !request.query.templateId || review.templateId === request.query.templateId);
    response.json({ reviews });
  });

  app.post('/api/reviews', requireAuth, (request, response) => {
    const message = String(request.body?.message || '').trim();
    const templateId = request.body?.templateId ? String(request.body.templateId) : null;
    if (!message || message.length > 2000) return response.status(400).json({ error: 'Review must be between 1 and 2,000 characters.' });
    const state = database.read();
    if (templateId && !state.templates.some((template) => template.id === templateId)) return response.status(404).json({ error: 'Template not found.' });
    const review = { id: crypto.randomUUID(), templateId, userId: request.user.id, author: request.user.name, message, createdAt: new Date().toISOString() };
    state.reviews.unshift(review);
    state.notifications.unshift({ id: crypto.randomUUID(), userId: null, author: request.user.name, message: 'left a community review.', createdAt: review.createdAt });
    database.write(state);
    broadcast('review-created', { review });
    response.status(201).json({ review });
  });

  app.get('/api/follows', requireAuth, (request, response) => {
    const state = database.read();
    response.json({ follows: state.follows.filter((follow) => follow.followerId === request.user.id) });
  });

  app.get('/api/users', requireAuth, (request, response) => {
    const state = database.read();
    const followingIds = new Set(state.follows.filter((follow) => follow.followerId === request.user.id).map((follow) => follow.followingId));
    const users = state.users
      .filter((user) => user.id !== request.user.id)
      .map((user) => ({ id: user.id, name: user.name, following: followingIds.has(user.id) }));
    response.json({ users });
  });

  app.post('/api/follows/:userId', requireAuth, (request, response) => {
    if (request.params.userId === request.user.id) return response.status(400).json({ error: 'You cannot follow your own account.' });
    const state = database.read();
    const target = state.users.find((user) => user.id === request.params.userId);
    if (!target) return response.status(404).json({ error: 'Account not found.' });
    const existingIndex = state.follows.findIndex((follow) => follow.followerId === request.user.id && follow.followingId === target.id);
    let following;
    if (existingIndex >= 0) {
      state.follows.splice(existingIndex, 1);
      following = false;
    } else {
      state.follows.push({ followerId: request.user.id, followingId: target.id, createdAt: new Date().toISOString() });
      following = true;
    }
    database.write(state);
    broadcast('follow-updated', { followerId: request.user.id, followingId: target.id, following });
    response.json({ following, user: publicUser(target) });
  });

  app.get('/api/profile', requireAuth, (request, response) => {
    response.json({ user: publicUser(request.user) });
  });

  app.get('/api/notifications', requireAuth, (request, response) => {
    const notifications = database.read().notifications
      .filter((item) => !item.userId || item.userId === request.user.id)
      .slice(0, 30);
    response.json({ notifications });
  });

  app.get('/api/dashboard', requireAuth, (request, response) => {
    const state = database.read();
    const templates = state.templates.filter((template) => template.authorId === request.user.id);
    const followers = state.follows.filter((follow) => follow.followingId === request.user.id).length;
    const following = state.follows.filter((follow) => follow.followerId === request.user.id).length;
    const reviews = state.reviews.filter((review) => review.userId === request.user.id).length;
    const categoryCounts = state.templates.reduce((counts, template) => {
      counts[template.category] = (counts[template.category] || 0) + 1;
      return counts;
    }, {});
    response.json({
      user: publicUser(request.user),
      stats: { templates: templates.length, communityTemplates: state.templates.length, followers, following, reviews },
      categoryCounts,
      recentTemplates: templates.slice(0, 5)
    });
  });

  app.get('/api/health', (request, response) => response.json({ status: 'ok' }));

  app.get('*', (request, response, next) => {
    const alias = PAGE_ALIASES[request.path];
    if (alias) return response.redirect(302, alias);
    if (request.path.startsWith('/api/')) return next();

    let requestedPath;
    try {
      requestedPath = decodeURIComponent(request.path);
    } catch (error) {
      return response.status(400).send('Invalid path.');
    }
    const fileName = requestedPath === '/' ? 'index.html' : requestedPath.slice(1);
    if (!PUBLIC_FILES.has(fileName)) return response.status(404).sendFile(path.join(ROOT, '404.html'));

    if (PROTECTED_PAGES.has(fileName) && !request.user) {
      const returnTo = `${request.path}${request.url.includes('?') ? request.url.slice(request.url.indexOf('?')) : ''}`;
      return response.redirect(302, `/login.html?next=${encodeURIComponent(returnTo)}`);
    }
    response.sendFile(path.join(ROOT, fileName));
  });

  app.use((request, response) => {
    if (request.path.startsWith('/api/')) return response.status(404).json({ error: 'API route not found.' });
    response.status(404).send('Not found.');
  });

  app.use((error, request, response, next) => {
    if (response.headersSent) return next(error);
    if (error.type === 'entity.too.large') return response.status(413).json({ error: 'Request body is too large.' });
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) return response.status(400).json({ error: 'Request body must be valid JSON.' });
    console.error(error);
    response.status(500).json({ error: 'An unexpected server error occurred.' });
  });

  return app;
}

if (require.main === module) {
  const app = createApp();
  const configuredPort = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000;
  const allowFallback = !process.env.PORT;

  function listen(port) {
    const server = app.listen(port, () => {
      const actualPort = server.address().port;
      console.log(`Snippet Studio backend running on http://localhost:${actualPort}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE' && allowFallback && port < 65535) {
        console.warn(`Port ${port} is already in use; trying ${port + 1}.`);
        listen(port + 1);
        return;
      }
      console.error(`Could not start Snippet Studio on port ${port}: ${error.message}`);
      process.exitCode = 1;
    });
  }

  if (!Number.isInteger(configuredPort) || configuredPort < 0 || configuredPort > 65535) {
    console.error('PORT must be a number between 0 and 65535.');
    process.exitCode = 1;
  } else {
    listen(configuredPort);
  }
}

module.exports = { createApp };
