const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { createApp } = require('../server');

async function createTestServer(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'snippet-studio-'));
  const app = createApp({ dataFile: path.join(directory, 'store.json') });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();
  t.after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return { baseUrl: `http://127.0.0.1:${address.port}`, databaseFile: path.join(directory, 'store.json') };
}

async function register(baseUrl, email = 'maker@example.com') {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Maker', email, password: 'correct horse battery staple' })
  });
  const cookie = response.headers.get('set-cookie')?.split(';')[0];
  return { response, cookie };
}

test('guest access is denied and project internals are not served', async (t) => {
  const { baseUrl } = await createTestServer(t);

  const page = await fetch(`${baseUrl}/html.html`, { redirect: 'manual' });
  assert.equal(page.status, 302);
  assert.match(page.headers.get('location'), /login\.html/);

  const templates = await fetch(`${baseUrl}/api/templates`);
  assert.equal(templates.status, 401);

  const dataFile = await fetch(`${baseUrl}/data/store.json`);
  assert.equal(dataFile.status, 404);

  const serverSource = await fetch(`${baseUrl}/server.js`);
  assert.equal(serverSource.status, 404);
});

test('accounts authenticate and own their published templates', async (t) => {
  const { baseUrl, databaseFile } = await createTestServer(t);
  const { response: registration, cookie } = await register(baseUrl);
  assert.equal(registration.status, 201);
  assert.ok(cookie);
  assert.match(registration.headers.get('set-cookie'), /HttpOnly/);
  assert.match(registration.headers.get('set-cookie'), /SameSite=Lax/);

  const identity = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: cookie } });
  assert.equal(identity.status, 200);
  const { user } = await identity.json();
  assert.equal(user.email, 'maker@example.com');
  assert.equal(Object.hasOwn(user, 'passwordHash'), false);

  const catalogResponse = await fetch(`${baseUrl}/api/templates`, { headers: { Cookie: cookie } });
  assert.equal(catalogResponse.status, 200);
  const catalog = await catalogResponse.json();
  assert.ok(catalog.templates.length >= 12);

  const otherAccount = await register(baseUrl, 'other@example.com');
  assert.equal(otherAccount.response.status, 201);
  const streamResponse = await fetch(`${baseUrl}/api/events`, { headers: { Cookie: otherAccount.cookie } });
  assert.equal(streamResponse.status, 200);
  const streamReader = streamResponse.body.getReader();
  const decoder = new TextDecoder();
  const readyEvent = decoder.decode((await streamReader.read()).value);
  assert.match(readyEvent, /event: ready/);

  const createResponse = await fetch(`${baseUrl}/api/templates`, {
    method: 'POST',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'My first template', category: 'landing', description: 'A real saved template.', code: '<main>Saved on the server</main>' })
  });
  assert.equal(createResponse.status, 201);
  const { template } = await createResponse.json();
  assert.equal(template.authorId, user.id);

  const publishedEvent = decoder.decode((await streamReader.read()).value);
  assert.match(publishedEvent, /event: template-published/);
  assert.match(publishedEvent, /My first template/);
  await streamReader.cancel();

  const otherCatalogResponse = await fetch(`${baseUrl}/api/templates`, { headers: { Cookie: otherAccount.cookie } });
  const otherCatalog = await otherCatalogResponse.json();
  assert.ok(otherCatalog.templates.some((item) => item.id === template.id));

  const diskState = JSON.parse(fs.readFileSync(databaseFile, 'utf8'));
  assert.ok(diskState.templates.some((item) => item.id === template.id));
  assert.equal(diskState.users[0].passwordHash.includes('correct horse battery staple'), false);

  const otherIdentity = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: otherAccount.cookie } });
  const otherUser = (await otherIdentity.json()).user;
  const forbiddenEdit = await fetch(`${baseUrl}/api/templates/${template.id}`, {
    method: 'PATCH',
    headers: { Cookie: otherAccount.cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Not mine' })
  });
  assert.equal(forbiddenEdit.status, 403);

  const follow = await fetch(`${baseUrl}/api/follows/${otherUser.id}`, { method: 'POST', headers: { Cookie: cookie } });
  assert.equal((await follow.json()).following, true);
  const review = await fetch(`${baseUrl}/api/reviews`, {
    method: 'POST',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ templateId: template.id, message: 'Saved from the integration test.' })
  });
  assert.equal(review.status, 201);

  const logout = await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST', headers: { Cookie: cookie } });
  assert.equal(logout.status, 204);
  const expiredIdentity = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: cookie } });
  assert.equal(expiredIdentity.status, 401);

  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'maker@example.com', password: 'correct horse battery staple' })
  });
  assert.equal(login.status, 200);
});
