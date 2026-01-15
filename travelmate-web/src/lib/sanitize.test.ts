import {
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
} from './sanitize';

describe('sanitize', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('should escape ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(escapeHtml(null as unknown as string)).toBe('');
      expect(escapeHtml(undefined as unknown as string)).toBe('');
    });
  });

  describe('sanitizeString', () => {
    it('should remove script tags', () => {
      expect(sanitizeString('<script>alert(1)</script>hello')).toBe('hello');
    });

    it('should remove onclick handlers', () => {
      expect(sanitizeString('<div onclick="alert(1)">click</div>')).toBe(
        '<div>click</div>'
      );
    });

    it('should remove javascript: protocol', () => {
      expect(sanitizeString('javascript:alert(1)')).toBe('alert(1)');
    });

    it('should remove vbscript: protocol', () => {
      expect(sanitizeString('vbscript:msgbox')).toBe('msgbox');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  hello world  ')).toBe('hello world');
    });
  });

  describe('sanitizeHtml', () => {
    it('should allow safe tags', () => {
      expect(sanitizeHtml('<b>bold</b> <i>italic</i>')).toBe(
        '<b>bold</b> <i>italic</i>'
      );
    });

    it('should remove unsafe tags', () => {
      expect(sanitizeHtml('<script>alert(1)</script><b>text</b>')).toBe(
        '<b>text</b>'
      );
    });

    it('should remove attributes from allowed tags', () => {
      expect(sanitizeHtml('<b style="color:red">text</b>')).toBe('<b>text</b>');
    });

    it('should use custom allowed tags', () => {
      expect(sanitizeHtml('<div>text</div>', ['div'])).toBe('<div>text</div>');
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow http URLs', () => {
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    });

    it('should allow https URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('should allow mailto URLs', () => {
      expect(sanitizeUrl('mailto:test@example.com')).toBe(
        'mailto:test@example.com'
      );
    });

    it('should block javascript URLs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    });

    it('should block data: text URLs', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    });

    it('should allow relative URLs', () => {
      expect(sanitizeUrl('/path/to/page')).toBe('/path/to/page');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize string values', () => {
      const obj = {
        name: '<script>alert(1)</script>John',
        age: 30,
      };
      const result = sanitizeObject(obj);
      expect(result.name).toBe('John');
      expect(result.age).toBe(30);
    });

    it('should sanitize nested objects', () => {
      const obj = {
        user: {
          name: '<script>alert(1)</script>John',
        },
      };
      const result = sanitizeObject(obj);
      expect(result.user.name).toBe('John');
    });

    it('should sanitize arrays', () => {
      const obj = {
        tags: ['<script>1</script>tag1', 'tag2'],
      };
      const result = sanitizeObject(obj);
      expect(result.tags).toEqual(['tag1', 'tag2']);
    });
  });

  describe('sanitizeEmail', () => {
    it('should accept valid email', () => {
      expect(sanitizeEmail('user@example.com')).toBe('user@example.com');
    });

    it('should lowercase email', () => {
      expect(sanitizeEmail('User@Example.COM')).toBe('user@example.com');
    });

    it('should trim whitespace', () => {
      expect(sanitizeEmail('  user@example.com  ')).toBe('user@example.com');
    });

    it('should reject invalid email', () => {
      expect(sanitizeEmail('invalid-email')).toBe('');
      expect(sanitizeEmail('user@')).toBe('');
      expect(sanitizeEmail('@example.com')).toBe('');
    });
  });

  describe('sanitizePhone', () => {
    it('should keep only digits and plus', () => {
      expect(sanitizePhone('+1 (555) 123-4567')).toBe('+15551234567');
    });

    it('should handle empty string', () => {
      expect(sanitizePhone('')).toBe('');
    });
  });

  describe('sanitizeNumber', () => {
    it('should keep only digits by default', () => {
      expect(sanitizeNumber('abc123def456')).toBe('123456');
    });

    it('should allow decimals when specified', () => {
      expect(sanitizeNumber('123.45', true)).toBe('123.45');
    });

    it('should handle multiple decimal points', () => {
      expect(sanitizeNumber('12.34.56', true)).toBe('12.3456');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('Hello World!', 8)).toBe('Hello...');
    });

    it('should not truncate short strings', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });

    it('should use custom suffix', () => {
      expect(truncate('Hello World!', 8, '…')).toBe('Hello W…');
    });
  });

  describe('validateLength', () => {
    it('should pass valid length', () => {
      expect(validateLength('hello', 1, 10)).toEqual({ valid: true });
    });

    it('should fail for too short', () => {
      const result = validateLength('hi', 5, 10);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('최소 5자');
    });

    it('should fail for too long', () => {
      const result = validateLength('hello world!', 1, 5);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('최대 5자');
    });
  });

  describe('containsSqlInjection', () => {
    it('should detect SELECT injection', () => {
      expect(containsSqlInjection("'; SELECT * FROM users --")).toBe(true);
    });

    it('should detect DROP injection', () => {
      expect(containsSqlInjection('; DROP TABLE users')).toBe(true);
    });

    it('should detect OR 1=1 pattern', () => {
      expect(containsSqlInjection("' OR '1'='1")).toBe(true);
    });

    it('should not flag normal text', () => {
      expect(containsSqlInjection('Hello World')).toBe(false);
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove path components', () => {
      expect(sanitizeFilename('../../etc/passwd')).toBe('passwd');
      expect(sanitizeFilename('C:\\Windows\\System32\\file.txt')).toBe(
        'file.txt'
      );
    });

    it('should replace dangerous characters', () => {
      expect(sanitizeFilename('file<name>.txt')).toBe('file_name_.txt');
    });

    it('should remove leading/trailing dots and spaces', () => {
      expect(sanitizeFilename('...file.txt...')).toBe('file.txt');
    });

    it('should limit length', () => {
      const longName = 'a'.repeat(300) + '.txt';
      expect(sanitizeFilename(longName).length).toBeLessThanOrEqual(255);
    });

    it('should remove null bytes', () => {
      expect(sanitizeFilename('file\0name.txt')).toBe('filename.txt');
    });
  });
});
