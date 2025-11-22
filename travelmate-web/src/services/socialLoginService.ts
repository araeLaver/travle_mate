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

declare global {
  interface Window {
    google: any;
    Kakao: any;
    naver: any;
  }
}

class SocialLoginService {
  private currentUserId: string;

  constructor() {
    this.currentUserId = localStorage.getItem('tempUserId') || this.generateUserId();
    localStorage.setItem('tempUserId', this.currentUserId);
  }

  private generateUserId(): string {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }

  // 구글 로그인 시뮬레이션
  async loginWithGoogle(): Promise<SocialLoginResponse> {
    console.log('🔵 구글 로그인 시도...');
    
    return new Promise((resolve) => {
      // 실제 구글 OAuth 플로우 시뮬레이션
      const confirmLogin = window.confirm(
        '구글 로그인을 진행하시겠습니까?\n\n실제 서비스에서는 구글 계정으로 안전하게 로그인됩니다.'
      );

      setTimeout(() => {
        if (confirmLogin) {
          const mockUser: SocialUserInfo = {
            id: 'google_' + Math.random().toString(36).substr(2, 9),
            email: 'user@gmail.com',
            name: '구글사용자',
            profileImage: 'https://picsum.photos/100/100?random=google',
            provider: 'google'
          };

          this.saveSocialUser(mockUser);
          console.log('✅ 구글 로그인 성공:', mockUser);
          
          resolve({
            success: true,
            user: mockUser
          });
        } else {
          console.log('❌ 구글 로그인 취소됨');
          resolve({
            success: false,
            error: '사용자가 로그인을 취소했습니다.'
          });
        }
      }, 1500);
    });
  }

  // 카카오 로그인 시뮬레이션
  async loginWithKakao(): Promise<SocialLoginResponse> {
    console.log('🟡 카카오 로그인 시도...');
    
    return new Promise((resolve) => {
      const confirmLogin = window.confirm(
        '카카오 로그인을 진행하시겠습니까?\n\n실제 서비스에서는 카카오 계정으로 안전하게 로그인됩니다.'
      );

      setTimeout(() => {
        if (confirmLogin) {
          const mockUser: SocialUserInfo = {
            id: 'kakao_' + Math.random().toString(36).substr(2, 9),
            email: 'user@kakao.com',
            name: '카카오사용자',
            profileImage: 'https://picsum.photos/100/100?random=kakao',
            provider: 'kakao'
          };

          this.saveSocialUser(mockUser);
          console.log('✅ 카카오 로그인 성공:', mockUser);
          
          resolve({
            success: true,
            user: mockUser
          });
        } else {
          console.log('❌ 카카오 로그인 취소됨');
          resolve({
            success: false,
            error: '사용자가 로그인을 취소했습니다.'
          });
        }
      }, 1200);
    });
  }

  // 네이버 로그인 시뮬레이션
  async loginWithNaver(): Promise<SocialLoginResponse> {
    console.log('🟢 네이버 로그인 시도...');
    
    return new Promise((resolve) => {
      const confirmLogin = window.confirm(
        '네이버 로그인을 진행하시겠습니까?\n\n실제 서비스에서는 네이버 계정으로 안전하게 로그인됩니다.'
      );

      setTimeout(() => {
        if (confirmLogin) {
          const mockUser: SocialUserInfo = {
            id: 'naver_' + Math.random().toString(36).substr(2, 9),
            email: 'user@naver.com',
            name: '네이버사용자',
            profileImage: 'https://picsum.photos/100/100?random=naver',
            provider: 'naver'
          };

          this.saveSocialUser(mockUser);
          console.log('✅ 네이버 로그인 성공:', mockUser);
          
          resolve({
            success: true,
            user: mockUser
          });
        } else {
          console.log('❌ 네이버 로그인 취소됨');
          resolve({
            success: false,
            error: '사용자가 로그인을 취소했습니다.'
          });
        }
      }, 1000);
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
        console.error('Failed to parse social user data:', error);
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
    console.log('✅ 로그아웃 완료');
  }

  // 현재 로그인 제공자
  getLoginProvider(): string | null {
    return localStorage.getItem('loginProvider');
  }
}

export const socialLoginService = new SocialLoginService();