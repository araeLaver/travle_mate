export type OAuthProvider = 'google' | 'kakao' | 'naver';
export type OAuthCodeProvider = 'kakao' | 'naver';

const OAUTH_STATE_KEY_PREFIX = 'tm_oauth_state:';
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const OAUTH_STATE_NONCE_BYTES = 16;

interface StoredOAuthState {
  provider: OAuthProvider;
  createdAt: number;
}

export const isOAuthProvider = (value: string | null): value is OAuthProvider =>
  value === 'google' || value === 'kakao' || value === 'naver';

export const isOAuthCodeProvider = (value: OAuthProvider): value is OAuthCodeProvider =>
  value === 'kakao' || value === 'naver';

const storageKey = (state: string): string => `${OAUTH_STATE_KEY_PREFIX}${state}`;

const createNonce = (): string => {
  if (window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(OAUTH_STATE_NONCE_BYTES);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
};

export const createOAuthState = (provider: OAuthProvider): string => {
  const state = `${provider}.${createNonce()}`;
  const payload: StoredOAuthState = {
    provider,
    createdAt: Date.now(),
  };

  sessionStorage.setItem(storageKey(state), JSON.stringify(payload));
  return state;
};

export const consumeOAuthState = (state: string | null): OAuthProvider | null => {
  if (!state) {
    return null;
  }

  let stored: string | null;
  try {
    const key = storageKey(state);
    stored = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
  } catch {
    return null;
  }

  if (!stored) {
    return null;
  }

  try {
    const payload = JSON.parse(stored) as Partial<StoredOAuthState>;

    if (!isOAuthProvider(payload.provider ?? null) || typeof payload.createdAt !== 'number') {
      return null;
    }

    if (Date.now() - payload.createdAt > OAUTH_STATE_TTL_MS) {
      return null;
    }

    return payload.provider ?? null;
  } catch {
    return null;
  }
};
