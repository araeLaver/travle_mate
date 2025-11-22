# SNS OAuth 설정 가이드

이 가이드는 TravelMate 웹 애플리케이션에서 실제 SNS OAuth 로그인을 설정하는 방법을 안내합니다.

## 1. Google OAuth 설정

### 1.1 Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" > "OAuth 동의 화면" 이동
4. 사용자 유형을 "외부" 선택 (개인 개발자용)
5. 앱 정보 입력:
   - 앱 이름: TravelMate
   - 사용자 지원 이메일: 본인 이메일
   - 앱 도메인: http://localhost:3005
   - 개발자 연락처 정보: 본인 이메일

### 1.2 OAuth 2.0 클라이언트 ID 생성

1. "API 및 서비스" > "사용자 인증 정보" 이동
2. "사용자 인증 정보 만들기" > "OAuth 2.0 클라이언트 ID" 선택
3. 애플리케이션 유형: "웹 애플리케이션"
4. 이름: "TravelMate Web Client"
5. 승인된 자바스크립트 원본:
   - http://localhost:3005
   - http://localhost:3000 (개발용)
6. 승인된 리디렉션 URI:
   - http://localhost:3005/auth/callback
   - http://localhost:3000/auth/callback (개발용)

### 1.3 환경 변수 설정

생성된 클라이언트 ID를 `.env.local` 파일에 추가:
```
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
```

## 2. Kakao OAuth 설정

### 2.1 Kakao Developers 설정

1. [Kakao Developers](https://developers.kakao.com/)에 접속 후 로그인
2. "내 애플리케이션" > "애플리케이션 추가하기"
3. 앱 정보 입력:
   - 앱 이름: TravelMate
   - 사업자명: 개인

### 2.2 플랫폼 설정

1. 생성된 앱 선택 > "플랫폼" 설정
2. "Web 플랫폼 등록"
3. 사이트 도메인: http://localhost:3005

### 2.3 Kakao Login 설정

1. "제품 설정" > "카카오 로그인" 활성화
2. "Redirect URI" 설정:
   - http://localhost:3005/auth/callback
   - http://localhost:3000/auth/callback (개발용)
3. "동의항목" 설정:
   - 프로필 정보 (닉네임, 프로필 사진): 선택 동의
   - 카카오계정 (이메일): 선택 동의

### 2.4 환경 변수 설정

앱 키 중 "JavaScript 키"를 `.env.local` 파일에 추가:
```
REACT_APP_KAKAO_CLIENT_ID=your_kakao_javascript_key_here
```

## 3. Naver OAuth 설정

### 3.1 Naver Developers 설정

1. [Naver Developers](https://developers.naver.com/)에 접속 후 로그인
2. "Application" > "애플리케이션 등록"
3. 애플리케이션 정보 입력:
   - 애플리케이션 이름: TravelMate
   - 사용 API: 네아로 (네이버 아이디로 로그인)

### 3.2 서비스 URL 설정

1. 서비스 URL: http://localhost:3005
2. Callback URL: http://localhost:3005/auth/callback

### 3.3 제공 정보 설정

다음 정보 제공 설정:
- 회원이름
- 이메일 주소
- 프로필 사진

### 3.4 환경 변수 설정

Client ID와 Client Secret를 `.env.local` 파일에 추가:
```
REACT_APP_NAVER_CLIENT_ID=your_naver_client_id_here
REACT_APP_NAVER_CLIENT_SECRET=your_naver_client_secret_here
```

## 4. 최종 환경 변수 파일

`.env.local` 파일의 최종 형태:
```
# OAuth Configuration
# Google OAuth
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com

# Kakao OAuth  
REACT_APP_KAKAO_CLIENT_ID=your_kakao_javascript_key_here

# Naver OAuth
REACT_APP_NAVER_CLIENT_ID=your_naver_client_id_here
REACT_APP_NAVER_CLIENT_SECRET=your_naver_client_secret_here

# Development URLs
REACT_APP_REDIRECT_URI=http://localhost:3005/auth/callback
```

## 5. 테스트 방법

1. 환경 변수 설정 완료 후 개발 서버 재시작:
   ```bash
   npm start
   ```

2. http://localhost:3005/login 또는 http://localhost:3005/register 접속

3. 각 SNS 로그인 버튼 테스트:
   - Google: 구글 계정 선택 팝업 표시
   - Kakao: 카카오 로그인 창 표시
   - Naver: 네이버 로그인 창 표시

## 6. 주의사항

1. **개발 환경 전용**: 현재 설정은 localhost 개발 환경용입니다.
2. **프로덕션 배포 시**: 실제 도메인으로 모든 URL을 업데이트해야 합니다.
3. **보안**: Client Secret은 백엔드에서만 사용해야 합니다.
4. **HTTPS**: 프로덕션 환경에서는 HTTPS 필수입니다.

## 7. 문제 해결

### 일반적인 오류들:

1. **"redirect_uri_mismatch"**: 각 플랫폼의 콘솔에서 Redirect URI 설정 확인
2. **"invalid_client"**: Client ID 확인
3. **CORS 오류**: 각 플랫폼에서 JavaScript 원본 도메인 설정 확인
4. **팝업 차단**: 브라우저의 팝업 차단 해제

### 디버깅:

브라우저 개발자 도구의 Console 탭에서 OAuth 관련 로그를 확인할 수 있습니다.