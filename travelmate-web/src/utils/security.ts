/**
 * 프론트엔드 보안 유틸리티
 */

/**
 * XSS 방지를 위한 HTML 이스케이프
 */
export function escapeHtml(str: string): string {
  if (!str) return '';

  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  return str.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char] || char);
}

/**
 * HTML 이스케이프 해제
 */
export function unescapeHtml(str: string): string {
  if (!str) return '';

  const htmlEntities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '=',
  };

  return str.replace(/&(?:amp|lt|gt|quot|#39|#x2F|#x60|#x3D);/g,
    (entity) => htmlEntities[entity] || entity
  );
}

/**
 * URL 안전성 검증
 */
export function isUrlSafe(url: string): boolean {
  if (!url) return false;

  const trimmedUrl = url.trim().toLowerCase();

  // 위험한 프로토콜 차단
  const dangerousProtocols = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
  ];

  for (const protocol of dangerousProtocols) {
    if (trimmedUrl.startsWith(protocol)) {
      return false;
    }
  }

  // 상대 URL 허용
  if (url.startsWith('/') && !url.startsWith('//')) {
    return true;
  }

  // http/https만 허용
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * URL 정제
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';

  if (!isUrlSafe(url)) {
    return '';
  }

  return url;
}

/**
 * 사용자 입력 정제
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  // 널 바이트 제거
  let result = input.replace(/\0/g, '');

  // 스크립트 태그 제거
  result = result.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // 이벤트 핸들러 제거
  result = result.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

  // javascript: 프로토콜 제거
  result = result.replace(/javascript:/gi, '');

  return result;
}

/**
 * 파일명 정제
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return '';

  return fileName
    .replace(/[/\\]/g, '') // 경로 구분자 제거
    .replace(/\0/g, '')    // 널 바이트 제거
    .replace(/\.\./g, '')  // 디렉토리 순회 방지
    .replace(/[<>:"|?*]/g, ''); // Windows 금지 문자 제거
}

/**
 * CSRF 토큰 가져오기
 */
export function getCsrfToken(): string | null {
  // 메타 태그에서 CSRF 토큰 읽기
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (metaTag) {
    return metaTag.getAttribute('content');
  }

  // 쿠키에서 CSRF 토큰 읽기
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      return decodeURIComponent(value);
    }
  }

  return null;
}

/**
 * Content Security Policy 위반 보고
 */
export function setupCspReporting(): void {
  document.addEventListener('securitypolicyviolation', (e) => {
    console.warn('CSP Violation:', {
      blockedURI: e.blockedURI,
      violatedDirective: e.violatedDirective,
      originalPolicy: e.originalPolicy,
      documentURI: e.documentURI,
    });

    // 서버에 CSP 위반 보고 (선택적)
    // reportCspViolation({
    //   blockedURI: e.blockedURI,
    //   violatedDirective: e.violatedDirective,
    // });
  });
}

/**
 * 비밀번호 강도 계산
 */
export function calculatePasswordStrength(password: string): {
  score: number;
  level: 'weak' | 'fair' | 'good' | 'strong' | 'very_strong';
  feedback: string[];
} {
  if (!password) {
    return { score: 0, level: 'weak', feedback: ['비밀번호를 입력하세요'] };
  }

  let score = 0;
  const feedback: string[] = [];

  // 길이 점수
  if (password.length >= 8) score += 20;
  else feedback.push('최소 8자 이상');

  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // 대문자
  if (/[A-Z]/.test(password)) score += 15;
  else feedback.push('대문자 포함');

  // 소문자
  if (/[a-z]/.test(password)) score += 15;
  else feedback.push('소문자 포함');

  // 숫자
  if (/[0-9]/.test(password)) score += 15;
  else feedback.push('숫자 포함');

  // 특수문자
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 20;
  else feedback.push('특수문자 포함');

  // 패널티: 연속 문자
  if (/(.)\1{2,}/.test(password)) {
    score -= 10;
    feedback.push('연속된 문자 피하기');
  }

  // 패널티: 흔한 패턴
  const commonPatterns = ['password', '123456', 'qwerty', 'abc123'];
  if (commonPatterns.some(p => password.toLowerCase().includes(p))) {
    score -= 20;
    feedback.push('흔한 패턴 피하기');
  }

  score = Math.max(0, Math.min(100, score));

  let level: 'weak' | 'fair' | 'good' | 'strong' | 'very_strong';
  if (score >= 80) level = 'very_strong';
  else if (score >= 60) level = 'strong';
  else if (score >= 40) level = 'good';
  else if (score >= 20) level = 'fair';
  else level = 'weak';

  return { score, level, feedback };
}

/**
 * 안전한 JSON 파싱
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * localStorage 안전한 접근
 */
export const secureStorage = {
  get: <T>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? safeJsonParse(item, fallback) : fallback;
    } catch {
      return fallback;
    }
  },

  set: <T>(key: string, value: T): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
};

/**
 * 민감 데이터 마스킹
 */
export function maskSensitiveData(data: string, type: 'email' | 'phone' | 'card'): string {
  if (!data) return '';

  switch (type) {
    case 'email': {
      const [local, domain] = data.split('@');
      if (!local || !domain) return data;
      const masked = local.charAt(0) + '*'.repeat(Math.max(local.length - 2, 1)) + local.slice(-1);
      return `${masked}@${domain}`;
    }
    case 'phone': {
      const digits = data.replace(/\D/g, '');
      if (digits.length < 4) return data;
      return digits.slice(0, 3) + '-****-' + digits.slice(-4);
    }
    case 'card': {
      const digits = data.replace(/\D/g, '');
      if (digits.length < 8) return data;
      return digits.slice(0, 4) + '-****-****-' + digits.slice(-4);
    }
    default:
      return data;
  }
}

export default {
  escapeHtml,
  unescapeHtml,
  isUrlSafe,
  sanitizeUrl,
  sanitizeInput,
  sanitizeFileName,
  getCsrfToken,
  setupCspReporting,
  calculatePasswordStrength,
  safeJsonParse,
  secureStorage,
  maskSensitiveData,
};
