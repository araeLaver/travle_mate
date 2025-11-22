import { authService } from './authService';

// API Base URL 설정
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

export interface ApiError {
  message: string;
  status: number;
  errors?: any;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // 인증 헤더 가져오기 (동기)
  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = authService.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
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

  // GET 요청
  async get<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    try {
      const headers = await this.getHeadersWithRefresh(includeAuth);
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // POST 요청
  async post<T>(
    endpoint: string,
    data?: any,
    includeAuth: boolean = true
  ): Promise<T> {
    try {
      const headers = await this.getHeadersWithRefresh(includeAuth);
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // PUT 요청
  async put<T>(
    endpoint: string,
    data?: any,
    includeAuth: boolean = true
  ): Promise<T> {
    try {
      const headers = await this.getHeadersWithRefresh(includeAuth);
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // DELETE 요청
  async delete<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    try {
      const headers = await this.getHeadersWithRefresh(includeAuth);
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers,
      });

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
  private handleError(error: any): ApiError {
    if (error.status) {
      return error as ApiError;
    }

    // 네트워크 에러 등
    return {
      message: error.message || '네트워크 오류가 발생했습니다.',
      status: 0,
    };
  }

  // 파일 업로드
  async uploadFile(endpoint: string, file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = authService.getToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

export const apiClient = new ApiClient();
