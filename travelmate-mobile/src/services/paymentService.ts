/**
 * Payment Service for TravelMate Mobile
 * Handles in-app purchases and subscriptions using Expo IAP
 */

import { Alert } from 'react-native';
// expo-in-app-purchases is deprecated (fails to compile on SDK 52);
// shim reports IAP unavailable until a maintained IAP lib replaces it.
import * as InAppPurchases from '../lib/iapShim';
import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Product IDs - these should match App Store Connect / Google Play Console
export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'fryndo.premium.monthly',
  PREMIUM_YEARLY: 'fryndo.premium.yearly',
  POINTS_SMALL: 'fryndo.points.small',
  POINTS_MEDIUM: 'fryndo.points.medium',
  POINTS_LARGE: 'fryndo.points.large',
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

interface BackendSubscriptionInfo {
  tier?: string;
  status?: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  endDate?: string;
  autoRenew?: boolean;
}

interface BackendPointBalance {
  totalPoints: number;
  lifetimeEarned?: number;
  lifetimeSpent?: number;
}

const STORAGE_KEYS = {
  SUBSCRIPTION_STATUS: '@travelmate:subscription',
  POINTS_BALANCE: '@travelmate:points',
};

const DEFAULT_SUBSCRIPTION_STATUS: SubscriptionStatus = {
  isActive: false,
  planId: null,
  expiresAt: null,
  autoRenew: false,
};

const DEFAULT_POINTS_BALANCE: PointsBalance = {
  available: 0,
  pending: 0,
  total: 0,
};

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

const isNonNegativeFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

const isSubscriptionStatus = (value: unknown): value is SubscriptionStatus => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const status = value as Record<keyof SubscriptionStatus, unknown>;
  return (
    typeof status.isActive === 'boolean' &&
    isNullableString(status.planId) &&
    isNullableString(status.expiresAt) &&
    typeof status.autoRenew === 'boolean'
  );
};

const isPointsBalance = (value: unknown): value is PointsBalance => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const balance = value as Record<keyof PointsBalance, unknown>;
  return (
    isNonNegativeFiniteNumber(balance.available) &&
    isNonNegativeFiniteNumber(balance.pending) &&
    isNonNegativeFiniteNumber(balance.total)
  );
};

const getErrorStatus = (error: unknown): number | undefined => {
  if (!error || typeof error !== 'object') return undefined;

  const status =
    'status' in error
      ? (error as { status?: unknown }).status
      : (error as { response?: { status?: unknown } }).response?.status;
  const numericStatus = Number(status);

  return Number.isFinite(numericStatus) ? numericStatus : undefined;
};

class PaymentService {
  private isInitialized = false;
  private products: Map<string, Product> = new Map();
  private purchaseListenerActive = false;

