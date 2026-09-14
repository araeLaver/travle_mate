/**
 * In-app purchase shim.
 *
 * expo-in-app-purchases is deprecated and does not compile against
 * Expo SDK 52 / RN 0.76, and store products cannot exist until the
 * App Store / Play Console accounts are set up. This shim keeps
 * paymentService's flow intact while reporting IAP as unavailable;
 * swap it for react-native-iap (or RevenueCat) when store billing
 * goes live.
 */

export enum IAPResponseCode {
  OK = 0,
  USER_CANCELED = 1,
  ERROR = 2,
  DEFERRED = 3,
}

export interface IAPItemDetails {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
  subscriptionPeriod?: string;
}

export interface InAppPurchase {
  productId: string;
  transactionId?: string;
  orderId?: string;
  purchaseTime: number;
  purchaseState: number;
  purchaseToken?: string;
  transactionReceipt?: string;
  acknowledged?: boolean;
}

export interface IAPQueryResponse<T> {
  responseCode: IAPResponseCode;
  results?: T[];
  errorCode?: number;
}

type PurchaseListener = (result: IAPQueryResponse<InAppPurchase>) => void;

export const connectAsync = async (): Promise<void> => {
  // No store connection in beta; treated as connected so callers proceed
  // to server-driven subscription/point queries.
};

export const disconnectAsync = async (): Promise<void> => {};

export const setPurchaseListener = (_listener: PurchaseListener): void => {};

export const getProductsAsync = async (
  _productIds: string[]
): Promise<IAPQueryResponse<IAPItemDetails>> => ({
  responseCode: IAPResponseCode.OK,
  results: [],
});

export const purchaseItemAsync = async (_productId: string): Promise<void> => {
  throw new Error('IAP_UNAVAILABLE: 앱 내 결제는 정식 출시 후 지원됩니다.');
};

export const finishTransactionAsync = async (
  _purchase: InAppPurchase,
  _consumeItem: boolean
): Promise<void> => {};

export const getPurchaseHistoryAsync = async (): Promise<
  IAPQueryResponse<InAppPurchase>
> => ({
  responseCode: IAPResponseCode.OK,
  results: [],
});
