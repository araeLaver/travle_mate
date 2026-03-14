import { apiClient } from './apiClient';
import {
  CollectibleLocationAdminResponse,
  CreateLocationRequest,
  UpdateLocationRequest,
  LocationStatsResponse,
  BulkCreateResponse,
  PaginatedResponse,
} from '../types';

// Dashboard Types
export interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  activeUsersToday: number;
  totalNfts: number;
  mintedNfts: number;
  collectionsToday: number;
  totalGroups: number;
  activeGroups: number;
  totalReviews: number;
  averageRating: number;
  dailyStats: DailyStats[];
  usersByCountry?: Record<string, number>;
  nftsByRarity: Record<string, number>;
}

export interface DailyStats {
  date: string;
  newUsers: number;
  activeUsers?: number;
  nftCollections: number;
  mintings?: number;
  newGroups?: number;
  messages?: number;
}

export interface UserManagement {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  nftCount: number;
  followerCount?: number;
  groupCount?: number;
}

export interface UserDetailResponse extends UserManagement {
  bio: string | null;
  mintedNftCount: number;
  followingCount?: number;
  reviewCount?: number;
  totalPoints?: number;
  recentActivity?: ActivityLog[];
}

export interface ActivityLog {
  id: number;
  type: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateUserRequest {
  role?: string;
  isActive?: boolean;
  nickname?: string;
}

export interface LocationManagement {
  id: number;
  name: string;
  description: string;
  region: string;
  country: string;
  category: string;
  rarity: string;
  latitude: number;
  longitude: number;
  collectRadius: number;
  isActive: boolean;
  createdAt: string;
  totalCollections: number;
  totalReviews: number;
  averageRating: number | null;
}

export interface SystemHealth {
  status: string;
  uptime: number;
  cpuUsage?: number;
  memoryUsage: number;
  diskUsage?: number;
  services: Record<string, ServiceStatus>;
}

export interface ServiceStatus {
  name: string;
  status: string;
  responseTime: number;
  message: string;
}

export interface BulkActionRequest {
  ids: number[];
  action: 'ACTIVATE' | 'DEACTIVATE' | 'DELETE';
}

export interface BulkActionResponse {
  successCount: number;
  failureCount: number;
  failedIds: number[];
  message: string;
}

class AdminService {
  private readonly baseUrl = '/admin/locations';
  private readonly adminApiUrl = '/api/admin';

