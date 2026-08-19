/**
 * Premium Screen for TravelMate Mobile
 * Displays premium features and subscription options
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  paymentService,
  Product,
  SubscriptionStatus,
  PRODUCT_IDS,
} from '../services/paymentService';

type PremiumScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Premium'>;

interface Props {
  navigation: PremiumScreenNavigationProp;
}

const PremiumScreen: React.FC<Props> = ({ navigation }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>(PRODUCT_IDS.PREMIUM_YEARLY);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await paymentService.initialize();
      const [loadedProducts, status] = await Promise.all([
        paymentService.loadProducts(),
        paymentService.getSubscriptionStatus(),
      ]);

      setProducts(loadedProducts);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Failed to load premium data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePurchase = async () => {
    if (isPurchasing) return;

    setIsPurchasing(true);
    try {
      const success = await paymentService.purchaseProduct(selectedPlan as any);
      if (success) {
        // Refresh subscription status
        const status = await paymentService.getSubscriptionStatus();
        setSubscriptionStatus(status);
      }
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    try {
      await paymentService.restorePurchases();
      const status = await paymentService.getSubscriptionStatus();
      setSubscriptionStatus(status);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      '구독 취소',
      '정말로 구독을 취소하시겠습니까? 현재 구독 기간이 끝날 때까지 프리미엄 기능을 계속 이용할 수 있습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '구독 취소',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await paymentService.cancelSubscription();
              if (success) {
                Alert.alert('구독 취소 완료', '구독이 취소되었습니다.');
                const status = await paymentService.getSubscriptionStatus();
                setSubscriptionStatus(status);
              }
            } catch (error) {
              console.error('Failed to cancel subscription:', error);
              Alert.alert('구독 취소 실패', '구독 취소 중 오류가 발생했습니다. 다시 시도해주세요.');
            }
          },
        },
      ]
    );
  };

  const premiumFeatures = paymentService.getPremiumFeatures();

  const getSubscriptionProduct = (productId: string): Product | undefined => {
    return products.find(p => p.productId === productId);
  };

  const monthlyProduct = getSubscriptionProduct(PRODUCT_IDS.PREMIUM_MONTHLY);
  const yearlyProduct = getSubscriptionProduct(PRODUCT_IDS.PREMIUM_YEARLY);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // Show current subscription status if subscribed
  if (subscriptionStatus?.isActive) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.activeSubscriptionContainer}>
          <Text style={styles.crownIcon}>👑</Text>
          <Text style={styles.activeTitle}>프리미엄 회원</Text>
          <Text style={styles.activeSubtitle}>
            모든 프리미엄 기능을 이용하고 계십니다
          </Text>

          <View style={styles.subscriptionDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>구독 플랜</Text>
              <Text style={styles.detailValue}>
                {subscriptionStatus.planId?.includes('yearly') ? '연간' : '월간'} 구독
              </Text>
            </View>
            {subscriptionStatus.expiresAt && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>다음 결제일</Text>
                <Text style={styles.detailValue}>
                  {new Date(subscriptionStatus.expiresAt).toLocaleDateString('ko-KR')}
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>자동 갱신</Text>
              <Text style={styles.detailValue}>
                {subscriptionStatus.autoRenew ? '활성화' : '비활성화'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelSubscription}
          >
            <Text style={styles.cancelButtonText}>구독 취소</Text>
          </TouchableOpacity>
        </View>

        {/* Features List */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>이용 가능한 기능</Text>
          {premiumFeatures.map(feature => (
            <View key={feature.id} style={styles.featureItem}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroIcon}>👑</Text>
        <Text style={styles.heroTitle}>Fryndo Premium</Text>
        <Text style={styles.heroSubtitle}>
          프리미엄 기능으로 여행을 더욱 특별하게
        </Text>
      </View>

      {/* Features List */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>프리미엄 혜택</Text>
        {premiumFeatures.map(feature => (
          <View key={feature.id} style={styles.featureItem}>
            <Text style={styles.featureIcon}>{feature.icon}</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Plan Selection */}
      <View style={styles.plansSection}>
        <Text style={styles.sectionTitle}>구독 플랜 선택</Text>

        {/* Yearly Plan */}
        {yearlyProduct && (
          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === PRODUCT_IDS.PREMIUM_YEARLY && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan(PRODUCT_IDS.PREMIUM_YEARLY)}
          >
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>추천</Text>
            </View>
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>연간 구독</Text>
              <Text style={styles.planSavings}>2개월 무료!</Text>
            </View>
            <Text style={styles.planPrice}>{yearlyProduct.price}/년</Text>
            <Text style={styles.planPriceDetail}>
              월 {Math.round(yearlyProduct.priceAmountMicros / 12 / 10000)}원
            </Text>
            {selectedPlan === PRODUCT_IDS.PREMIUM_YEARLY && (
              <View style={styles.selectedIndicator}>
                <Text style={styles.selectedIndicatorText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Monthly Plan */}
        {monthlyProduct && (
          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === PRODUCT_IDS.PREMIUM_MONTHLY && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan(PRODUCT_IDS.PREMIUM_MONTHLY)}
          >
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>월간 구독</Text>
            </View>
            <Text style={styles.planPrice}>{monthlyProduct.price}/월</Text>
            <Text style={styles.planPriceDetail}>언제든 취소 가능</Text>
            {selectedPlan === PRODUCT_IDS.PREMIUM_MONTHLY && (
              <View style={styles.selectedIndicator}>
                <Text style={styles.selectedIndicatorText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Purchase Button */}
      <TouchableOpacity
        style={[styles.purchaseButton, isPurchasing && styles.purchaseButtonDisabled]}
        onPress={handlePurchase}
        disabled={isPurchasing}
      >
        {isPurchasing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.purchaseButtonText}>프리미엄 시작하기</Text>
        )}
      </TouchableOpacity>

      {/* Restore Button */}
      <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
        <Text style={styles.restoreButtonText}>구매 복원</Text>
      </TouchableOpacity>

      {/* Terms */}
      <Text style={styles.termsText}>
        구독은 현재 기간이 끝나기 24시간 전에 자동으로 갱신됩니다.{'\n'}
        구독은 설정에서 언제든지 취소할 수 있습니다.
      </Text>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    backgroundColor: '#3B82F6',
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  heroIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#BFDBFE',
    textAlign: 'center',
  },
  featuresSection: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  checkmark: {
    fontSize: 20,
    color: '#10B981',
    fontWeight: 'bold',
  },
  plansSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  planBadge: {
    position: 'absolute',
    top: -12,
    right: 16,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  planSavings: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  planPriceDetail: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  purchaseButton: {
    backgroundColor: '#3B82F6',
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  purchaseButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  restoreButton: {
    marginHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  restoreButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '500',
  },
  termsText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 18,
  },
  bottomPadding: {
    height: 40,
  },
  // Active subscription styles
  activeSubscriptionContainer: {
    backgroundColor: '#3B82F6',
    padding: 32,
    alignItems: 'center',
  },
  crownIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  activeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  activeSubtitle: {
    fontSize: 16,
    color: '#BFDBFE',
    textAlign: 'center',
    marginBottom: 24,
  },
  subscriptionDetails: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#BFDBFE',
  },
  detailValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default PremiumScreen;
