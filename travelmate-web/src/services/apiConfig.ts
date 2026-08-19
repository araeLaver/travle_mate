export const getApiBaseUrl = (): string => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  return process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8080/api';
};

export const getBackendBaseUrl = (): string => process.env.REACT_APP_BACKEND_URL || getApiBaseUrl();

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

export const getWebSocketUrl = (): string => {
  if (process.env.REACT_APP_WS_URL) {
    return process.env.REACT_APP_WS_URL;
  }

  return `${trimTrailingSlash(getBackendBaseUrl())}/ws`;
};

export const API_BASE_URL = getApiBaseUrl();
