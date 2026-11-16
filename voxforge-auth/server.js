// VoxForge Auth: мостик между редактором и Quorvox ID.
// Редактор — браузерное приложение и не может хранить client_secret, поэтому
// вход идёт через этот маленький сервер: он ведёт OIDC (code + PKCE), проверяет
// id_token и выдаёт редактору сессию в HttpOnly-cookie.
//
//   GET  /auth/quorvox            начать вход (редирект на id.quorvox.ru)
//   GET  /auth/quorvox/callback   вернуться, проверить, создать сессию
//   GET  /auth/me                 кто вошёл ({ user } или { user: null })
//   POST /auth/logout             выйти
//
// Без зависимостей: только встроенные модули Node 20+.
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

// .env читаем сами (без dotenv); переменные окружения главнее файла.
const loadDotEnv = () => {
  const file = path.join(here, '.env');
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#')) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
};

export const loadConfig = (overrides = {}) => {
  const env = { ...loadDotEnv(), ...process.env, ...overrides };
  const publicUrl = (env.PUBLIC_URL || 'http://localhost:3050').replace(/\/$/, '');
  const editorUrl = (env.EDITOR_URL || 'http://localhost:3000').replace(/\/$/, '');
  return {
    issuer: (env.QUORVOX_ISSUER || 'https://id.quorvox.ru').replace(/\/$/, ''),
    clientId: env.QUORVOX_CLIENT_ID || '',
    clientSecret: env.QUORVOX_CLIENT_SECRET || '',
    port: Number(env.PORT || 3050),
    publicUrl,
    editorUrl,
    redirectUri: `${publicUrl}/auth/quorvox/callback`,
    // Без SESSION_SECRET сессии живут до перезапуска (для разработки это нормально).
    sessionSecret: env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    secureCookie: publicUrl.startsWith('https://'),
  };
};

const b64url = buf => Buffer.from(buf).toString('base64url');
const SESSION_TTL_MS = 14 * 24 * 3600 * 1000;
const LOGIN_TTL_MS = 10 * 60 * 1000;

