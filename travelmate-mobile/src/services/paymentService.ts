/**
 * Payment Service for TravelMate Mobile
 * Handles in-app purchases and subscriptions using Expo IAP
 */

import { Platform, Alert } from 'react-native';
import * as InAppPurchases from 'expo-in-app-purchases';
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

const STORAGE_KEYS = {
  SUBSCRIPTION_STATUS: '@travelmate:subscription',
  POINTS_BALANCE: '@travelmate:points',
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

      this.isInitialized = true;

      // Set up purchase listener
      this.setupPurchaseListener();

      // Load products
      await this.loadProducts();

      // Process any pending purchases
      await this.processPendingPurchases();

      return true;
    } catch (error) {
      console.error('IAP initialization failed:', error);
      return false;
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

      return [];
    } catch (error) {
      console.error('Failed to load products:', error);
      return [];
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
      const initialized = await this.initialize();
      if (!initialized) {
        Alert.alert('오류', '결제 시스템을 초기화할 수 없습니다.');
        return false;
      }
    }

    try {
      await InAppPurchases.purchaseItemAsync(productId);
      return true;
    } catch (error) {
      console.error('Purchase failed:', error);
      Alert.alert('구매 실패', '결제 중 오류가 발생했습니다. 다시 시도해주세요.');
      return false;
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
    try {
      const response = await apiClient.post<{ verified: boolean }>('/payments/verify', {
        productId: purchase.productId,
        transactionId: purchase.orderId,
        receipt: purchase.transactionReceipt,
        platform: Platform.OS,
      });

      return response.verified;
    } catch (error) {
      console.error('Server verification failed:', error);
      return false;
    }
  }

  /**
   * Process any pending purchases (e.g., from previous sessions)
   */
  async processPendingPurchases(): Promise<void> {
    try {
      const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();

      if (responseCode === InAppPurchases.IAPResponseCode.OK && results) {
        for (const purchase of results) {
          if (!purchase.acknowledged) {
            await this.handlePurchase(purchase);
          }
        }
      }
    } catch (error) {
      console.error('Failed to process pending purchases:', error);
    }
  }

  // ================== Subscription Management ==================

  /**
   * Get current subscription status
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      // Try to get from server first
      const status = await apiClient.get<SubscriptionStatus>('/payments/subscription/status');

      // Cache locally
      await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_STATUS, JSON.stringify(status));

      return status;
    } catch (error) {
      // Fall back to cached status
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
      await apiClient.post('/payments/subscription/cancel');
      await this.updateSubscriptionStatus();
      return true;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      return false;
    }
  }

  /**
   * Restore purchases (useful for iOS)
   */
  async restorePurchases(): Promise<boolean> {
    try {
      const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();

      if (responseCode === InAppPurchases.IAPResponseCode.OK && results) {
        // Verify each purchase on server
        for (const purchase of results) {
          await this.verifyPurchaseOnServer(purchase);
        }

        await this.updateSubscriptionStatus();
        await this.updatePointsBalance();

        Alert.alert('복원 완료', '구매 내역이 복원되었습니다.');
        return true;
      }

      Alert.alert('복원 실패', '복원할 구매 내역이 없습니다.');
      return false;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      Alert.alert('복원 실패', '구매 복원 중 오류가 발생했습니다.');
      return false;
    }
  }

  // ================== Points Management ==================

  /**
   * Get current points balance
   */
  async getPointsBalance(): Promise<PointsBalance> {
    try {
      const balance = await apiClient.get<PointsBalance>('/payments/points/balance');

      // Cache locally
      await AsyncStorage.setItem(STORAGE_KEYS.POINTS_BALANCE, JSON.stringify(balance));

      return balance;
    } catch (error) {
      // Fall back to cached balance
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
}

export const paymentService = new PaymentService();
export default paymentService;
