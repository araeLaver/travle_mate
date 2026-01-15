import { apiClient } from './apiClient';
import { Notification, PaginatedResponse } from '../types';

class NotificationService {
  private readonly baseUrl = '/notifications';

  /**
   * 알림 목록 조회 (페이징)
   */
  async getNotifications(page: number = 0, size: number = 20): Promise<PaginatedResponse<Notification>> {
    return apiClient.get<PaginatedResponse<Notification>>(
      `${this.baseUrl}?page=${page}&size=${size}`
    );
  }

  /**
   * 읽지 않은 알림 조회
   */
  async getUnreadNotifications(): Promise<Notification[]> {
    return apiClient.get<Notification[]>(`${this.baseUrl}/unread`);
  }

  /**
   * 읽지 않은 알림 개수 조회
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{ count: number }>(`${this.baseUrl}/unread/count`);
    return response.count;
  }

  /**
   * 특정 알림 읽음 처리
   */
  async markAsRead(notificationIds: number[]): Promise<void> {
    return apiClient.post<void, number[]>(`${this.baseUrl}/read`, notificationIds);
  }

  /**
   * 모든 알림 읽음 처리
   */
  async markAllAsRead(): Promise<void> {
    return apiClient.post<void>(`${this.baseUrl}/read/all`);
  }

  /**
   * 알림 삭제
   */
  async deleteNotification(id: number): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/${id}`);
  }
}

export const notificationService = new NotificationService();
