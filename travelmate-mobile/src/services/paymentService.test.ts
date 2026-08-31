import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const SUBSCRIPTION_STATUS_KEY = '@travelmate:subscription';
const POINTS_BALANCE_KEY = '@travelmate:points';

const mockStorage = new Map<string, string>();

const mockAsyncStorage = {
  getItem: jest.fn((key: string) => Promise.resolve(mockStorage.get(key) ?? null)),
  setItem: jest.fn((key: string, value: string) => {
    mockStorage.set(key, value);
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    mockStorage.delete(key);
    return Promise.resolve();
  }),
};

const mockApiClient = {
  get: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  post: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
};

const mockAlert = {
  alert: jest.fn(),
};

type MockIapPurchase = {
  productId: string;
  transactionId: string;
  transactionDate: number;
  transactionReceipt: string;
  purchaseState: number;
  acknowledged?: boolean;
};

type MockPurchaseHistoryResult = {
  responseCode: number;
  results: MockIapPurchase[];
};

const mockInAppPurchases = {
  IAPResponseCode: {
    OK: 0,
    USER_CANCELED: 1,
  },
  connectAsync: jest.fn(() => Promise.resolve()),
  disconnectAsync: jest.fn(() => Promise.resolve()),
  finishTransactionAsync: jest.fn(() => Promise.resolve()),
  getProductsAsync: jest.fn(() => Promise.resolve({ responseCode: 0, results: [] })),
  getPurchaseHistoryAsync: jest.fn<() => Promise<MockPurchaseHistoryResult>>(() =>
    Promise.resolve({ responseCode: 0, results: [] })
  ),
  purchaseItemAsync: jest.fn(() => Promise.resolve()),
  setPurchaseListener: jest.fn(),
};

const loadPaymentService = () => {
  jest.resetModules();
  jest.doMock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
  jest.doMock('../lib/iapShim', () => mockInAppPurchases);
  jest.doMock('react-native', () => ({
    Alert: mockAlert,
  }));
  jest.doMock('./apiClient', () => ({
    __esModule: true,
    apiClient: mockApiClient,
    default: mockApiClient,
  }));

  return require('./paymentService') as typeof import('./paymentService');
};

