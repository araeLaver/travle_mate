import { apiClient } from './apiClient';
import {
  PaginatedResponse,
  PointBalanceResponse,
  PointTransactionResponse,
  PointTransferRequest,
  LeaderboardEntry,
  PointTransactionType,
} from '../types';

/**
 * 포인트 관련 API 서비스
 */
class PointService {
  /**
   * 포인트 잔액 조회
   */
  async getBalance(): Promise<PointBalanceResponse> {
    return apiClient.get('/points/balance');
  }

  /**
   * 포인트 거래 내역 조회
   */
  async getTransactions(
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedResponse<PointTransactionResponse>> {
    return apiClient.get(`/points/transactions?page=${page}&size=${size}`);
  }

  /**
   * 타입별 거래 내역 조회
   */
  async getTransactionsByType(
    type: PointTransactionType,
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedResponse<PointTransactionResponse>> {
    return apiClient.get(`/points/transactions/type/${type}?page=${page}&size=${size}`);
  }

  /**
   * 포인트 전송
   */
  async transferPoints(request: PointTransferRequest): Promise<void> {
    return apiClient.post('/points/transfer', request);
  }

  /**
   * 전체 리더보드 조회
   */
  async getLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    return apiClient.get(`/points/leaderboard?limit=${limit}`);
  }

  /**
   * 시즌 리더보드 조회
   */
  async getSeasonLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    return apiClient.get(`/points/leaderboard/season?limit=${limit}`);
  }

  /**
   * 내 랭킹 조회
   */
  async getMyRank(): Promise<number> {
    return apiClient.get('/points/my-rank');
  }
}

export const pointService = new PointService();
