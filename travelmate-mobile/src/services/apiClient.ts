/**
 * API Client for TravelMate Mobile
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

const normalizeApiBaseUrl = (url: string): string => {
  const trimmed = url.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const getNonEmptyString = (value: unknown): string | undefined => {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

const EXPO_PUBLIC_API_URL_ENV_KEY = 'EXPO_PUBLIC_API_URL';

const getExpoPublicApiUrl = (): string | undefined =>
  getNonEmptyString(process.env.EXPO_PUBLIC_API_URL) ||
  getNonEmptyString(process.env[EXPO_PUBLIC_API_URL_ENV_KEY]);

const configuredApiUrl =
  getExpoPublicApiUrl() ||
  getNonEmptyString(process.env.API_URL) ||
  (!__DEV__ ? getNonEmptyString(Constants.expoConfig?.extra?.apiUrl) : undefined);

const developmentApiUrl =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8080/api'
    : 'http://localhost:8080/api';

const API_BASE_URL = normalizeApiBaseUrl(
  configuredApiUrl || (__DEV__ ? developmentApiUrl : 'https://api.travelmate.app')
);
const MOBILE_CLIENT_HEADERS = {
  'X-Client-Type': 'mobile',
};

type RetriableRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
  headers: NonNullable<AxiosRequestConfig['headers']> & {
    Authorization?: string;
  };
};

type RefreshSubscriber = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

type ReactNativeFormFile = {
  uri: string;
  name: string;
  type: string;
};

// Token storage keys
const TOKEN_KEY = '@travelmate:token';
const REFRESH_TOKEN_KEY = '@travelmate:refreshToken';
const DEVICE_ID_KEY = '@travelmate:deviceId';

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: RefreshSubscriber[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...MOBILE_CLIENT_HEADERS,
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      async config => {
        const token = await this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config as RetriableRequestConfig | undefined;

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.refreshSubscribers.push({
                resolve: (token: string) => {
                  originalRequest.headers = originalRequest.headers || {};
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                  resolve(this.client(originalRequest));
                },
                reject,
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await this.getRefreshToken();
            if (!refreshToken) {
              throw new Error('No refresh token');
            }
            const deviceId = await this.getDeviceId();

            const response = await axios.post(
              `${API_BASE_URL}/auth/refresh`,
              {
                refreshToken,
                deviceId,
              },
              {
                headers: MOBILE_CLIENT_HEADERS,
              }
            );

            const { accessToken, refreshToken: newRefreshToken } = response.data;
            await this.setTokens(accessToken, newRefreshToken);

            this.resolveRefreshSubscribers(accessToken);

            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            await this.clearTokens();
            this.rejectRefreshSubscribers(refreshError);
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Token management
  async getToken(): Promise<string | null> {
    return this.getStoredNonEmptyValue(TOKEN_KEY);
  }

  async getRefreshToken(): Promise<string | null> {
    return this.getStoredNonEmptyValue(REFRESH_TOKEN_KEY);
  }

  async setTokens(accessToken: string, refreshToken?: string | null): Promise<void> {
    const normalizedAccessToken = this.normalizeStoredValue(accessToken);
    if (!normalizedAccessToken) {
      throw new Error('Access token is required');
    }

    await AsyncStorage.setItem(TOKEN_KEY, normalizedAccessToken);
    if (refreshToken !== undefined) {
      const normalizedRefreshToken = this.normalizeStoredValue(refreshToken);
      if (normalizedRefreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, normalizedRefreshToken);
      } else {
        await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    }
  }

  async clearTokens(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  async getDeviceContext(): Promise<{ deviceId: string; deviceName: string }> {
    return {
      deviceId: await this.getDeviceId(),
      deviceName: this.getDeviceName(),
    };
  }

  async getDeviceHeaders(): Promise<Record<string, string>> {
    const { deviceId, deviceName } = await this.getDeviceContext();
    return {
      'X-Device-Id': deviceId,
      'X-Device-Name': deviceName,
    };
  }

  async withDeviceHeaders(config: AxiosRequestConfig = {}): Promise<AxiosRequestConfig> {
    return {
      ...config,
      headers: {
        ...MOBILE_CLIENT_HEADERS,
        ...(config.headers as Record<string, string> | undefined),
        ...(await this.getDeviceHeaders()),
      },
    };
  }

  // HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  async post<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    return response.data;
  }

  async patch<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(url, data, config);
    return response.data;
  }

  // File upload
  async uploadFile<T>(url: string, file: { uri: string; name: string; type: string }): Promise<T> {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as ReactNativeFormFile as unknown as Blob);

    const response: AxiosResponse<T> = await this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  private resolveRefreshSubscribers(token: string): void {
    this.refreshSubscribers.forEach(subscriber => subscriber.resolve(token));
    this.refreshSubscribers = [];
  }

  private rejectRefreshSubscribers(error: unknown): void {
    this.refreshSubscribers.forEach(subscriber => subscriber.reject(error));
    this.refreshSubscribers = [];
  }

  private async getDeviceId(): Promise<string> {
    const storedDeviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    const normalizedDeviceId = this.normalizeStoredValue(storedDeviceId);
    if (normalizedDeviceId) {
      if (normalizedDeviceId !== storedDeviceId) {
        await AsyncStorage.setItem(DEVICE_ID_KEY, normalizedDeviceId);
      }
      return normalizedDeviceId;
    }

    if (storedDeviceId !== null) {
      await AsyncStorage.removeItem(DEVICE_ID_KEY);
    }

    const deviceId = `mobile-${Platform.OS}-${Crypto.randomUUID()}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    return deviceId;
  }

  private async getStoredNonEmptyValue(key: string): Promise<string | null> {
    const stored = await AsyncStorage.getItem(key);
    const normalized = this.normalizeStoredValue(stored);
    if (normalized) {
      return normalized;
    }

    if (stored !== null) {
      await AsyncStorage.removeItem(key);
    }

    return null;
  }

  private normalizeStoredValue(value: string | null | undefined): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed || null;
  }

  private getDeviceName(): string {
    return `TravelMate ${Platform.OS} ${Constants.expoConfig?.version || '1.0.0'}`;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
