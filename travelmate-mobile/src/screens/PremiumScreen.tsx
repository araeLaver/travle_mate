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
import { palette, fonts, type, spacing, radii } from '../theme';
import Icon from '../components/icons/Icon';

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
        <ActivityIndicator size="large" color={palette.primaryDark} />
      </View>
    );
  }

  // Show current subscription status if subscribed
  if (subscriptionStatus?.isActive) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.activeSubscriptionContainer}>
          <View style={styles.crownIcon}>
            <Icon name="crown" size={40} color={palette.primaryDark} />
          </View>
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
              <View style={styles.featureIconTile}>
                <Icon name="check" size={18} color={palette.primaryDark} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
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
        <View style={styles.heroIcon}>
          <Icon name="crown" size={40} color={palette.primaryDark} />
        </View>
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
            <View style={styles.featureIconTile}>
              <Icon name="check" size={18} color={palette.primaryDark} />
            </View>
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
                <Icon name="check" size={13} color={palette.darkBackground} strokeWidth={3} />
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
                <Icon name="check" size={13} color={palette.darkBackground} strokeWidth={3} />
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
          <ActivityIndicator color={palette.darkBackground} />
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
    backgroundColor: palette.darkBackground,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.darkBackground,
  },
  heroSection: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: radii.cardLarge,
    backgroundColor: 'rgba(142, 123, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: {
    ...type.display,
    color: palette.darkTextPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: palette.darkTextSecondary,
    textAlign: 'center',
  },
  featuresSection: {
    padding: spacing.xxl,
  },
  sectionTitle: {
    ...type.heading,
    color: palette.darkTextPrimary,
    marginBottom: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureIconTile: {
    width: 40,
    height: 40,
    borderRadius: radii.iconButton,
    backgroundColor: 'rgba(142, 123, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: palette.darkTextPrimary,
    marginBottom: 2,
  },
  featureDescription: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 17,
    color: palette.darkTextSecondary,
  },
  plansSection: {
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  planCard: {
    backgroundColor: palette.darkSurface,
    borderRadius: radii.cardLarge,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: palette.darkLine,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: palette.primaryDark,
    backgroundColor: 'rgba(142, 123, 255, 0.1)',
  },
  planBadge: {
    position: 'absolute',
    top: -12,
    right: spacing.lg,
    backgroundColor: palette.primaryDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.chip,
  },
  planBadgeText: {
    ...type.badge,
    color: palette.darkBackground,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  planTitle: {
    ...type.heading,
    color: palette.darkTextPrimary,
  },
  planSavings: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: palette.primaryDark,
  },
  planPrice: {
    fontFamily: fonts.extrabold,
    fontSize: 26,
    letterSpacing: -0.5,
    color: palette.darkTextPrimary,
    marginBottom: spacing.xs,
  },
  planPriceDetail: {
    ...type.bodySmall,
    color: palette.darkTextMuted,
  },
  selectedIndicator: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  purchaseButton: {
    backgroundColor: palette.primaryDark,
    marginHorizontal: spacing.xxl,
    height: 56,
    justifyContent: 'center',
    borderRadius: radii.card,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  purchaseButtonDisabled: {
    opacity: 0.5,
  },
  purchaseButtonText: {
    ...type.button,
    color: palette.darkBackground,
  },
  restoreButton: {
    marginHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  restoreButtonText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: palette.primaryDark,
  },
  termsText: {
    ...type.meta,
    color: palette.darkTextMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
    lineHeight: 17,
  },
  bottomPadding: {
    height: 40,
  },
  // Active subscription styles
  activeSubscriptionContainer: {
    padding: 32,
    alignItems: 'center',
  },
  crownIcon: {
    width: 64,
    height: 64,
    borderRadius: radii.cardLarge,
    backgroundColor: 'rgba(142, 123, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  activeTitle: {
    ...type.display,
    fontSize: 28,
    lineHeight: 34,
    color: palette.darkTextPrimary,
    marginBottom: spacing.sm,
  },
  activeSubtitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: palette.darkTextSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  subscriptionDetails: {
    backgroundColor: palette.darkSurface,
    borderWidth: 1,
    borderColor: palette.darkLine,
    borderRadius: radii.cardLarge,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.xxl,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  detailLabel: {
    ...type.bodySmall,
    color: palette.darkTextSecondary,
  },
  detailValue: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: palette.darkTextPrimary,
  },
  cancelButton: {
    backgroundColor: palette.darkElevated,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radii.iconButton,
  },
  cancelButtonText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: palette.darkTextPrimary,
  },
});

export default PremiumScreen;
