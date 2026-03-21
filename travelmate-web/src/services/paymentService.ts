/**
 * Payment Service
 * 결제 시스템 API 서비스
 */

import { apiClient } from './apiClient';

// Types
export interface PaymentRequest {
  productType: 'POINTS' | 'SUBSCRIPTION' | 'NFT';
  productId: string;
  quantity?: number;
  paymentMethod?: string;
  couponCode?: string;
}

export interface PaymentPrepareResponse {
  orderId: string;
  orderName: string;
  amount: number;
  discountAmount: number;
  finalAmount: number;
  currency: string;
  pgProvider: string;
  clientKey: string;
  customerKey: string;
  successUrl: string;
  failUrl: string;
}

export interface PaymentConfirmRequest {
  orderId: string;
  paymentKey: string;
  amount: number;
}

export interface PaymentResult {
  orderId: string;
  paymentKey?: string;
  status: string;
  amount: number;
  productType?: string;
  productName?: string;
  paidAt?: string;
  receiptUrl?: string;
  message: string;
}

export interface PaymentHistory {
  orderId: string;
  paymentKey?: string;
  status: string;
  amount: number;
  productType: string;
  productName: string;
  paymentMethod?: string;
  createdAt: string;
  paidAt?: string;
}

export interface PointProduct {
  productId: string;
  name: string;
  points: number;
  price: number;
  originalPrice: number;
  discountPercent: number;
  isBestValue: boolean;
  badge?: string;
}

export interface SubscriptionProduct {
  productId: string;
  name: string;
  tier: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  isPopular: boolean;
}

export interface SubscriptionInfo {
  tier: string;
  status: string;
  startDate?: string;
  endDate?: string;
  nextBillingDate?: string;
  nextBillingAmount?: number;
  autoRenew?: boolean;
  activeFeatures: string[];
}

export interface RefundRequest {
  orderId: string;
  reason: string;
  refundAmount?: number;
}

export interface RefundResult {
  orderId: string;
  refundKey?: string;
  refundAmount: number;
  status: string;
  refundedAt?: string;
  message: string;
}

export interface CouponApplyResult {
  couponCode: string;
  couponName?: string;
  discountType?: string;
  discountValue?: number;
  discountAmount?: number;
  isValid: boolean;
  message: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// Subscription tier info
export const SUBSCRIPTION_TIERS: Record<string, { name: string; color: string; icon: string }> = {
  FREE: { name: '무료', color: 'gray', icon: '🌱' },
  BASIC: { name: 'Basic', color: 'blue', icon: '⭐' },
  PREMIUM: { name: 'Premium', color: 'purple', icon: '💎' },
  PRO: { name: 'Pro', color: 'gold', icon: '👑' },
};

// Payment status info
export const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: '대기 중', color: 'yellow' },
  READY: { label: '준비 완료', color: 'blue' },
  IN_PROGRESS: { label: '진행 중', color: 'blue' },
  COMPLETED: { label: '완료', color: 'green' },
  FAILED: { label: '실패', color: 'red' },
  CANCELLED: { label: '취소', color: 'gray' },
  PARTIAL_CANCELLED: { label: '부분 취소', color: 'orange' },
  REFUNDED: { label: '환불', color: 'purple' },
};

class PaymentService {
  /**
   * Get point products
   */
  async getPointProducts(): Promise<PointProduct[]> {
    return apiClient.get<PointProduct[]>('/payment/products/points');
  }

  /**
   * Get subscription products
   */
  async getSubscriptionProducts(): Promise<SubscriptionProduct[]> {
    return apiClient.get<SubscriptionProduct[]>('/payment/products/subscriptions');
  }

  /**
   * Prepare payment
   */
  async preparePayment(request: PaymentRequest): Promise<PaymentPrepareResponse> {
    return apiClient.post<PaymentPrepareResponse>('/payment/prepare', request);
  }

  /**
   * Confirm payment
   */
  async confirmPayment(request: PaymentConfirmRequest): Promise<PaymentResult> {
    return apiClient.post<PaymentResult>('/payment/confirm', request);
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(page: number = 0, size: number = 10): Promise<Page<PaymentHistory>> {
    return apiClient.get<Page<PaymentHistory>>(`/payment/history?page=${page}&size=${size}`);
  }

  /**
   * Request refund
   */
  async requestRefund(request: RefundRequest): Promise<RefundResult> {
    return apiClient.post<RefundResult>('/payment/refund', request);
  }

  /**
   * Apply coupon
   */
  async applyCoupon(couponCode: string, amount: number): Promise<CouponApplyResult> {
    return apiClient.get<CouponApplyResult>(
      `/payment/coupon/apply?couponCode=${couponCode}&amount=${amount}`
    );
  }

  /**
   * Get subscription info
   */
  async getSubscriptionInfo(): Promise<SubscriptionInfo> {
    return apiClient.get<SubscriptionInfo>('/payment/subscription');
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(reason?: string): Promise<SubscriptionInfo> {
    return apiClient.post<SubscriptionInfo>(
      `/payment/subscription/cancel?reason=${encodeURIComponent(reason || '사용자 요청')}`
    );
  }

  // Helper methods

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Get payment status label
   */
  getPaymentStatusLabel(status: string): string {
    return PAYMENT_STATUS[status]?.label || status;
  }

  /**
   * Get payment status color
   */
  getPaymentStatusColor(status: string): string {
    return PAYMENT_STATUS[status]?.color || 'gray';
  }

  /**
   * Get subscription tier info
   */
  getSubscriptionTierInfo(tier: string) {
    return SUBSCRIPTION_TIERS[tier] || SUBSCRIPTION_TIERS.FREE;
  }

  /**
   * Check if subscription is active
   */
  isSubscriptionActive(info: SubscriptionInfo): boolean {
    if (info.status !== 'ACTIVE') return false;
    if (!info.endDate) return false;
    return new Date(info.endDate) > new Date();
  }

  /**
   * Calculate savings for yearly subscription
   */
  calculateYearlySavings(monthlyPrice: number, yearlyPrice: number): number {
    const yearlyFromMonthly = monthlyPrice * 12;
    return yearlyFromMonthly - yearlyPrice;
  }

  /**
   * Calculate discount percent for yearly subscription
   */
  calculateYearlyDiscountPercent(monthlyPrice: number, yearlyPrice: number): number {
    const yearlyFromMonthly = monthlyPrice * 12;
    return Math.round((1 - yearlyPrice / yearlyFromMonthly) * 100);
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Format datetime
   */
  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Get days remaining until date
   */
  getDaysRemaining(endDateString: string): number {
    const endDate = new Date(endDateString);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

export const paymentService = new PaymentService();
export default paymentService;