describe('mobile paymentService cached status handling', () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let consoleWarnSpy: jest.SpiedFunction<typeof console.warn>;

  beforeEach(() => {
    mockStorage.clear();
    mockAsyncStorage.getItem.mockClear();
    mockAsyncStorage.setItem.mockClear();
    mockAsyncStorage.removeItem.mockClear();
    mockApiClient.get.mockReset();
    mockApiClient.post.mockReset();
    Object.values(mockInAppPurchases).forEach(value => {
      if (typeof value === 'function' && 'mockClear' in value) {
        value.mockClear();
      }
    });
    mockAlert.alert.mockClear();
    mockInAppPurchases.connectAsync.mockResolvedValue(undefined);
    mockInAppPurchases.disconnectAsync.mockResolvedValue(undefined);
    mockInAppPurchases.finishTransactionAsync.mockResolvedValue(undefined);
    mockInAppPurchases.getProductsAsync.mockResolvedValue({ responseCode: 0, results: [] });
    mockInAppPurchases.getPurchaseHistoryAsync.mockResolvedValue({ responseCode: 0, results: [] });
    mockInAppPurchases.purchaseItemAsync.mockResolvedValue(undefined);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('caches subscription status returned by the backend', async () => {
    const { paymentService } = loadPaymentService();
    mockApiClient.get.mockResolvedValueOnce({
      tier: 'PREMIUM_YEARLY',
      status: 'ACTIVE',
      endDate: '2026-12-31T00:00:00Z',
      autoRenew: true,
    });

    const status = await paymentService.getSubscriptionStatus();

    expect(mockApiClient.get).toHaveBeenCalledWith('/payment/subscription');
    expect(status).toEqual({
      isActive: true,
      planId: 'PREMIUM_YEARLY',
      expiresAt: '2026-12-31T00:00:00Z',
      autoRenew: true,
    });
    expect(JSON.parse(mockStorage.get(SUBSCRIPTION_STATUS_KEY) || '{}')).toEqual(status);
  });

  it('uses cached subscription status when the backend is temporarily unavailable', async () => {
    const cached = {
      isActive: true,
      planId: 'PREMIUM_MONTHLY',
      expiresAt: '2026-08-31T00:00:00Z',
      autoRenew: false,
    };
    mockStorage.set(SUBSCRIPTION_STATUS_KEY, JSON.stringify(cached));
    const { paymentService } = loadPaymentService();
    mockApiClient.get.mockRejectedValueOnce({ response: { status: 503 }, message: 'down' });

    await expect(paymentService.getSubscriptionStatus()).resolves.toEqual(cached);
  });

  it('removes corrupted cached subscription status and exposes backend failures', async () => {
    mockStorage.set(SUBSCRIPTION_STATUS_KEY, '{not valid json');
    const { paymentService } = loadPaymentService();
    const error = { response: { status: 503 }, message: 'down' };
    mockApiClient.get.mockRejectedValueOnce(error);

    await expect(paymentService.getSubscriptionStatus()).rejects.toBe(error);

    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(SUBSCRIPTION_STATUS_KEY);
    expect(mockStorage.has(SUBSCRIPTION_STATUS_KEY)).toBe(false);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Failed to parse cached subscription status:',
      expect.any(SyntaxError)
    );
  });

  it('removes cached subscription status with invalid storage shape', async () => {
    mockStorage.set(
      SUBSCRIPTION_STATUS_KEY,
      JSON.stringify({
        isActive: 'yes',
        planId: 'PREMIUM_MONTHLY',
        expiresAt: '2026-08-31T00:00:00Z',
        autoRenew: false,
      })
    );
    const { paymentService } = loadPaymentService();
    const error = { response: { status: 503 }, message: 'down' };
    mockApiClient.get.mockRejectedValueOnce(error);

    await expect(paymentService.getSubscriptionStatus()).rejects.toBe(error);

    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(SUBSCRIPTION_STATUS_KEY);
    expect(mockStorage.has(SUBSCRIPTION_STATUS_KEY)).toBe(false);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Failed to parse cached subscription status:',
      expect.any(Error)
    );
  });

  it('throws subscription backend failures when no cache exists', async () => {
    const { paymentService } = loadPaymentService();
    const error = { response: { status: 503 }, message: 'down' };
    mockApiClient.get.mockRejectedValueOnce(error);

    await expect(paymentService.getSubscriptionStatus()).rejects.toBe(error);
  });

  it('returns inactive subscription status for a missing subscription record', async () => {
    const { paymentService } = loadPaymentService();
    mockApiClient.get.mockRejectedValueOnce({ response: { status: 404 }, message: 'missing' });

    await expect(paymentService.getSubscriptionStatus()).resolves.toEqual({
      isActive: false,
      planId: null,
      expiresAt: null,
      autoRenew: false,
    });
  });

  it('uses cached points when the points backend is temporarily unavailable', async () => {
    const cached = {
      available: 120,
      pending: 0,
      total: 120,
    };
    mockStorage.set(POINTS_BALANCE_KEY, JSON.stringify(cached));
    const { paymentService } = loadPaymentService();
    mockApiClient.get.mockRejectedValueOnce({ response: { status: 503 }, message: 'down' });

    await expect(paymentService.getPointsBalance()).resolves.toEqual(cached);
  });

  it('removes corrupted cached points and exposes backend failures', async () => {
    mockStorage.set(POINTS_BALANCE_KEY, '{not valid json');
    const { paymentService } = loadPaymentService();
    const error = { response: { status: 503 }, message: 'points down' };
    mockApiClient.get.mockRejectedValueOnce(error);

    await expect(paymentService.getPointsBalance()).rejects.toBe(error);

    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(POINTS_BALANCE_KEY);
    expect(mockStorage.has(POINTS_BALANCE_KEY)).toBe(false);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Failed to parse cached points balance:',
      expect.any(SyntaxError)
    );
  });

  it('removes cached points with invalid storage shape', async () => {
    mockStorage.set(
      POINTS_BALANCE_KEY,
      JSON.stringify({
        available: 120,
        pending: -1,
        total: 120,
      })
    );
    const { paymentService } = loadPaymentService();
    const error = { response: { status: 503 }, message: 'points down' };
    mockApiClient.get.mockRejectedValueOnce(error);

    await expect(paymentService.getPointsBalance()).rejects.toBe(error);

    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(POINTS_BALANCE_KEY);
    expect(mockStorage.has(POINTS_BALANCE_KEY)).toBe(false);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Failed to parse cached points balance:',
      expect.any(Error)
    );
  });

  it('throws points backend failures when no cache exists', async () => {
    const { paymentService } = loadPaymentService();
    const error = { response: { status: 500 }, message: 'points down' };
    mockApiClient.get.mockRejectedValueOnce(error);

    await expect(paymentService.getPointsBalance()).rejects.toBe(error);
  });

  it('throws product loading store response failures instead of returning an empty list', async () => {
    const { paymentService } = loadPaymentService();
    mockInAppPurchases.getProductsAsync.mockResolvedValueOnce({
      responseCode: 9,
      results: [],
    });

    await expect(paymentService.loadProducts()).rejects.toThrow(
      'Failed to load IAP products: response code 9'
    );
    expect(paymentService.getProducts()).toEqual([]);
  });

  it('propagates initialization failures and allows a later retry', async () => {
    const { paymentService } = loadPaymentService();
    mockInAppPurchases.getProductsAsync
      .mockResolvedValueOnce({
        responseCode: 9,
        results: [],
      })
      .mockResolvedValueOnce({
        responseCode: 0,
        results: [],
      });

    await expect(paymentService.initialize()).rejects.toThrow(
      'Failed to load IAP products: response code 9'
    );
    await expect(paymentService.initialize()).resolves.toBe(true);
    expect(mockInAppPurchases.connectAsync).toHaveBeenCalledTimes(2);
  });

  it('alerts and rejects when purchase initialization fails', async () => {
    const { paymentService, PRODUCT_IDS } = loadPaymentService();
    const error = new Error('store unavailable');
    mockInAppPurchases.connectAsync.mockRejectedValueOnce(error);

    await expect(paymentService.purchaseProduct(PRODUCT_IDS.PREMIUM_MONTHLY)).rejects.toBe(error);

    expect(mockAlert.alert).toHaveBeenCalledWith('오류', '결제 시스템을 초기화할 수 없습니다.');
    expect(mockInAppPurchases.purchaseItemAsync).not.toHaveBeenCalled();
  });

  it('throws subscription cancellation backend failures', async () => {
    const { paymentService } = loadPaymentService();
    const error = { response: { status: 503 }, message: 'cancel down' };
    mockApiClient.post.mockRejectedValueOnce(error);

    await expect(paymentService.cancelSubscription()).rejects.toBe(error);
  });

  it('throws purchase restore store response failures', async () => {
    const { paymentService } = loadPaymentService();
    mockInAppPurchases.getPurchaseHistoryAsync.mockResolvedValueOnce({
      responseCode: 8,
      results: [],
    });

    await expect(paymentService.restorePurchases()).rejects.toThrow(
      'Failed to restore purchases: response code 8'
    );
    expect(mockAlert.alert).toHaveBeenCalledWith(
      '복원 실패',
      '구매 복원 중 오류가 발생했습니다.'
    );
  });

  it('rejects purchase restore when the backend cannot verify the restored purchase', async () => {
    const { paymentService, PRODUCT_IDS } = loadPaymentService();
    mockInAppPurchases.getPurchaseHistoryAsync.mockResolvedValueOnce({
      responseCode: 0,
      results: [
        {
          productId: PRODUCT_IDS.PREMIUM_MONTHLY,
          transactionId: 'restore_tx_1',
          transactionDate: Date.now(),
          transactionReceipt: 'receipt',
          purchaseState: 1,
          acknowledged: false,
        },
      ],
    });

    await expect(paymentService.restorePurchases()).rejects.toThrow(
      `Failed to verify restored purchase: ${PRODUCT_IDS.PREMIUM_MONTHLY}`
    );

    expect(mockApiClient.get).not.toHaveBeenCalledWith('/payment/subscription');
    expect(mockApiClient.get).not.toHaveBeenCalledWith('/points/balance');
    expect(mockAlert.alert).toHaveBeenCalledWith(
      '복원 실패',
      '구매 복원 중 오류가 발생했습니다.'
    );
    expect(mockAlert.alert).not.toHaveBeenCalledWith('복원 완료', expect.any(String));
  });
});