export const createApp = (config) => {
  const sessions = new Map(); // sid -> { user, exp }
  const logins = new Map(); // state -> { nonce, verifier, t }
  let discoveryCache = null;
  let jwksCache = null;

  const discover = async () => {
    if (discoveryCache && Date.now() - discoveryCache.t < 3600_000) return discoveryCache.meta;
    const r = await fetch(`${config.issuer}/.well-known/openid-configuration`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error('Quorvox ID недоступен');
    discoveryCache = { meta: await r.json(), t: Date.now() };
    return discoveryCache.meta;
  };

  const getJwks = async meta => {
    if (jwksCache && Date.now() - jwksCache.t < 5 * 60_000) return jwksCache.jwks;
    const r = await fetch(meta.jwks_uri, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error('Не удалось получить ключи Quorvox ID');
    jwksCache = { jwks: await r.json(), t: Date.now() };
    return jwksCache.jwks;
  };

  // ---- проверка id_token (ES256 / RS256) ----
  const verifyIdToken = async (token, meta, nonce) => {
    const parts = String(token || '').split('.');
    if (parts.length !== 3) throw new Error('Некорректный id_token');
    const [h, p, s] = parts;
    const header = JSON.parse(Buffer.from(h, 'base64url').toString());
    const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
    const jwks = await getJwks(meta);
    const jwk = jwks.keys.find(k => (!header.kid || k.kid === header.kid) && k.kty);
    if (!jwk) throw new Error('Ключ подписи не найден');
    const key = crypto.createPublicKey({ key: jwk, format: 'jwk' });
    const data = Buffer.from(`${h}.${p}`);
    const sig = Buffer.from(s, 'base64url');
    let ok = false;
    if (header.alg === 'ES256') ok = crypto.verify('sha256', data, { key, dsaEncoding: 'ieee-p1363' }, sig);
    else if (header.alg === 'RS256') ok = crypto.verify('sha256', data, key, sig);
    else throw new Error('Неподдерживаемый алгоритм подписи');
    if (!ok) throw new Error('Подпись id_token неверна');
    const now = Math.floor(Date.now() / 1000);
    if (payload.iss !== meta.issuer) throw new Error('Неверный издатель');
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(config.clientId)) throw new Error('Токен выдан для другого приложения');
    if (!payload.exp || payload.exp < now - 30) throw new Error('Токен просрочен');
    if (payload.nonce !== nonce) throw new Error('Неверный nonce');
    return payload;
  };

  // ---- сессии в cookie ----
  const sign = value => b64url(crypto.createHmac('sha256', config.sessionSecret).update(value).digest());
  const cookieValue = sid => `${sid}.${sign(sid)}`;
  const readSid = req => {
    const header = req.headers.cookie || '';
    const m = header.match(/(?:^|;\s*)vf_sid=([^;]+)/);
    if (!m) return null;
    const [sid, mac] = decodeURIComponent(m[1]).split('.');
    if (!sid || !mac) return null;
    const expected = sign(sid);
    const a = Buffer.from(mac);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    return sid;
  };
  const getUser = req => {
    const sid = readSid(req);
    const session = sid && sessions.get(sid);
    if (!session) return null;
    if (session.exp < Date.now()) {
      sessions.delete(sid);
      return null;
    }
    return session.user;
  };
  const setCookie = (res, value, maxAgeSec) => {
    const attrs = [
      `vf_sid=${encodeURIComponent(value)}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      `Max-Age=${maxAgeSec}`,
    ];
    if (config.secureCookie) attrs.push('Secure');
    res.setHeader('Set-Cookie', attrs.join('; '));
  };

  // ---- CORS: только для редактора, с cookie ----
  const applyCors = (req, res) => {
    if (req.headers.origin === config.editorUrl) {
      res.setHeader('Access-Control-Allow-Origin', config.editorUrl);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Vary', 'Origin');
    }
  };
  const json = (res, status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(body));
  };
  const redirect = (res, location) => {
    res.writeHead(302, { Location: location, 'Cache-Control': 'no-store' });
    res.end();
  };
  const backToEditor = (res, params) => {
    const u = new URL(config.editorUrl + '/');
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    redirect(res, u.toString());
  };

  const cleanup = () => {
    const now = Date.now();
    for (const [k, v] of logins) if (now - v.t > LOGIN_TTL_MS) logins.delete(k);
    for (const [k, v] of sessions) if (v.exp < now) sessions.delete(k);
  };

  const handler = async (req, res) => {
    const url = new URL(req.url, config.publicUrl);
    applyCors(req, res);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }
    cleanup();

    if (url.pathname === '/health') return json(res, 200, { ok: true, configured: !!config.clientId });

    if (url.pathname === '/auth/quorvox' && req.method === 'GET') {
      if (!config.clientId || !config.clientSecret) {
        return backToEditor(res, { login_error: 'Вход ещё не настроен: нет данных клиента Quorvox ID' });
      }
      try {
        const meta = await discover();
        const state = b64url(crypto.randomBytes(16));
        const nonce = b64url(crypto.randomBytes(16));
        const verifier = b64url(crypto.randomBytes(32));
        logins.set(state, { nonce, verifier, t: Date.now() });
        const u = new URL(meta.authorization_endpoint);
        u.search = new URLSearchParams({
          client_id: config.clientId,
          redirect_uri: config.redirectUri,
          response_type: 'code',
          scope: 'openid profile email',
          state,
          nonce,
          code_challenge: b64url(crypto.createHash('sha256').update(verifier).digest()),
          code_challenge_method: 'S256',
        }).toString();
        return redirect(res, u.toString());
      } catch (e) {
        return backToEditor(res, { login_error: e.message });
      }
    }

    if (url.pathname === '/auth/quorvox/callback' && req.method === 'GET') {
      try {
        const q = url.searchParams;
        if (q.get('error')) throw new Error(q.get('error_description') || q.get('error'));
        const state = q.get('state');
        const login = state && logins.get(state);
        logins.delete(state); // одноразово
        if (!login || Date.now() - login.t > LOGIN_TTL_MS) throw new Error('Вход устарел, начни заново');
        const code = q.get('code');
        if (!code) throw new Error('Нет кода авторизации');
        const meta = await discover();
        const r = await fetch(meta.token_endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization:
              'Basic ' +
              Buffer.from(
                `${encodeURIComponent(config.clientId)}:${encodeURIComponent(config.clientSecret)}`
              ).toString('base64'),
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: config.redirectUri,
            code_verifier: login.verifier,
          }),
          signal: AbortSignal.timeout(8000),
        });
        const tok = await r.json();
        if (!r.ok) throw new Error(tok.error_description || tok.error || 'Ошибка обмена кода');
        const claims = await verifyIdToken(tok.id_token, meta, login.nonce);
        const sid = b64url(crypto.randomBytes(24));
        sessions.set(sid, {
          exp: Date.now() + SESSION_TTL_MS,
          user: {
            sub: claims.sub,
            name: claims.name || null,
            quorvox_id: claims.quorvox_id || null,
            email: claims.email || null,
            email_verified: !!claims.email_verified,
          },
        });
        setCookie(res, cookieValue(sid), SESSION_TTL_MS / 1000);
        return backToEditor(res, { login: 'ok' });
      } catch (e) {
        return backToEditor(res, { login_error: e.message });
      }
    }

    if (url.pathname === '/auth/me' && req.method === 'GET') {
      return json(res, 200, { user: getUser(req) });
    }

    if (url.pathname === '/auth/logout' && req.method === 'POST') {
      const sid = readSid(req);
      if (sid) sessions.delete(sid);
      setCookie(res, '', 0);
      return json(res, 200, { ok: true });
    }

    return json(res, 404, { error: 'not_found' });
  };

  return http.createServer((req, res) => {
    handler(req, res).catch(e => {
      console.error(e);
      if (!res.headersSent) json(res, 500, { error: 'internal' });
    });
  });
};

// Запуск напрямую: node server.js
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const config = loadConfig();
  createApp(config).listen(config.port, '127.0.0.1', () => {
    console.log(`VoxForge Auth: http://127.0.0.1:${config.port}`);
    if (!config.clientId) console.log('Клиент Quorvox ID не задан: добавь QUORVOX_CLIENT_ID и QUORVOX_CLIENT_SECRET в .env');
  });
}
