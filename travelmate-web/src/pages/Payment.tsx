/**
 * Payment Page
 * 결제 및 구독 관리 페이지
 */

import React, { useState, useEffect } from 'react';
import {
  paymentService,
  PointProduct,
  SubscriptionProduct,
  SubscriptionInfo,
  PaymentHistory,
  Page,
} from '../services/paymentService';

type TabType = 'points' | 'subscription' | 'history';

const Payment: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('points');
  const [pointProducts, setPointProducts] = useState<PointProduct[]>([]);
  const [subscriptionProducts, setSubscriptionProducts] = useState<SubscriptionProduct[]>([]);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Page<PaymentHistory> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<PointProduct | SubscriptionProduct | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState<{ discount: number; message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'points') {
        const products = await paymentService.getPointProducts();
        setPointProducts(products);
      } else if (activeTab === 'subscription') {
        const [products, info] = await Promise.all([
          paymentService.getSubscriptionProducts(),
          paymentService.getSubscriptionInfo(),
        ]);
        setSubscriptionProducts(products);
        setSubscriptionInfo(info);
      } else if (activeTab === 'history') {
        const history = await paymentService.getPaymentHistory();
        setPaymentHistory(history);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode || !selectedProduct) return;

    try {
      const price = 'points' in selectedProduct
        ? (selectedProduct as PointProduct).price
        : billingCycle === 'yearly'
          ? (selectedProduct as SubscriptionProduct).yearlyPrice
          : (selectedProduct as SubscriptionProduct).monthlyPrice;

      const result = await paymentService.applyCoupon(couponCode, price);
      setCouponResult({
        discount: result.discountAmount || 0,
        message: result.message,
      });
    } catch (error) {
      setCouponResult({ discount: 0, message: '쿠폰 적용에 실패했습니다.' });
    }
  };

  const handlePurchase = async () => {
    if (!selectedProduct) return;

    try {
      const isPointProduct = 'points' in selectedProduct;
      const response = await paymentService.preparePayment({
        productType: isPointProduct ? 'POINTS' : 'SUBSCRIPTION',
        productId: selectedProduct.productId,
        quantity: !isPointProduct && billingCycle === 'yearly' ? 12 : 1,
        couponCode: couponResult?.discount ? couponCode : undefined,
      });

      // 실제로는 Toss 결제창 연동
      // 여기서는 결제 준비 완료 알림
      alert(`결제 준비 완료\n주문번호: ${response.orderId}\n결제금액: ${paymentService.formatCurrency(response.finalAmount)}`);

      // 실제 환경에서는 Toss SDK 호출
      // window.TossPayments(response.clientKey).requestPayment(...);

    } catch (error) {
      console.error('Payment failed:', error);
      alert('결제 준비에 실패했습니다.');
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('구독을 취소하시겠습니까? 남은 기간까지는 계속 이용 가능합니다.')) return;

    try {
      const result = await paymentService.cancelSubscription('사용자 요청');
      setSubscriptionInfo(result);
      alert('구독이 취소되었습니다.');
    } catch (error) {
      console.error('Cancel failed:', error);
      alert('구독 취소에 실패했습니다.');
    }
  };

  const renderPointProducts = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {pointProducts.map(product => (
        <div
          key={product.productId}
          onClick={() => setSelectedProduct(product)}
          className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
            selectedProduct?.productId === product.productId
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
          }`}
        >
          {product.isBestValue && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full">
              BEST VALUE
            </div>
          )}
          {product.badge && (
            <div className="absolute -top-2 -right-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
              {product.badge}
            </div>
          )}

          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{product.name}</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
              {product.points.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">포인트</p>

            <div className="mt-4">
              {product.discountPercent > 0 && (
                <p className="text-sm text-gray-400 line-through">
                  {paymentService.formatCurrency(product.originalPrice)}
                </p>
              )}
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {paymentService.formatCurrency(product.price)}
              </p>
              {product.discountPercent > 0 && (
                <span className="text-xs text-red-500 font-bold">
                  {product.discountPercent}% 할인
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSubscriptionProducts = () => (
    <div>
      {/* Current subscription info */}
      {subscriptionInfo && subscriptionInfo.tier !== 'FREE' && (
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">현재 구독</p>
              <h3 className="text-2xl font-bold">
                {paymentService.getSubscriptionTierInfo(subscriptionInfo.tier).icon} {subscriptionInfo.tier}
              </h3>
              {subscriptionInfo.endDate && (
                <p className="text-sm mt-1">
                  {paymentService.getDaysRemaining(subscriptionInfo.endDate)}일 남음 ({paymentService.formatDate(subscriptionInfo.endDate)}까지)
                </p>
              )}
            </div>
            {subscriptionInfo.status === 'ACTIVE' && subscriptionInfo.autoRenew && (
              <button
                onClick={handleCancelSubscription}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
              >
                구독 취소
              </button>
            )}
          </div>
        </div>
      )}

      {/* Billing cycle toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            월간
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              billingCycle === 'yearly'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            연간 <span className="text-green-500 ml-1">2개월 무료</span>
          </button>
        </div>
      </div>

      {/* Products */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {subscriptionProducts.map(product => {
          const price = billingCycle === 'yearly' ? product.yearlyPrice : product.monthlyPrice;
          const monthlyEquivalent = billingCycle === 'yearly' ? product.yearlyPrice / 12 : product.monthlyPrice;
          const savings = paymentService.calculateYearlySavings(product.monthlyPrice, product.yearlyPrice);

          return (
            <div
              key={product.productId}
              onClick={() => setSelectedProduct(product)}
              className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                selectedProduct?.productId === product.productId
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : product.isPopular
                    ? 'border-purple-400 dark:border-purple-500'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
              }`}
            >
              {product.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">
                  POPULAR
                </div>
              )}

              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{product.name}</h3>

                <div className="mt-4">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {paymentService.formatCurrency(monthlyEquivalent)}
                    <span className="text-sm font-normal text-gray-500">/월</span>
                  </p>
                  {billingCycle === 'yearly' && (
                    <p className="text-sm text-green-500">
                      연 {paymentService.formatCurrency(savings)} 절약
                    </p>
                  )}
                </div>

                <ul className="mt-6 space-y-3 text-left">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderPaymentHistory = () => (
    <div>
      {paymentHistory && paymentHistory.content.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">날짜</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">상품</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">금액</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">상태</th>
              </tr>
            </thead>
            <tbody>
              {paymentHistory.content.map(item => (
                <tr key={item.orderId} className="border-b dark:border-gray-700/50">
                  <td className="py-4 px-4 text-sm text-gray-900 dark:text-white">
                    {paymentService.formatDateTime(item.createdAt)}
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.productName}</p>
                    <p className="text-xs text-gray-500">{item.orderId}</p>
                  </td>
                  <td className="py-4 px-4 text-sm font-medium text-gray-900 dark:text-white">
                    {paymentService.formatCurrency(item.amount)}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full bg-${paymentService.getPaymentStatusColor(item.status)}-100 text-${paymentService.getPaymentStatusColor(item.status)}-700`}>
                      {paymentService.getPaymentStatusLabel(item.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">결제 내역이 없습니다.</p>
        </div>
      )}
    </div>
  );

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'points', label: '포인트 충전', icon: '💰' },
    { id: 'subscription', label: '구독 관리', icon: '⭐' },
    { id: 'history', label: '결제 내역', icon: '📋' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-4xl">💳</span>
            결제
          </h1>
          <p className="mt-2 text-green-100">포인트 충전 및 프리미엄 구독 관리</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedProduct(null);
                  setCouponCode('');
                  setCouponResult(null);
                }}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'points' && renderPointProducts()}
            {activeTab === 'subscription' && renderSubscriptionProducts()}
            {activeTab === 'history' && renderPaymentHistory()}
          </>
        )}

        {/* Purchase Panel */}
        {selectedProduct && activeTab !== 'history' && (
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 shadow-lg p-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">선택한 상품</p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {'points' in selectedProduct
                      ? (selectedProduct as PointProduct).name
                      : (selectedProduct as SubscriptionProduct).name + ' (' + (billingCycle === 'yearly' ? '연간' : '월간') + ')'}
                  </p>
                </div>

                {/* Coupon input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="쿠폰 코드"
                    className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    적용
                  </button>
                </div>
                {couponResult && (
                  <p className={`text-sm ${couponResult.discount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {couponResult.message}
                    {couponResult.discount > 0 && ` (-${paymentService.formatCurrency(couponResult.discount)})`}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">결제 금액</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {paymentService.formatCurrency(
                      ('points' in selectedProduct
                        ? (selectedProduct as PointProduct).price
                        : billingCycle === 'yearly'
                          ? (selectedProduct as SubscriptionProduct).yearlyPrice
                          : (selectedProduct as SubscriptionProduct).monthlyPrice) -
                      (couponResult?.discount || 0)
                    )}
                  </p>
                </div>
                <button
                  onClick={handlePurchase}
                  className="px-8 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  결제하기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;
