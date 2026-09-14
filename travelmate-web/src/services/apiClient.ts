import { authService } from './authService';
import { ApiError, FileUploadResponse } from '../types';
import { API_BASE_URL } from './apiConfig';

export type { ApiError };

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // 토큰 갱신 후 헤더 가져오기 (비동기)
  private async getHeadersWithRefresh(includeAuth: boolean = true): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = await authService.getValidToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async fetchWithAuthRetry(
    endpoint: string,
    request: RequestInit,
    includeAuth: boolean = true,
    getRetryHeaders: () => Promise<HeadersInit> = () => this.getHeadersWithRefresh(includeAuth)
  ): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, request);

    if (!includeAuth || response.status !== 401) {
      return response;
    }

    try {
      await authService.refreshAccessToken();
    } catch {
      return response;
    }

    return fetch(url, {
      ...request,
      headers: await getRetryHeaders(),
    });
  }

  // GET 요청
  async get<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    try {
      const headers = await this.getHeadersWithRefresh(includeAuth);
      const response = await this.fetchWithAuthRetry(
        endpoint,
        {
          method: 'GET',
          headers,
        },
        includeAuth
      );

      return this.handleResponse<T>(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // POST 요청
  async post<T, D = unknown>(endpoint: string, data?: D, includeAuth: boolean = true): Promise<T> {
    try {
      const headers = await this.getHeadersWithRefresh(includeAuth);
      const response = await this.fetchWithAuthRetry(
        endpoint,
        {
          method: 'POST',
          headers,
          body: data ? JSON.stringify(data) : undefined,
        },
        includeAuth
      );

      return this.handleResponse<T>(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // PUT 요청
  async put<T, D = unknown>(endpoint: string, data?: D, includeAuth: boolean = true): Promise<T> {
    try {
      const headers = await this.getHeadersWithRefresh(includeAuth);
      const response = await this.fetchWithAuthRetry(
        endpoint,
        {
          method: 'PUT',
          headers,
          body: data ? JSON.stringify(data) : undefined,
        },
        includeAuth
      );

      return this.handleResponse<T>(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // DELETE 요청
  async delete<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    try {
      const headers = await this.getHeadersWithRefresh(includeAuth);
      const response = await this.fetchWithAuthRetry(
        endpoint,
        {
          method: 'DELETE',
          headers,
        },
        includeAuth
      );

      return this.handleResponse<T>(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // PATCH 요청
  async patch<T, D = unknown>(endpoint: string, data?: D, includeAuth: boolean = true): Promise<T> {
    try {
      const headers = await this.getHeadersWithRefresh(includeAuth);
      const response = await this.fetchWithAuthRetry(
        endpoint,
        {
          method: 'PATCH',
          headers,
          body: data ? JSON.stringify(data) : undefined,
        },
        includeAuth
      );

      return this.handleResponse<T>(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // 응답 처리
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = {
        message: 'API 요청 실패',
        status: response.status,
      };

      try {
        const errorData = await response.json();
        error.message = errorData.message || error.message;
        error.errors = errorData.errors;
      } catch (e) {
        // JSON 파싱 실패 시 기본 메시지 사용
      }

      throw error;
    }

    // 204 No Content인 경우
    if (response.status === 204) {
      return {} as T;
    }

    try {
      return await response.json();
    } catch (e) {
      // JSON이 아닌 응답인 경우
      return {} as T;
    }
  }

  // 에러 처리
  private handleError(error: unknown): ApiError {
    if (error && typeof error === 'object' && 'status' in error) {
      return error as ApiError;
    }

    // 네트워크 에러 등
    const errorMessage = error instanceof Error ? error.message : '네트워크 오류가 발생했습니다.';
    return {
      message: errorMessage,
      status: 0,
    };
  }

  // 파일 업로드
  async uploadFile(endpoint: string, file: File): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const getUploadHeaders = async (): Promise<HeadersInit> => {
        const token = await authService.getValidToken();
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
      };

      const response = await this.fetchWithAuthRetry(
        endpoint,
        {
          method: 'POST',
          headers: await getUploadHeaders(),
          body: formData,
        },
        true,
        getUploadHeaders
      );

      return this.handleResponse<FileUploadResponse>(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

export const apiClient = new ApiClient();
