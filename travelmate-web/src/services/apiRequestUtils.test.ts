import { appendQuery, getApiErrorMessage, withServiceError } from './apiRequestUtils';

describe('apiRequestUtils', () => {
  describe('appendQuery', () => {
    it('appends encoded query params and skips empty optional values', () => {
      const endpoint = appendQuery('/reviews', {
        page: 0,
        size: 20,
        sort: 'recent',
        keyword: '서울 맛집',
        includeMine: false,
        unused: undefined,
        empty: null,
      });

      const [path, query] = endpoint.split('?');
      const params = new URLSearchParams(query);

      expect(path).toBe('/reviews');
      expect(params.get('page')).toBe('0');
      expect(params.get('size')).toBe('20');
      expect(params.get('sort')).toBe('recent');
      expect(params.get('keyword')).toBe('서울 맛집');
      expect(params.get('includeMine')).toBe('false');
      expect(params.has('unused')).toBe(false);
      expect(params.has('empty')).toBe(false);
    });

    it('returns the endpoint unchanged when all params are empty', () => {
      expect(appendQuery('/reviews', { page: null, size: undefined })).toBe('/reviews');
    });
  });

  describe('getApiErrorMessage', () => {
    it('uses Error messages first', () => {
      expect(getApiErrorMessage(new Error('network failed'), 'fallback')).toBe('network failed');
    });

    it('uses API error object messages', () => {
      expect(getApiErrorMessage({ message: 'server rejected', status: 400 }, 'fallback')).toBe(
        'server rejected'
      );
    });

    it('falls back when no message exists', () => {
      expect(getApiErrorMessage({ status: 500 }, 'fallback')).toBe('fallback');
    });
  });

  describe('withServiceError', () => {
    it('returns successful request results', async () => {
      await expect(withServiceError(Promise.resolve({ ok: true }), 'fallback')).resolves.toEqual({
        ok: true,
      });
    });

    it('throws Error instances with preserved API messages', async () => {
      await expect(
        withServiceError(Promise.reject({ message: 'bad request', status: 400 }), 'fallback')
      ).rejects.toThrow('bad request');
    });
  });
});
