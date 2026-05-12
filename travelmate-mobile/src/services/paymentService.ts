/**
 * Payment Service for TravelMate Mobile
 * In-app purchases deferred to v2 — currently provides server-side subscription/points API only.
 */

import { Alert } from 'react-native';
import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Product IDs - these should match App Store Connect / Google Play Console
export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'travelmate.premium.monthly',
  PREMIUM_YEARLY: 'travelmate.premium.yearly',
  POINTS_SMALL: 'travelmate.points.small',
  POINTS_MEDIUM: 'travelmate.points.medium',
  POINTS_LARGE: 'travelmate.points.large',
} as const;

export type ProductId = (typeof PRODUCT_IDS)[keyof typeof PRODUCT_IDS];

// Types
export interface Product {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
  type: 'subscription' | 'consumable' | 'non-consumable';
}

export interface Purchase {
  productId: string;
  transactionId: string;
  transactionDate: number;
  transactionReceipt: string;
  purchaseState: number;
}

export interface SubscriptionStatus {
  isActive: boolean;
  planId: string | null;
  expiresAt: string | null;
  autoRenew: boolean;
}

export interface PointsBalance {
  available: number;
  pending: number;
  total: number;
}

interface ApiSubscriptionInfo {
  tier: string | null;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | string | null;
  endDate: string | null;
  nextBillingDate: string | null;
  autoRenew: boolean | null;
}

interface ApiPointBalance {
  totalPoints?: number | null;
  lifetimeEarned?: number | null;
  seasonPoints?: number | null;
}

const STORAGE_KEYS = {
  SUBSCRIPTION_STATUS: '@travelmate:subscription',
  POINTS_BALANCE: '@travelmate:points',
};

class PaymentService {
  private isInitialized = false;
  private products: Map<string, Product> = new Map();

  /**
   * Initialize payment service (IAP deferred to v2)
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    this.isInitialized = true;
    console.log('[PaymentService] Initialized (IAP deferred to v2)');
    return true;
  }

  /**
   * Load available products — returns empty until IAP is integrated
   */
  async loadProducts(): Promise<Product[]> {
    return [];
  }

  /**
   * Get all loaded products
   */
  getProducts(): Product[] {
    return Array.from(this.products.values());
  }

  /**
   * Get a specific product
   */
  getProduct(productId: ProductId): Product | undefined {
    return this.products.get(productId);
  }

  /**
   * Purchase a product — not available until IAP is integrated
   */
  async purchaseProduct(productId: ProductId): Promise<boolean> {
    Alert.alert('준비 중', '인앱 결제 기능은 곧 제공될 예정입니다.');
    return false;
  }

  /**
   * Process any pending purchases
   */
  async processPendingPurchases(): Promise<void> {
    // No-op until IAP is integrated
  }

  // ================== Subscription Management ==================

  /**
   * Get current subscription status
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const info = await apiClient.get<ApiSubscriptionInfo>('/payment/subscription');
      const status = this.mapSubscriptionInfo(info);
      await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_STATUS, JSON.stringify(status));
      return status;
    } catch (error) {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_STATUS);
      if (cached) {
        return JSON.parse(cached);
      }
      return {
        isActive: false,
        planId: null,
        expiresAt: null,
        autoRenew: false,
      };
    }
  }

  /**
   * Update subscription status from server
   */
  async updateSubscriptionStatus(): Promise<SubscriptionStatus> {
    return this.getSubscriptionStatus();
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(): Promise<boolean> {
    try {
      await apiClient.post('/payment/subscription/cancel');
      await this.updateSubscriptionStatus();
      return true;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      return false;
    }
  }

  /**
   * Restore purchases — not available until IAP is integrated
   */
  async restorePurchases(): Promise<boolean> {
    Alert.alert('준비 중', '구매 복원 기능은 곧 제공될 예정입니다.');
    return false;
  }

  // ================== Points Management ==================

  /**
   * Get current points balance
   */
  async getPointsBalance(): Promise<PointsBalance> {
    try {
      const apiBalance = await apiClient.get<ApiPointBalance>('/points/balance');
      const balance = this.mapPointsBalance(apiBalance);
      await AsyncStorage.setItem(STORAGE_KEYS.POINTS_BALANCE, JSON.stringify(balance));
      return balance;
    } catch (error) {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.POINTS_BALANCE);
      if (cached) {
        return JSON.parse(cached);
      }
      return {
        available: 0,
        pending: 0,
        total: 0,
      };
    }
  }

  /**
   * Update points balance from server
   */
  async updatePointsBalance(): Promise<PointsBalance> {
    return this.getPointsBalance();
  }

  // ================== Premium Features ==================

  /**
   * Check if user has premium access
   */
  async hasPremiumAccess(): Promise<boolean> {
    const status = await this.getSubscriptionStatus();
    return status.isActive;
  }

  /**
   * Get premium feature list
   */
  getPremiumFeatures(): { id: string; title: string; description: string; icon: string }[] {
    return [
      {
        id: 'unlimited_collections',
        title: '무제한 컬렉션',
        description: '수집할 수 있는 NFT 개수 제한 없음',
        icon: '🎨',
      },
      {
        id: 'ad_free',
        title: '광고 없음',
        description: '모든 광고 제거',
        icon: '🚫',
      },
      {
        id: 'exclusive_locations',
        title: '프리미엄 장소',
        description: '특별한 레어 장소 접근 가능',
        icon: '⭐',
      },
      {
        id: 'priority_minting',
        title: '우선 민팅',
        description: 'NFT 민팅 대기열 우선 처리',
        icon: '⚡',
      },
      {
        id: 'detailed_analytics',
        title: '상세 분석',
        description: '여행 패턴 및 통계 분석',
        icon: '📊',
      },
      {
        id: 'profile_badge',
        title: '프리미엄 뱃지',
        description: '프로필에 특별 뱃지 표시',
        icon: '👑',
      },
    ];
  }

  private mapSubscriptionInfo(info: ApiSubscriptionInfo): SubscriptionStatus {
    const expiresAt = info.endDate ?? info.nextBillingDate ?? null;
    const expiresInFuture = expiresAt ? new Date(expiresAt).getTime() > Date.now() : false;
    const status = info.status ?? 'EXPIRED';

    return {
      isActive: status === 'ACTIVE' || (status === 'CANCELLED' && expiresInFuture),
      planId: info.tier ? info.tier.toLowerCase() : null,
      expiresAt,
      autoRenew: Boolean(info.autoRenew),
    };
  }

  private mapPointsBalance(balance: ApiPointBalance): PointsBalance {
    const total = balance.totalPoints ?? 0;

    return {
      available: total,
      pending: 0,
      total,
    };
  }

  // ================== Cleanup ==================

  /**
   * Disconnect from the store
   */
  async disconnect(): Promise<void> {
    this.isInitialized = false;
    this.products.clear();
  }
}

export const paymentService = new PaymentService();
export default paymentService;
