interface KakaoAuth {
  login: (options: {
    success: (authObj: { access_token: string; token_type: string; expires_in: number }) => void;
    fail: (err: Error) => void;
  }) => void;
  logout: (callback?: () => void) => void;
  getAccessToken: () => string | null;
}

interface Kakao {
  init: (appKey: string) => void;
  isInitialized: () => boolean;
  Auth: KakaoAuth;
}

interface Window {
  Kakao: Kakao;
}