  /**
   * 모든 수집 장소 목록 조회 (페이징)
   */
  async getAllLocations(
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedResponse<CollectibleLocationAdminResponse>> {
    return apiClient.get<PaginatedResponse<CollectibleLocationAdminResponse>>(
      `${this.baseUrl}?page=${page}&size=${size}`
    );
  }

  /**
   * 특정 장소 상세 조회
   */
  async getLocation(id: number): Promise<CollectibleLocationAdminResponse> {
    return apiClient.get<CollectibleLocationAdminResponse>(`${this.baseUrl}/${id}`);
  }

  /**
   * 새 장소 생성
   */
  async createLocation(request: CreateLocationRequest): Promise<CollectibleLocationAdminResponse> {
    return apiClient.post<CollectibleLocationAdminResponse, CreateLocationRequest>(
      this.baseUrl,
      request
    );
  }

  /**
   * 장소 수정
   */
  async updateLocation(
    id: number,
    request: UpdateLocationRequest
  ): Promise<CollectibleLocationAdminResponse> {
    return apiClient.put<CollectibleLocationAdminResponse, UpdateLocationRequest>(
      `${this.baseUrl}/${id}`,
      request
    );
  }

  /**
   * 장소 활성화/비활성화 토글
   */
  async toggleLocationActive(id: number): Promise<{ message: string }> {
    return apiClient.patch<{ message: string }>(`${this.baseUrl}/${id}/toggle-active`);
  }

  /**
   * 장소 삭제
   */
  async deleteLocation(id: number): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * 시즌 이벤트 장소 조회
   */
  async getSeasonalEvents(): Promise<CollectibleLocationAdminResponse[]> {
    return apiClient.get<CollectibleLocationAdminResponse[]>(`${this.baseUrl}/seasonal-events`);
  }

  /**
   * 장소 통계 조회
   */
  async getLocationStats(): Promise<LocationStatsResponse> {
    return apiClient.get<LocationStatsResponse>(`${this.baseUrl}/stats`);
  }

  /**
   * 대량 장소 생성
   */
  async bulkCreateLocations(requests: CreateLocationRequest[]): Promise<BulkCreateResponse> {
    return apiClient.post<BulkCreateResponse, CreateLocationRequest[]>(
      `${this.baseUrl}/bulk`,
      requests
    );
  }

  // ===== Dashboard API =====

  /**
   * 대시보드 통계 조회
   */
  async getDashboardStats(): Promise<DashboardStats> {
    return apiClient.get<DashboardStats>(`${this.adminApiUrl}/dashboard`);
  }

  /**
   * 시스템 상태 조회
   */
  async getSystemHealth(): Promise<SystemHealth> {
    return apiClient.get<SystemHealth>(`${this.adminApiUrl}/health`);
  }

  // ===== User Management API =====

  /**
   * 사용자 목록 조회
   */
  async getUsers(params: {
    search?: string;
    role?: string;
    isActive?: boolean;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<UserManagement>> {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.role) queryParams.append('role', params.role);
    if (params.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    if (params.page !== undefined) queryParams.append('page', String(params.page));
    if (params.size !== undefined) queryParams.append('size', String(params.size));

    const url = `${this.adminApiUrl}/users${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return apiClient.get<PaginatedResponse<UserManagement>>(url);
  }

  /**
   * 사용자 상세 조회
   */
  async getUserDetail(userId: number): Promise<UserDetailResponse> {
    return apiClient.get<UserDetailResponse>(`${this.adminApiUrl}/users/${userId}`);
  }

  /**
   * 사용자 정보 수정
   */
  async updateUser(userId: number, request: UpdateUserRequest): Promise<UserManagement> {
    return apiClient.put<UserManagement, UpdateUserRequest>(
      `${this.adminApiUrl}/users/${userId}`,
      request
    );
  }

  /**
   * 사용자 일괄 처리
   */
  async bulkUserAction(request: BulkActionRequest): Promise<BulkActionResponse> {
    return apiClient.post<BulkActionResponse, BulkActionRequest>(
      `${this.adminApiUrl}/users/bulk`,
      request
    );
  }

  // ===== Location Management API (via admin endpoint) =====

  /**
   * 관리자용 장소 목록 조회
   */
  async getAdminLocations(params: {
    search?: string;
    category?: string;
    rarity?: string;
    isActive?: boolean;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<LocationManagement>> {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.category) queryParams.append('category', params.category);
    if (params.rarity) queryParams.append('rarity', params.rarity);
    if (params.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    if (params.page !== undefined) queryParams.append('page', String(params.page));
    if (params.size !== undefined) queryParams.append('size', String(params.size));

    const url = `${this.adminApiUrl}/locations${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return apiClient.get<PaginatedResponse<LocationManagement>>(url);
  }

  /**
   * 관리자용 장소 생성
   */
  async createAdminLocation(request: CreateLocationRequest): Promise<LocationManagement> {
    return apiClient.post<LocationManagement, CreateLocationRequest>(
      `${this.adminApiUrl}/locations`,
      request
    );
  }

  /**
   * 관리자용 장소 수정
   */
  async updateAdminLocation(
    locationId: number,
    request: Partial<CreateLocationRequest> & { isActive?: boolean }
  ): Promise<LocationManagement> {
    return apiClient.put<
      LocationManagement,
      Partial<CreateLocationRequest> & { isActive?: boolean }
    >(`${this.adminApiUrl}/locations/${locationId}`, request);
  }

  /**
   * 관리자용 장소 삭제
   */
  async deleteAdminLocation(locationId: number): Promise<void> {
    return apiClient.delete<void>(`${this.adminApiUrl}/locations/${locationId}`);
  }
}

export const adminService = new AdminService();
