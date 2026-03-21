/**
 * Input Sanitization Utility
 *
 * Provides functions to sanitize user input and prevent XSS attacks.
 */

/**
 * HTML entity encoding map
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
  '=': '&#x3D;',
};

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str).replace(/[&<>"'`=/]/g, char => HTML_ENTITIES[char] || char);
}

/**
 * Sanitize a string for safe display
 * Removes potentially dangerous HTML tags and attributes
 */
export function sanitizeString(input: string): string {
  if (!input) return '';

  return (
    input
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove on* event handlers
      .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
      // Remove javascript: protocol
      .replace(/javascript:/gi, '')
      // Remove data: protocol (except for images)
      .replace(/data:(?!image\/)/gi, '')
      // Remove vbscript: protocol
      .replace(/vbscript:/gi, '')
      // Remove expression() (IE CSS hack)
      .replace(/expression\s*\(/gi, '')
      // Escape remaining HTML
      .trim()
  );
}

/**
 * Sanitize HTML content, allowing safe tags
 * Use this when you need to preserve some HTML formatting
 */
export function sanitizeHtml(
  html: string,
  allowedTags: string[] = ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li']
): string {
  if (!html) return '';

  // First, apply basic sanitization
  let sanitized = sanitizeString(html);

  // Remove all tags except allowed ones
  const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/gi;
  sanitized = sanitized.replace(tagPattern, (match, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      // Keep the tag but remove any attributes
      const isClosing = match.startsWith('</');
      return isClosing ? `</${tagName}>` : `<${tagName}>`;
    }
    return '';
  });

  return sanitized;
}

/**
 * Sanitize a URL to prevent javascript: and other dangerous protocols
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';

  const trimmed = url.trim().toLowerCase();

  // Allow only safe protocols
  const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:', '/'];
  const isSafe = safeProtocols.some(
    protocol => trimmed.startsWith(protocol) || !trimmed.includes(':')
  );

  if (!isSafe) {
    return '';
  }

  // Additional check for encoded javascript
  if (
    trimmed.includes('javascript') ||
    trimmed.includes('vbscript') ||
    trimmed.includes('data:text')
  ) {
    return '';
  }

  return url;
}

/**
 * Sanitize an object's string values recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string'
          ? sanitizeString(item)
          : typeof item === 'object' && item !== null
            ? sanitizeObject(item as Record<string, unknown>)
            : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Validate and sanitize email format
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(trimmed)) {
    return '';
  }

  return trimmed;
}

/**
 * Validate and sanitize a phone number
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';

  // Remove all non-digit characters except + for international prefix
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Validate and sanitize a numeric string
 */
export function sanitizeNumber(value: string, allowDecimal = false): string {
  if (!value) return '';

  const pattern = allowDecimal ? /[^\d.]/g : /\D/g;
  let sanitized = value.replace(pattern, '');

  // Ensure only one decimal point
  if (allowDecimal) {
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      sanitized = parts[0] + '.' + parts.slice(1).join('');
    }
  }

  return sanitized;
}

/**
 * Truncate a string to a maximum length
 */
export function truncate(str: string, maxLength: number, suffix = '...'): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Validate input length
 */
export function validateLength(
  value: string,
  minLength: number,
  maxLength: number
): { valid: boolean; message?: string } {
  if (value.length < minLength) {
    return { valid: false, message: `최소 ${minLength}자 이상 입력해주세요.` };
  }
  if (value.length > maxLength) {
    return { valid: false, message: `최대 ${maxLength}자까지 입력 가능합니다.` };
  }
  return { valid: true };
}

/**
 * Check for SQL injection patterns
 */
export function containsSqlInjection(input: string): boolean {
  const patterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/i,
    /(--)/, // SQL comment
    /(;).*(\b(SELECT|DROP|DELETE)\b)/i, // Statement termination + command
    /('|").*(\bOR\b|\bAND\b).*('|")\s*=\s*('|")/i, // Quote manipulation
  ];

  return patterns.some(pattern => pattern.test(input));
}

/**
 * Sanitize filename for file uploads
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return '';

  return (
    filename
      // Remove path components
      // eslint-disable-next-line no-useless-escape
      .replace(/^.*[\\\/]/, '')
      // Remove null bytes
      .replace(/\0/g, '')
      // Replace dangerous characters
      .replace(/[<>:"/\\|?*]/g, '_')
      // Remove leading/trailing spaces and dots
      .replace(/^[\s.]+|[\s.]+$/g, '')
      // Limit length
      .substring(0, 255)
  );
}

const sanitize = {
  escapeHtml,
  sanitizeString,
  sanitizeHtml,
  sanitizeUrl,
  sanitizeObject,
  sanitizeEmail,
  sanitizePhone,
  sanitizeNumber,
  truncate,
  validateLength,
  containsSqlInjection,
  sanitizeFilename,
};

export default sanitize;
