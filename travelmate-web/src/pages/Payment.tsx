/**
 * Payment Page
 * 결제 및 구독 관리 페이지
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  paymentService,
  PointProduct,
  SubscriptionProduct,
  SubscriptionInfo,
  PaymentHistory,
  Page,
} from '../services/paymentService';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

type TabType = 'points' | 'subscription' | 'history';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
};

const Payment: React.FC = () => {
  const navigate = useNavigate();
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

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'points', label: '포인트 충전', icon: '💰' },
    { id: 'subscription', label: '구독 관리', icon: '⭐' },
    { id: 'history', label: '결제 내역', icon: '📋' },
  ];

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
    } catch {
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

      alert(`결제 준비 완료\n주문번호: ${response.orderId}\n결제금액: ${paymentService.formatCurrency(response.finalAmount)}`);
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

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedProduct(null);
    setCouponCode('');
    setCouponResult(null);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] relative overflow-hidden pb-32">
      {/* Background Effects */}
      <div
        className="absolute top-20 left-10 w-72 h-72 bg-green-400/30 dark:bg-green-600/20 rounded-full blur-3xl"
        style={{ animation: 'blob 7s infinite' }}
      />
      <div
        className="absolute top-40 right-10 w-96 h-96 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl"
        style={{ animation: 'blob 7s infinite 2s' }}
      />
      <div
        className="absolute bottom-20 left-1/3 w-80 h-80 bg-violet-400/20 dark:bg-violet-600/10 rounded-full blur-3xl"
        style={{ animation: 'blob 7s infinite 4s' }}
      />

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
      `}</style>

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-r from-green-600 to-blue-600 text-white relative z-10"
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <span className="text-xl">←</span>
              </button>
              <Logo size="sm" />
            </div>
            <ThemeToggle />
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-4xl">💳</span>
            결제
          </h1>
          <p className="mt-2 text-green-100">포인트 충전 및 프리미엄 구독 관리</p>
        </div>
      </motion.header>

      {/* Tabs */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-green-600 dark:text-green-400 border-green-600 dark:border-green-400'
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
      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-green-200 dark:border-green-800 border-t-green-600 rounded-full animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* Points Tab */}
            {activeTab === 'points' && (
              <motion.div key="points" {...fadeInUp} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {pointProducts.map((product, index) => (
                  <motion.div
                    key={product.productId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedProduct(product)}
                    className={`relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-6 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-xl ${
                      selectedProduct?.productId === product.productId
                        ? 'border-green-500 ring-2 ring-green-200 dark:ring-green-800'
                        : 'border-gray-200/50 dark:border-gray-700/50 hover:border-green-300 dark:hover:border-green-600'
                    }`}
                  >
                    {product.isBestValue && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                        BEST VALUE
                      </div>
                    )}
                    {product.badge && (
                      <div className="absolute -top-2 -right-2 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
                        {product.badge}
                      </div>
                    )}

                    <div className="text-center">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{product.name}</h3>
                      <p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-3">
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
                          <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-full">
                            {product.discountPercent}% 할인
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Subscription Tab */}
            {activeTab === 'subscription' && (
              <motion.div key="subscription" {...fadeInUp}>
                {/* Current subscription info */}
                {subscriptionInfo && subscriptionInfo.tier !== 'FREE' && (
                  <div className="mb-8 p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl text-white shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-80">현재 구독</p>
                        <h3 className="text-2xl font-bold flex items-center gap-2">
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
                          className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors"
                        >
                          구독 취소
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Billing cycle toggle */}
                <div className="flex justify-center mb-8">
                  <div className="inline-flex items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-1.5 border border-gray-200/50 dark:border-gray-700/50">
                    <button
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        billingCycle === 'monthly'
                          ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      월간
                    </button>
                    <button
                      onClick={() => setBillingCycle('yearly')}
                      className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        billingCycle === 'yearly'
                          ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      연간 <span className="text-green-400 dark:text-green-300 ml-1">2개월 무료</span>
                    </button>
                  </div>
                </div>

                {/* Products */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {subscriptionProducts.map((product, index) => {
                    const monthlyEquivalent = billingCycle === 'yearly' ? product.yearlyPrice / 12 : product.monthlyPrice;
                    const savings = paymentService.calculateYearlySavings(product.monthlyPrice, product.yearlyPrice);

                    return (
                      <motion.div
                        key={product.productId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => setSelectedProduct(product)}
                        className={`relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-6 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-xl ${
                          selectedProduct?.productId === product.productId
                            ? 'border-green-500 ring-2 ring-green-200 dark:ring-green-800'
                            : product.isPopular
                              ? 'border-purple-400 dark:border-purple-500'
                              : 'border-gray-200/50 dark:border-gray-700/50 hover:border-green-300 dark:hover:border-green-600'
                        }`}
                      >
                        {product.isPopular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-purple-500 text-white text-xs font-bold rounded-full shadow-lg">
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
                              <p className="text-sm text-green-500 mt-1">
                                연 {paymentService.formatCurrency(savings)} 절약
                              </p>
                            )}
                          </div>

                          <ul className="mt-6 space-y-3 text-left">
                            {product.features.map((feature, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <span className="text-green-500">✓</span>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <motion.div key="history" {...fadeInUp}>
                {paymentHistory && paymentHistory.content.length > 0 ? (
                  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
                            <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">날짜</th>
                            <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">상품</th>
                            <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">금액</th>
                            <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">상태</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paymentHistory.content.map((item, index) => (
                            <motion.tr
                              key={item.orderId}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="border-b border-gray-100/50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                              <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                                {paymentService.formatDateTime(item.createdAt)}
                              </td>
                              <td className="py-4 px-6">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.productName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{item.orderId}</p>
                              </td>
                              <td className="py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">
                                {paymentService.formatCurrency(item.amount)}
                              </td>
                              <td className="py-4 px-6">
                                <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                                  item.status === 'COMPLETED'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                    : item.status === 'PENDING'
                                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                }`}>
                                  {paymentService.getPaymentStatusLabel(item.status)}
                                </span>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-12 border border-gray-200/50 dark:border-gray-700/50 text-center">
                    <span className="text-6xl mb-4 block">📋</span>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">결제 내역이 없습니다</h3>
                    <p className="text-gray-500 dark:text-gray-400">포인트를 충전하거나 구독을 시작해보세요!</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Purchase Panel */}
      <AnimatePresence>
        {selectedProduct && activeTab !== 'history' && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 shadow-2xl"
          >
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-col md:flex-row items-center gap-4 flex-1">
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
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
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
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
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
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
                  >
                    결제하기
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Payment;
