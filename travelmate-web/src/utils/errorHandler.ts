import { ApiError } from '../services/apiClient';

// 에러 유형 정의
export type ErrorType = 'network' | 'auth' | 'validation' | 'notFound' | 'server' | 'unknown';

// 에러 응답 표준화
export interface StandardError {
  type: ErrorType;
  message: string;
  userMessage: string;
  status?: number;
  details?: Record<string, string>;
}

// HTTP 상태 코드별 에러 메시지
const HTTP_ERROR_MESSAGES: Record<number, { type: ErrorType; userMessage: string }> = {
  400: { type: 'validation', userMessage: '입력 정보를 확인해주세요.' },
  401: { type: 'auth', userMessage: '로그인이 필요합니다.' },
  403: { type: 'auth', userMessage: '접근 권한이 없습니다.' },
  404: { type: 'notFound', userMessage: '요청한 정보를 찾을 수 없습니다.' },
  409: { type: 'validation', userMessage: '이미 존재하는 정보입니다.' },
  422: { type: 'validation', userMessage: '입력 형식이 올바르지 않습니다.' },
  429: { type: 'server', userMessage: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
  500: { type: 'server', userMessage: '서버 오류가 발생했습니다.' },
  502: { type: 'server', userMessage: '서버에 연결할 수 없습니다.' },
  503: { type: 'server', userMessage: '서비스가 일시적으로 중단되었습니다.' },
};

// 에러를 표준 형식으로 변환
export function parseError(error: unknown): StandardError {
  // ApiError인 경우
  if (isApiError(error)) {
    const httpError = HTTP_ERROR_MESSAGES[error.status];

    return {
      type: httpError?.type || 'unknown',
      message: error.message,
      userMessage: error.message || httpError?.userMessage || '오류가 발생했습니다.',
      status: error.status,
      details: error.errors as Record<string, string> | undefined,
    };
  }

  // Error 객체인 경우
  if (error instanceof Error) {
    // 네트워크 에러 감지
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return {
        type: 'network',
        message: error.message,
        userMessage: '네트워크 연결을 확인해주세요.',
      };
    }

    return {
      type: 'unknown',
      message: error.message,
      userMessage: error.message || '오류가 발생했습니다.',
    };
  }

  // 문자열인 경우
  if (typeof error === 'string') {
    return {
      type: 'unknown',
      message: error,
      userMessage: error,
    };
  }

  // 그 외
  return {
    type: 'unknown',
    message: 'Unknown error',
    userMessage: '알 수 없는 오류가 발생했습니다.',
  };
}

// ApiError 타입 가드
function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'status' in error && 'message' in error;
}

// 에러 메시지 추출 헬퍼
export function getErrorMessage(error: unknown): string {
  const standardError = parseError(error);
  return standardError.userMessage;
}

// 에러가 인증 관련인지 확인
export function isAuthError(error: unknown): boolean {
  const standardError = parseError(error);
  return standardError.type === 'auth';
}

// 에러가 네트워크 관련인지 확인
export function isNetworkError(error: unknown): boolean {
  const standardError = parseError(error);
  return standardError.type === 'network';
}

// 에러가 유효성 검사 관련인지 확인
export function isValidationError(error: unknown): boolean {
  const standardError = parseError(error);
  return standardError.type === 'validation';
}

// 에러 로깅 (개발 환경에서만)
export function logError(context: string, error: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    const standardError = parseError(error);
    // eslint-disable-next-line no-console
    console.error(`[${context}]`, {
      type: standardError.type,
      message: standardError.message,
      status: standardError.status,
      details: standardError.details,
    });
  }
}
