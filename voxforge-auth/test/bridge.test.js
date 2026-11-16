// Тест моста на заглушке Quorvox ID: полный круг OIDC code + PKCE и негативные случаи.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import { createApp, loadConfig } from '../server.js';

const CLIENT_ID = 'test-client';
const CLIENT_SECRET = 'test-secret';
const EDITOR = 'http://localhost:3000';

let issuerServer;
let bridgeServer;
let issuerUrl;
let bridgeUrl;
let privateKey;
let jwk;
let codes; // code -> { challenge, nonce, redirect }
let claimsForNextToken;

const listen = server =>
  new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${server.address().port}`)));

const signJwt = (payload, key = privateKey) => {
  const h = Buffer.from(JSON.stringify({ alg: 'ES256', kid: 'k1' })).toString('base64url');
  const p = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.sign('sha256', Buffer.from(`${h}.${p}`), { key, dsaEncoding: 'ieee-p1363' });
  return `${h}.${p}.${sig.toString('base64url')}`;
};

before(async () => {
  const kp = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  privateKey = kp.privateKey;
  jwk = { ...kp.publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'ES256', use: 'sig' };
  codes = new Map();
  claimsForNextToken = {};

  // Заглушка провайдера.
  issuerServer = http.createServer(async (req, res) => {
    const u = new URL(req.url, issuerUrl);
    if (u.pathname === '/.well-known/openid-configuration') {
      res.setHeader('Content-Type', 'application/json');
      return res.end(
        JSON.stringify({
          issuer: issuerUrl,
          authorization_endpoint: `${issuerUrl}/authorize`,
          token_endpoint: `${issuerUrl}/token`,
          jwks_uri: `${issuerUrl}/jwks`,
        })
      );
    }
    if (u.pathname === '/jwks') {
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ keys: [jwk] }));
    }
    if (u.pathname === '/authorize') {
      const q = u.searchParams;
      const code = crypto.randomBytes(8).toString('hex');
      codes.set(code, {
        challenge: q.get('code_challenge'),
        nonce: q.get('nonce'),
        redirect: q.get('redirect_uri'),
        method: q.get('code_challenge_method'),
        clientId: q.get('client_id'),
      });
      const back = new URL(q.get('redirect_uri'));
      back.searchParams.set('code', code);
      back.searchParams.set('state', q.get('state'));
      res.writeHead(302, { Location: back.toString() });
      return res.end();
    }
    if (u.pathname === '/token' && req.method === 'POST') {
      let body = '';
      for await (const c of req) body += c;
      const f = new URLSearchParams(body);
      const basic = Buffer.from((req.headers.authorization || '').replace('Basic ', ''), 'base64').toString();
      res.setHeader('Content-Type', 'application/json');
      const c = codes.get(f.get('code'));
      if (basic !== `${CLIENT_ID}:${CLIENT_SECRET}` || !c || c.method !== 'S256') {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'invalid_grant' }));
      }
      const verifierHash = crypto.createHash('sha256').update(f.get('code_verifier')).digest('base64url');
      if (verifierHash !== c.challenge || f.get('redirect_uri') !== c.redirect) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'invalid_grant', error_description: 'PKCE' }));
      }
      codes.delete(f.get('code'));
      const now = Math.floor(Date.now() / 1000);
      return res.end(
        JSON.stringify({
          id_token: signJwt({
            iss: issuerUrl,
            aud: CLIENT_ID,
            sub: 'acc-1',
            name: 'Николай',
            quorvox_id: 'QV-12345678',
            email: 'n@example.com',
            email_verified: true,
            iat: now,
            exp: now + 600,
            nonce: c.nonce,
            ...claimsForNextToken,
          }),
        })
      );
    }
    res.statusCode = 404;
    res.end();
  });
  issuerUrl = await listen(issuerServer);

  const config = loadConfig({
    QUORVOX_ISSUER: issuerUrl,
    QUORVOX_CLIENT_ID: CLIENT_ID,
    QUORVOX_CLIENT_SECRET: CLIENT_SECRET,
    PUBLIC_URL: 'http://127.0.0.1:0', // заменим реальным портом ниже
    EDITOR_URL: EDITOR,
    SESSION_SECRET: 'test-session-secret',
  });
  bridgeServer = createApp(config);
  bridgeUrl = await listen(bridgeServer);
  config.publicUrl = bridgeUrl;
  config.redirectUri = `${bridgeUrl}/auth/quorvox/callback`;
});

after(() => {
  issuerServer.close();
  bridgeServer.close();
});

// Проходит весь круг вручную, не следуя редиректам автоматически.
const login = async () => {
  const start = await fetch(`${bridgeUrl}/auth/quorvox`, { redirect: 'manual' });
  assert.equal(start.status, 302);
  const authUrl = start.headers.get('location');
  assert.ok(authUrl.startsWith(`${issuerUrl}/authorize`));
  const authorize = await fetch(authUrl, { redirect: 'manual' });
  const callbackUrl = authorize.headers.get('location');
  const cb = await fetch(callbackUrl, { redirect: 'manual' });
  return { cb, authUrl };
};

test('успешный вход: сессия, cookie и данные пользователя', async () => {
  const { cb, authUrl } = await login();
  const q = new URL(authUrl).searchParams;
  assert.equal(q.get('code_challenge_method'), 'S256');
  assert.equal(q.get('client_id'), CLIENT_ID);

  assert.equal(cb.status, 302);
  assert.equal(new URL(cb.headers.get('location')).origin, EDITOR);
  assert.equal(new URL(cb.headers.get('location')).searchParams.get('login'), 'ok');
  const cookie = cb.headers.get('set-cookie');
  assert.match(cookie, /vf_sid=/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);

  const me = await fetch(`${bridgeUrl}/auth/me`, {
    headers: { cookie: cookie.split(';')[0], origin: EDITOR },
  });
  const body = await me.json();
  assert.equal(body.user.name, 'Николай');
  assert.equal(body.user.quorvox_id, 'QV-12345678');
  assert.equal(body.user.email_verified, true);
  assert.equal(me.headers.get('access-control-allow-origin'), EDITOR);
  assert.equal(me.headers.get('access-control-allow-credentials'), 'true');
});

test('без cookie пользователя нет', async () => {
  const me = await fetch(`${bridgeUrl}/auth/me`);
  assert.deepEqual(await me.json(), { user: null });
});

test('подделанная cookie не принимается', async () => {
  const { cb } = await login();
  const good = cb.headers.get('set-cookie').split(';')[0];
  const forged = good.replace(/\.[^.]*$/, '.AAAA');
  const me = await fetch(`${bridgeUrl}/auth/me`, { headers: { cookie: forged } });
  assert.deepEqual(await me.json(), { user: null });
});

test('чужой Origin не получает CORS-разрешения', async () => {
  const me = await fetch(`${bridgeUrl}/auth/me`, { headers: { origin: 'https://evil.example' } });
  assert.equal(me.headers.get('access-control-allow-origin'), null);
});

test('неверный state отклоняется', async () => {
  const cb = await fetch(`${bridgeUrl}/auth/quorvox/callback?code=x&state=nope`, { redirect: 'manual' });
  assert.equal(cb.status, 302);
  assert.ok(new URL(cb.headers.get('location')).searchParams.get('login_error'));
  assert.equal(cb.headers.get('set-cookie'), null);
});

test('state одноразовый', async () => {
  const start = await fetch(`${bridgeUrl}/auth/quorvox`, { redirect: 'manual' });
  const authorize = await fetch(start.headers.get('location'), { redirect: 'manual' });
  const callbackUrl = authorize.headers.get('location');
  const first = await fetch(callbackUrl, { redirect: 'manual' });
  assert.equal(new URL(first.headers.get('location')).searchParams.get('login'), 'ok');
  const second = await fetch(callbackUrl, { redirect: 'manual' });
  assert.ok(new URL(second.headers.get('location')).searchParams.get('login_error'));
});

test('токен для другого приложения отклоняется', async () => {
  claimsForNextToken = { aud: 'other-client' };
  try {
    const { cb } = await login();
    assert.ok(new URL(cb.headers.get('location')).searchParams.get('login_error'));
    assert.equal(cb.headers.get('set-cookie'), null);
  } finally {
    claimsForNextToken = {};
  }
});

test('просроченный токен отклоняется', async () => {
  claimsForNextToken = { exp: Math.floor(Date.now() / 1000) - 3600 };
  try {
    const { cb } = await login();
    assert.ok(new URL(cb.headers.get('location')).searchParams.get('login_error'));
  } finally {
    claimsForNextToken = {};
  }
});

test('токен с чужой подписью отклоняется', async () => {
  const other = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' }).privateKey;
  const realSign = privateKey;
  privateKey = other; // подпишем ключом, которого нет в JWKS
  try {
    const { cb } = await login();
    assert.ok(new URL(cb.headers.get('location')).searchParams.get('login_error'));
  } finally {
    privateKey = realSign;
  }
});

test('выход очищает сессию', async () => {
  const { cb } = await login();
  const cookie = cb.headers.get('set-cookie').split(';')[0];
  const out = await fetch(`${bridgeUrl}/auth/logout`, { method: 'POST', headers: { cookie } });
  assert.equal((await out.json()).ok, true);
  const me = await fetch(`${bridgeUrl}/auth/me`, { headers: { cookie } });
  assert.deepEqual(await me.json(), { user: null });
});
