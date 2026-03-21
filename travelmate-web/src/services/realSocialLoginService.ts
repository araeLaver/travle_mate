import { GoogleUser, KakaoUser } from '../types';

export interface SocialUserInfo {
  id: string;
  email: string;
  name: string;
  profileImage?: string;
  provider: 'google' | 'kakao' | 'naver';
}

export interface SocialLoginResponse {
  success: boolean;
  user?: SocialUserInfo;
  error?: string;
}

interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

// Google OAuth SDK 타입
interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  prompt: (callback: (notification: GoogleNotification) => void) => void;
  disableAutoSelect: () => void;
}

interface GoogleNotification {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
}

// Kakao SDK 타입
interface KakaoAuth {
  login: (config: {
    success: (response: KakaoAuthResponse) => void;
    fail: (error: KakaoError) => void;
  }) => void;
  logout: () => void;
}

interface KakaoAuthResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

interface KakaoError {
  error: string;
  error_description: string;
}

interface KakaoAPI {
  request: (config: {
    url: string;
    success: (response: KakaoUser) => void;
    fail: (error: KakaoError) => void;
  }) => void;
}

interface KakaoSDK {
  isInitialized: () => boolean;
  init: (key: string) => void;
  Auth: KakaoAuth;
  API: KakaoAPI;
}

// Naver SDK 타입
interface NaverLoginInstance {
  init: () => void;
  login: () => void;
  getLoginStatus: (callback: (status: boolean) => void) => void;
  user: {
    id: string;
    email: string;
    nickname?: string;
    name?: string;
    profile_image?: string;
  };
}

interface NaverLoginWithNaverId {
  new (config: {
    clientId: string;
    callbackUrl?: string;
    isPopup?: boolean;
    loginButton?: {
      color: string;
      type: number;
      height: number;
    };
    callbackHandle?: boolean;
  }): NaverLoginInstance;
}

interface NaverSDK {
  LoginWithNaverId: NaverLoginWithNaverId;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
    Kakao?: KakaoSDK;
    naver?: NaverSDK;
  }
}

// 개발 환경에서만 로그 출력
const isDev = process.env.NODE_ENV === 'development';
const logger = {
  // eslint-disable-next-line no-console
  log: (...args: unknown[]): void => {
    // eslint-disable-next-line no-console
    if (isDev) console.log(...args);
  },
  // eslint-disable-next-line no-console
  error: (...args: unknown[]): void => {
    // eslint-disable-next-line no-console
    if (isDev) console.error(...args);
  },
};

// JWT 페이로드 타입 (Google 토큰)
interface GoogleJWTPayload extends GoogleUser {
  iss: string;
  azp: string;
  aud: string;
  iat: number;
  exp: number;
}

class RealSocialLoginService {
  private currentUserId: string;

  constructor() {
    this.currentUserId = localStorage.getItem('tempUserId') || this.generateUserId();
    localStorage.setItem('tempUserId', this.currentUserId);
  }

  private generateUserId(): string {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }

  // 실제 구글 OAuth 로그인
  async loginWithGoogle(): Promise<SocialLoginResponse> {
    logger.log('🔵 구글 로그인 시도...');

    return new Promise(resolve => {
      try {
        // Google OAuth 라이브러리 로드 확인
        if (!window.google) {
          this.loadGoogleScript()
            .then(() => {
              this.initializeGoogleAuth(resolve);
            })
            .catch(error => {
              logger.error('Google 스크립트 로드 실패:', error);
              resolve({
                success: false,
                error: 'Google 로그인 서비스를 로드할 수 없습니다.',
              });
            });
        } else {
          this.initializeGoogleAuth(resolve);
        }
      } catch (error) {
        logger.error('Google 로그인 에러:', error);
        resolve({
          success: false,
          error: 'Google 로그인 중 오류가 발생했습니다.',
        });
      }
    });
  }

