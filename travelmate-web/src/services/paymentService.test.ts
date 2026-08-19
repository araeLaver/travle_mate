import { paymentService } from './paymentService';
import { apiClient } from './apiClient';

jest.mock('./apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads point and subscription products from backend product endpoints', async () => {
    mockApiClient.get.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    await paymentService.getPointProducts();
    await paymentService.getSubscriptionProducts();

    expect(mockApiClient.get).toHaveBeenNthCalledWith(1, '/payment/products/points');
    expect(mockApiClient.get).toHaveBeenNthCalledWith(2, '/payment/products/subscriptions');
  });

  it('prepares and confirms payments with backend request bodies', async () => {
    const prepareRequest = {
      productType: 'POINTS' as const,
      productId: 'points-1000',
      quantity: 1,
      paymentMethod: 'CARD',
    };
    const confirmRequest = {
      orderId: 'order-1',
      paymentKey: 'pay-key',
      amount: 10000,
    };
    mockApiClient.post.mockResolvedValueOnce({ orderId: 'order-1' }).mockResolvedValueOnce({
      orderId: 'order-1',
      status: 'COMPLETED',
      amount: 10000,
      message: 'ok',
    });

    await paymentService.preparePayment(prepareRequest);
    await paymentService.confirmPayment(confirmRequest);

    expect(mockApiClient.post).toHaveBeenNthCalledWith(1, '/payment/prepare', prepareRequest);
    expect(mockApiClient.post).toHaveBeenNthCalledWith(2, '/payment/confirm', confirmRequest);
  });

  it('loads paginated payment history', async () => {
    const response = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 2,
      size: 15,
    };
    mockApiClient.get.mockResolvedValueOnce(response);

    const result = await paymentService.getPaymentHistory(2, 15);

    expect(mockApiClient.get).toHaveBeenCalledWith('/payment/history?page=2&size=15');
    expect(result).toBe(response);
  });

  it('encodes coupon codes when applying coupons', async () => {
    const response = {
      couponCode: 'SUMMER SALE/20',
      discountAmount: 2000,
      isValid: true,
      message: 'ok',
    };
    mockApiClient.get.mockResolvedValueOnce(response);

    const result = await paymentService.applyCoupon('SUMMER SALE/20', 15000);

    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/payment/coupon/apply?couponCode=SUMMER%20SALE%2F20&amount=15000'
    );
    expect(result).toBe(response);
  });

  it('cancels subscriptions with an encoded reason query param', async () => {
    const response = {
      tier: 'PREMIUM',
      status: 'CANCELLED',
      activeFeatures: [],
    };
    mockApiClient.post.mockResolvedValueOnce(response);

    const result = await paymentService.cancelSubscription('too expensive / switching');

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/payment/subscription/cancel?reason=too%20expensive%20%2F%20switching'
    );
    expect(result).toBe(response);
  });

  it('keeps helper calculations stable', () => {
    expect(paymentService.calculateYearlySavings(10000, 99000)).toBe(21000);
    expect(paymentService.calculateYearlyDiscountPercent(10000, 99000)).toBe(18);
    expect(paymentService.getPaymentStatusLabel('COMPLETED')).toBe('완료');
    expect(paymentService.getPaymentStatusColor('UNKNOWN')).toBe('gray');
  });
});
