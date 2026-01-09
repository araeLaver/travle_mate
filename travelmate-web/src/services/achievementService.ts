import { apiClient } from './apiClient';
import { AchievementResponse, AchievementStatsResponse, AchievementType } from '../types';

/**
 * 업적 관련 API 서비스
 */
class AchievementService {
  /**
   * 전체 업적 목록 조회
   */
  async getAllAchievements(): Promise<AchievementResponse[]> {
    return apiClient.get('/achievements');
  }

  /**
   * 타입별 업적 조회
   */
  async getAchievementsByType(type: AchievementType): Promise<AchievementResponse[]> {
    return apiClient.get(`/achievements/type/${type}`);
  }

  /**
   * 내 업적 현황 조회
   */
  async getMyAchievements(): Promise<AchievementResponse[]> {
    return apiClient.get('/achievements/my');
  }

  /**
   * 완료된 업적만 조회
   */
  async getCompletedAchievements(): Promise<AchievementResponse[]> {
    return apiClient.get('/achievements/completed');
  }

  /**
   * 업적 통계 조회
   */
  async getAchievementStats(): Promise<AchievementStatsResponse> {
    return apiClient.get('/achievements/stats');
  }
}

export const achievementService = new AchievementService();