  /**
   * Initialize in-app purchases
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Connect to the store
      await InAppPurchases.connectAsync();

      // Set up purchase listener
      this.setupPurchaseListener();

      // Load products
      await this.loadProducts();

      // Process any pending purchases
      await this.processPendingPurchases();

      this.isInitialized = true;
      return true;
    } catch (error) {
      this.isInitialized = false;
      console.error('IAP initialization failed:', error);
      throw error;
    }
  }

  /**
   * Set up listener for purchase updates
   */
  private setupPurchaseListener(): void {
    if (this.purchaseListenerActive) return;

    InAppPurchases.setPurchaseListener(async ({ responseCode, results, errorCode }) => {
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        for (const purchase of results || []) {
          await this.handlePurchase(purchase);
        }
      } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
        console.log('User cancelled the purchase');
      } else {
        console.error('Purchase error:', errorCode);
      }
    });

    this.purchaseListenerActive = true;
  }

  /**
   * Load available products from the store
   */
  async loadProducts(): Promise<Product[]> {
    try {
      const productIds = Object.values(PRODUCT_IDS);
      const { responseCode, results } = await InAppPurchases.getProductsAsync(productIds);

      if (responseCode === InAppPurchases.IAPResponseCode.OK && results) {
        this.products.clear();
        const products: Product[] = [];

        for (const result of results) {
          const product: Product = {
            productId: result.productId,
            title: result.title,
            description: result.description,
            price: result.price,
            priceAmountMicros: result.priceAmountMicros,
            priceCurrencyCode: result.priceCurrencyCode,
            type: this.getProductType(result.productId),
          };

          this.products.set(result.productId, product);
          products.push(product);
        }

        return products;
      }

      throw new Error(`Failed to load IAP products: response code ${responseCode}`);
    } catch (error) {
      console.error('Failed to load products:', error);
      throw error;
    }
  }

  /**
   * Get product type based on product ID
   */
  private getProductType(productId: string): Product['type'] {
    if (productId.includes('premium')) return 'subscription';
    if (productId.includes('points')) return 'consumable';
    return 'non-consumable';
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
   * Purchase a product
   */
  async purchaseProduct(productId: ProductId): Promise<boolean> {
    if (!this.isInitialized) {
      try {
        await this.initialize();
      } catch (error) {
        Alert.alert('오류', '결제 시스템을 초기화할 수 없습니다.');
        throw error;
      }
    }

    try {
      await InAppPurchases.purchaseItemAsync(productId);
      return true;
    } catch (error) {
      console.error('Purchase failed:', error);
      Alert.alert('구매 실패', '결제 중 오류가 발생했습니다. 다시 시도해주세요.');
      throw error;
    }
  }

  /**
   * Handle completed purchase
   */
  private async handlePurchase(purchase: InAppPurchases.InAppPurchase): Promise<void> {
    try {
      // Verify purchase on server
      const verified = await this.verifyPurchaseOnServer(purchase);

      if (verified) {
        // Acknowledge/finish the purchase
        if (!purchase.acknowledged) {
          await InAppPurchases.finishTransactionAsync(purchase, true);
        }

        // Update local state based on product type
        const productType = this.getProductType(purchase.productId);

        if (productType === 'subscription') {
          await this.updateSubscriptionStatus();
        } else if (productType === 'consumable') {
          await this.updatePointsBalance();
        }

        Alert.alert('구매 완료', '구매가 성공적으로 완료되었습니다!');
      }
    } catch (error) {
      console.error('Failed to handle purchase:', error);
    }
  }

  /**
   * Verify purchase on server
   */
  private async verifyPurchaseOnServer(purchase: InAppPurchases.InAppPurchase): Promise<boolean> {
    console.warn(
      `IAP receipt verification is not supported by the current backend payment API: ${purchase.productId}`
    );
    return false;
  }

  /**
   * Process any pending purchases (e.g., from previous sessions)
   */
  async processPendingPurchases(): Promise<void> {
    try {
      const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();

      if (responseCode !== InAppPurchases.IAPResponseCode.OK) {
        throw new Error(`Failed to process pending purchases: response code ${responseCode}`);
      }

      for (const purchase of results || []) {
        if (!purchase.acknowledged) {
          await this.handlePurchase(purchase);
        }
      }
    } catch (error) {
      console.error('Failed to process pending purchases:', error);
      throw error;
    }
  }

  // ================== Subscription Management ==================

  /**
   * Get current subscription status
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      // Try to get from server first
      const backendStatus = await apiClient.get<BackendSubscriptionInfo>('/payment/subscription');
      const status = this.toSubscriptionStatus(backendStatus);

      // Cache locally
      await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_STATUS, JSON.stringify(status));

      return status;
    } catch (error) {
      // Fall back to cached status
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_STATUS);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as unknown;
          if (!isSubscriptionStatus(parsed)) {
            throw new Error('Cached subscription status shape is invalid');
          }
          return parsed;
        } catch (cacheError) {
          console.warn('Failed to parse cached subscription status:', cacheError);
          await AsyncStorage.removeItem(STORAGE_KEYS.SUBSCRIPTION_STATUS);
        }
      }

      if (getErrorStatus(error) === 404) {
        return DEFAULT_SUBSCRIPTION_STATUS;
      }

      console.error('Failed to fetch subscription status:', error);
      throw error;
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
      return true;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  /**
   * Restore purchases (useful for iOS)
   */
  async restorePurchases(): Promise<boolean> {
    try {
      const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();

      if (responseCode !== InAppPurchases.IAPResponseCode.OK) {
        throw new Error(`Failed to restore purchases: response code ${responseCode}`);
      }

      if (!results || results.length === 0) {
        Alert.alert('복원 실패', '복원할 구매 내역이 없습니다.');
        return false;
      }

      // Verify each purchase on server
      for (const purchase of results) {
        const verified = await this.verifyPurchaseOnServer(purchase);
        if (!verified) {
          throw new Error(`Failed to verify restored purchase: ${purchase.productId}`);
        }
      }

      await this.updateSubscriptionStatus();
      await this.updatePointsBalance();

      Alert.alert('복원 완료', '구매 내역이 복원되었습니다.');
      return true;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      Alert.alert('복원 실패', '구매 복원 중 오류가 발생했습니다.');
      throw error;
    }
  }

  // ================== Points Management ==================

  /**
   * Get current points balance
   */
  async getPointsBalance(): Promise<PointsBalance> {
    try {
      const backendBalance = await apiClient.get<BackendPointBalance>('/points/balance');
      const balance = this.toPointsBalance(backendBalance);

      // Cache locally
      await AsyncStorage.setItem(STORAGE_KEYS.POINTS_BALANCE, JSON.stringify(balance));

      return balance;
    } catch (error) {
      // Fall back to cached balance
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.POINTS_BALANCE);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as unknown;
          if (!isPointsBalance(parsed)) {
            throw new Error('Cached points balance shape is invalid');
          }
          return parsed;
        } catch (cacheError) {
          console.warn('Failed to parse cached points balance:', cacheError);
          await AsyncStorage.removeItem(STORAGE_KEYS.POINTS_BALANCE);
        }
      }

      if (getErrorStatus(error) === 404) {
        return DEFAULT_POINTS_BALANCE;
      }

      console.error('Failed to fetch points balance:', error);
      throw error;
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

  // ================== Cleanup ==================

  /**
   * Disconnect from the store
   */
  async disconnect(): Promise<void> {
    if (this.isInitialized) {
      await InAppPurchases.disconnectAsync();
      this.isInitialized = false;
      this.purchaseListenerActive = false;
      this.products.clear();
    }
  }

  private toSubscriptionStatus(status: BackendSubscriptionInfo): SubscriptionStatus {
    return {
      isActive: status.status === 'ACTIVE',
      planId: status.tier || null,
      expiresAt: status.endDate || null,
      autoRenew: status.autoRenew || false,
    };
  }

  private toPointsBalance(balance: BackendPointBalance): PointsBalance {
    return {
      available: balance.totalPoints || 0,
      pending: 0,
      total: balance.totalPoints || 0,
    };
  }
}

export const paymentService = new PaymentService();
export default paymentService;
