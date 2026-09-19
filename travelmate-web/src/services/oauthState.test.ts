import {
  consumeOAuthState,
  createOAuthState,
  isOAuthCodeProvider,
  isOAuthProvider,
} from './oauthState';

describe('oauthState', () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.restoreAllMocks();
  });

  it('creates a one-time state value bound to the provider', () => {
    const state = createOAuthState('naver');

    expect(state).toMatch(/^naver\./);
    expect(consumeOAuthState(state)).toBe('naver');
    expect(consumeOAuthState(state)).toBeNull();
  });

  it('rejects missing, malformed, and expired state values', () => {
    expect(consumeOAuthState(null)).toBeNull();
    expect(consumeOAuthState('naver.missing')).toBeNull();

    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000);
    const state = createOAuthState('kakao');
    nowSpy.mockReturnValue(1_000 + 10 * 60 * 1000 + 1);

    expect(consumeOAuthState(state)).toBeNull();
  });

  it('validates supported OAuth providers and code-flow providers', () => {
    expect(isOAuthProvider('google')).toBe(true);
    expect(isOAuthProvider('github')).toBe(false);
    expect(isOAuthCodeProvider('kakao')).toBe(true);
    expect(isOAuthCodeProvider('naver')).toBe(true);
    expect(isOAuthCodeProvider('google')).toBe(false);
  });
});
