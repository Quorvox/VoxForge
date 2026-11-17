// @flow
import * as React from 'react';

// Адрес «мостика» VoxForge Auth (папка voxforge-auth). Он держит секрет клиента
// Quorvox ID и выдаёт редактору сессию в HttpOnly-cookie.
export const AUTH_URL: string = (
  process.env.REACT_APP_VOXFORGE_AUTH_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:3050'
    : /^https?:$/.test(window.location.protocol)
    ? window.location.origin
    : 'https://voxforge.quorvox.ru')
).replace(/\/$/, '');

export type QuorvoxUser = {|
  sub: string,
  name: ?string,
  quorvox_id: ?string,
  email: ?string,
  email_verified: boolean,
|};

export type QuorvoxAuthState = {|
  status: 'loading' | 'signed-out' | 'signed-in',
  user: ?QuorvoxUser,
  // Ошибка последнего входа (приходит в адресе после возврата с id.quorvox.ru).
  loginError: ?string,
|};

let state: QuorvoxAuthState = { status: 'loading', user: null, loginError: null };
const listeners = new Set<() => void>();

const setState = (next: $Shape<QuorvoxAuthState>) => {
  state = { ...state, ...next };
  listeners.forEach(listener => listener());
};

/** Читает и убирает из адреса результат входа (?login=ok / ?login_error=...). */
const consumeLoginResultFromUrl = (): void => {
  try {
    const url = new URL(window.location.href);
    const error = url.searchParams.get('login_error');
    const ok = url.searchParams.get('login');
    if (!error && !ok) return;
    url.searchParams.delete('login_error');
    url.searchParams.delete('login');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    if (error) setState({ loginError: error });
  } catch (e) {
    // Адрес нельзя разобрать — просто не показываем результат.
  }
};

export const refreshQuorvoxUser = async (): Promise<void> => {
  try {
    const response = await fetch(`${AUTH_URL}/auth/me`, { credentials: 'include' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { user } = await response.json();
    setState(
      user
        ? { status: 'signed-in', user }
        : { status: 'signed-out', user: null }
    );
  } catch (e) {
    // Мостик не запущен или недоступен — для пользователя это «не вошёл».
    setState({ status: 'signed-out', user: null });
  }
};

export type LoginAvailability = 'ready' | 'not-configured' | 'unavailable';

export const checkLoginAvailability = async (): Promise<LoginAvailability> => {
  try {
    const response = await fetch(`${AUTH_URL}/health`, {
      signal: AbortSignal.timeout(4000),
    });
    const { configured } = await response.json();
    return configured ? 'ready' : 'not-configured';
  } catch (e) {
    return 'unavailable';
  }
};

export const startQuorvoxLogin = (): void => {
  window.location.href = `${AUTH_URL}/auth/quorvox`;
};

export const signOutFromQuorvox = async (): Promise<void> => {
  try {
    await fetch(`${AUTH_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } finally {
    setState({ status: 'signed-out', user: null });
  }
};

export const clearQuorvoxLoginError = (): void => setState({ loginError: null });

let initialized = false;

/** Подписка на состояние входа. Первый вызов запускает проверку сессии. */
export const useQuorvoxAuth = (): QuorvoxAuthState => {
  const [, forceRender] = React.useReducer(n => n + 1, 0);

  React.useEffect(() => {
    listeners.add(forceRender);
    if (!initialized) {
      initialized = true;
      consumeLoginResultFromUrl();
      refreshQuorvoxUser();
    }
    return () => {
      listeners.delete(forceRender);
    };
  }, []);

  return state;
};