  private loadGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.getElementById('google-script')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Google 스크립트 로드 실패'));
      document.head.appendChild(script);
    });
  }

  private initializeGoogleAuth(resolve: (value: SocialLoginResponse) => void): void {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    if (!clientId) {
      logger.error('Google Client ID가 설정되지 않았습니다.');
      resolve({
        success: false,
        error: 'Google 클라이언트 ID가 설정되지 않았습니다. 환경 변수를 확인해주세요.',
      });
      return;
    }

    if (!window.google) {
      resolve({
        success: false,
        error: 'Google SDK가 로드되지 않았습니다.',
      });
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: GoogleCredentialResponse) => {
        this.handleGoogleCallback(response, resolve);
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    // 로그인 프롬프트 표시
    window.google.accounts.id.prompt((notification: GoogleNotification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        logger.log('Google 로그인 프롬프트가 표시되지 않음');
        resolve({
          success: false,
          error: '로그인 프롬프트를 표시할 수 없습니다.',
        });
      }
    });
  }

  private handleGoogleCallback(
    response: GoogleCredentialResponse,
    resolve: (value: SocialLoginResponse) => void
  ): void {
    try {
      // JWT 토큰 파싱
      const payload = this.parseJWT(response.credential);

      const user: SocialUserInfo = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        profileImage: payload.picture,
        provider: 'google',
      };

      this.saveSocialUser(user);
      logger.log('✅ 구글 로그인 성공:', user);

      resolve({
        success: true,
        user: user,
      });
    } catch (error) {
      logger.error('Google 토큰 파싱 오류:', error);
      resolve({
        success: false,
        error: '로그인 정보를 처리하는 중 오류가 발생했습니다.',
      });
    }
  }

  private parseJWT(token: string): GoogleJWTPayload {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
      return JSON.parse(jsonPayload) as GoogleJWTPayload;
    } catch {
      throw new Error('JWT 파싱 실패');
    }
  }

  // 실제 카카오 OAuth 로그인
  async loginWithKakao(): Promise<SocialLoginResponse> {
    logger.log('🟡 카카오 로그인 시도...');

    return new Promise(resolve => {
      try {
        if (!window.Kakao) {
          this.loadKakaoScript()
            .then(() => {
              this.initializeKakaoAuth(resolve);
            })
            .catch(error => {
              logger.error('Kakao 스크립트 로드 실패:', error);
              resolve({
                success: false,
                error: 'Kakao 로그인 서비스를 로드할 수 없습니다.',
              });
            });
        } else {
          this.initializeKakaoAuth(resolve);
        }
      } catch (error) {
        logger.error('Kakao 로그인 에러:', error);
        resolve({
          success: false,
          error: 'Kakao 로그인 중 오류가 발생했습니다.',
        });
      }
    });
  }

  private loadKakaoScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.getElementById('kakao-script')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = 'kakao-script';
      script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
      script.integrity = 'sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2vxfAAD0eZxzCKakxg55G4';
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Kakao 스크립트 로드 실패'));
      document.head.appendChild(script);
    });
  }

  private initializeKakaoAuth(resolve: (value: SocialLoginResponse) => void): void {
    const clientId = process.env.REACT_APP_KAKAO_CLIENT_ID;

    if (!clientId) {
      logger.error('Kakao Client ID가 설정되지 않았습니다.');
      resolve({
        success: false,
        error: 'Kakao 클라이언트 ID가 설정되지 않았습니다. 환경 변수를 확인해주세요.',
      });
      return;
    }

    if (!window.Kakao) {
      resolve({
        success: false,
        error: 'Kakao SDK가 로드되지 않았습니다.',
      });
      return;
    }

    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(clientId);
    }

    window.Kakao.Auth.login({
      success: (response: KakaoAuthResponse) => {
        logger.log('Kakao 로그인 토큰:', response);
        this.getKakaoUserInfo(resolve);
      },
      fail: (error: KakaoError) => {
        logger.error('Kakao 로그인 실패:', error);
        resolve({
          success: false,
          error: 'Kakao 로그인에 실패했습니다.',
        });
      },
    });
  }

  private getKakaoUserInfo(resolve: (value: SocialLoginResponse) => void): void {
    window.Kakao!.API.request({
      url: '/v2/user/me',
      success: (response: KakaoUser) => {
        logger.log('Kakao 사용자 정보:', response);

        const user: SocialUserInfo = {
          id: response.id.toString(),
          email: response.kakao_account?.email || '',
          name: response.kakao_account?.profile?.nickname || '카카오사용자',
          profileImage: response.kakao_account?.profile?.profile_image_url,
          provider: 'kakao',
        };

        this.saveSocialUser(user);
        logger.log('✅ 카카오 로그인 성공:', user);

        resolve({
          success: true,
          user: user,
        });
      },
      fail: (error: KakaoError) => {
        logger.error('Kakao 사용자 정보 가져오기 실패:', error);
        resolve({
          success: false,
          error: '사용자 정보를 가져오는 중 오류가 발생했습니다.',
        });
      },
    });
  }

  // 실제 네이버 OAuth 로그인
  async loginWithNaver(): Promise<SocialLoginResponse> {
    logger.log('🟢 네이버 로그인 시도...');

    return new Promise(resolve => {
      try {
        if (!window.naver) {
          this.loadNaverScript()
            .then(() => {
              this.initializeNaverAuth(resolve);
            })
            .catch(error => {
              logger.error('Naver 스크립트 로드 실패:', error);
              resolve({
                success: false,
                error: 'Naver 로그인 서비스를 로드할 수 없습니다.',
              });
            });
        } else {
          this.initializeNaverAuth(resolve);
        }
      } catch (error) {
        logger.error('Naver 로그인 에러:', error);
        resolve({
          success: false,
          error: 'Naver 로그인 중 오류가 발생했습니다.',
        });
      }
    });
  }

  private loadNaverScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.getElementById('naver-script')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = 'naver-script';
      script.src = 'https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.2.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Naver 스크립트 로드 실패'));
      document.head.appendChild(script);
    });
  }

  private initializeNaverAuth(resolve: (value: SocialLoginResponse) => void): void {
    const clientId = process.env.REACT_APP_NAVER_CLIENT_ID;
    const callbackUrl = process.env.REACT_APP_REDIRECT_URI;

    if (!clientId) {
      logger.error('Naver Client ID가 설정되지 않았습니다.');
      resolve({
        success: false,
        error: 'Naver 클라이언트 ID가 설정되지 않았습니다. 환경 변수를 확인해주세요.',
      });
      return;
    }

    if (!window.naver) {
      resolve({
        success: false,
        error: 'Naver SDK가 로드되지 않았습니다.',
      });
      return;
    }

    const naverLogin = new window.naver.LoginWithNaverId({
      clientId: clientId,
      callbackUrl: callbackUrl,
      isPopup: true,
      loginButton: { color: 'green', type: 3, height: 60 },
      callbackHandle: true,
    });

    naverLogin.init();

    naverLogin.getLoginStatus((status: boolean) => {
      if (status) {
        const user: SocialUserInfo = {
          id: naverLogin.user.id,
          email: naverLogin.user.email,
          name: naverLogin.user.nickname || naverLogin.user.name || '네이버사용자',
          profileImage: naverLogin.user.profile_image,
          provider: 'naver',
        };

        this.saveSocialUser(user);
        logger.log('✅ 네이버 로그인 성공:', user);

        resolve({
          success: true,
          user: user,
        });
      } else {
        // 로그인 팝업 열기
        naverLogin.login();
        resolve({
          success: false,
          error: '네이버 로그인 창이 열렸습니다. 로그인을 완료해주세요.',
        });
      }
    });
  }

  // 소셜 사용자 정보 저장
  private saveSocialUser(user: SocialUserInfo): void {
    localStorage.setItem('socialUser', JSON.stringify(user));
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('loginProvider', user.provider);
  }

  // 저장된 소셜 사용자 정보 가져오기
  getCurrentSocialUser(): SocialUserInfo | null {
    const userData = localStorage.getItem('socialUser');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        logger.error('Failed to parse social user data:', error);
        return null;
      }
    }
    return null;
  }

  // 로그인 상태 확인
  isLoggedIn(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }

  // 로그아웃
  logout(): void {
    localStorage.removeItem('socialUser');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('loginProvider');

    // 각 플랫폼별 로그아웃 처리
    const provider = this.getLoginProvider();

    if (provider === 'kakao' && window.Kakao?.Auth) {
      window.Kakao.Auth.logout();
    }

    if (provider === 'google' && window.google?.accounts) {
      window.google.accounts.id.disableAutoSelect();
    }

    logger.log('✅ 로그아웃 완료');
  }

  // 현재 로그인 제공자
  getLoginProvider(): string | null {
    return localStorage.getItem('loginProvider');
  }
}

export const realSocialLoginService = new RealSocialLoginService();
