// 위치 서비스 디버깅을 위한 헬퍼
export class LocationDebugger {
  static async checkLocationPermission(): Promise<void> {
    console.log('🔍 위치 권한 상태 확인...');
    
    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        console.log('📍 위치 권한 상태:', permission.state);
        
        permission.addEventListener('change', () => {
          console.log('🔄 위치 권한 변경됨:', permission.state);
        });
      }
    } catch (error) {
      console.log('❌ 권한 확인 실패:', error);
    }
  }

  static checkGeolocationSupport(): boolean {
    const supported = 'geolocation' in navigator;
    console.log('🌍 지오로케이션 지원:', supported);
    return supported;
  }

  static checkHTTPS(): boolean {
    const isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    console.log('🔒 HTTPS/Localhost:', isHTTPS);
    return isHTTPS;
  }

  static async testLocationAccess(): Promise<void> {
    console.log('🧪 위치 접근 테스트 시작...');

    if (!this.checkGeolocationSupport()) {
      console.log('❌ 브라우저가 위치 서비스를 지원하지 않습니다.');
      return;
    }

    if (!this.checkHTTPS()) {
      console.log('⚠️ HTTPS가 아니거나 localhost가 아닙니다. 위치 서비스가 제한될 수 있습니다.');
    }

    await this.checkLocationPermission();

    return new Promise<void>((resolveLocationTest) => {
      console.log('📍 위치 정보 요청 중...');

      const timeoutId = setTimeout(() => {
        console.log('⏰ 위치 요청 타임아웃 (10초)');
        resolveLocationTest();
      }, 10000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          console.log('✅ 위치 정보 성공:', {
            위도: position.coords.latitude,
            경도: position.coords.longitude,
            정확도: position.coords.accuracy + 'm',
            시간: new Date(position.timestamp).toLocaleString('ko-KR')
          });
          resolveLocationTest();
        },
        (error) => {
          clearTimeout(timeoutId);
          console.log('❌ 위치 정보 실패:');
          console.log('- 에러 코드:', error.code);
          console.log('- 에러 메시지:', error.message);

          switch (error.code) {
            case 1:
              console.log('🚫 사용자가 위치 접근을 거부했습니다.');
              console.log('💡 해결 방법: 브라우저 주소창 왼쪽의 위치 아이콘을 클릭하여 권한을 허용하세요.');
              break;
            case 2:
              console.log('🌐 위치 정보를 사용할 수 없습니다.');
              console.log('💡 해결 방법: GPS나 네트워크 연결을 확인하세요.');
              break;
            case 3:
              console.log('⏰ 위치 정보 요청이 시간 초과되었습니다.');
              console.log('💡 해결 방법: 네트워크 연결을 확인하고 다시 시도하세요.');
              break;
          }
          resolveLocationTest();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }
}

// 페이지 로드 시 자동으로 디버깅 정보 표시
export const initLocationDebugging = () => {
  console.log('🔧 위치 서비스 디버깅 시작...');
  LocationDebugger.testLocationAccess();
};