import { getApiBaseUrl, getBackendBaseUrl, getWebSocketUrl } from './apiConfig';

const originalEnv = { ...process.env };

describe('apiConfig', () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.REACT_APP_API_URL;
    delete process.env.REACT_APP_BACKEND_URL;
    delete process.env.REACT_APP_WS_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses relative /api by default in production', () => {
    process.env.NODE_ENV = 'production';

    expect(getApiBaseUrl()).toBe('/api');
  });

  it('uses localhost API by default outside production', () => {
    process.env.NODE_ENV = 'test';

    expect(getApiBaseUrl()).toBe('http://localhost:8080/api');
  });

  it('prefers explicit API and backend URLs', () => {
    process.env.REACT_APP_API_URL = 'https://api.example.com/api';
    process.env.REACT_APP_BACKEND_URL = 'https://backend.example.com/api';

    expect(getApiBaseUrl()).toBe('https://api.example.com/api');
    expect(getBackendBaseUrl()).toBe('https://backend.example.com/api');
  });

  it('derives WebSocket URL from backend base when no explicit URL is set', () => {
    process.env.REACT_APP_BACKEND_URL = 'https://backend.example.com/api/';

    expect(getWebSocketUrl()).toBe('https://backend.example.com/api/ws');
  });

  it('prefers explicit WebSocket URL', () => {
    process.env.REACT_APP_WS_URL = '/api/ws';

    expect(getWebSocketUrl()).toBe('/api/ws');
  });
});
