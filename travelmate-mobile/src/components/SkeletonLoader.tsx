/**
 * Skeleton Loading Components
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { palette, spacing, radii } from '../theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

const SkeletonBlock: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 4,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: palette.surfaceAlt,
          opacity,
        },
        style,
      ]}
    />
  );
};

/** Card skeleton for lists (user cards, group cards) */
export const CardSkeleton: React.FC = () => (
  <View style={styles.card}>
    <SkeletonBlock width={48} height={48} borderRadius={24} />
    <View style={styles.cardContent}>
      <SkeletonBlock width="60%" height={14} />
      <SkeletonBlock width="40%" height={12} style={styles.mt6} />
    </View>
  </View>
);

/** Full-width card skeleton for nearby locations */
export const LocationCardSkeleton: React.FC = () => (
  <View style={styles.locationCard}>
    <SkeletonBlock width="100%" height={120} borderRadius={0} />
    <View style={styles.locationContent}>
      <SkeletonBlock width="70%" height={14} />
      <SkeletonBlock width="90%" height={12} style={styles.mt6} />
      <SkeletonBlock width="30%" height={12} style={styles.mt6} />
    </View>
  </View>
);

/** Grid card skeleton for collections */
export const GridCardSkeleton: React.FC = () => (
  <View style={styles.gridCard}>
    <SkeletonBlock width="100%" height={100} borderRadius={0} />
    <View style={styles.gridContent}>
      <SkeletonBlock width="80%" height={12} />
      <SkeletonBlock width="50%" height={10} style={styles.mt6} />
    </View>
  </View>
);

/** Profile header skeleton */
export const ProfileSkeleton: React.FC = () => (
  <View style={styles.profile}>
    <SkeletonBlock width={72} height={72} borderRadius={36} />
    <View style={styles.profileInfo}>
      <SkeletonBlock width={120} height={18} />
      <SkeletonBlock width={160} height={14} style={styles.mt6} />
    </View>
  </View>
);

/** Stats row skeleton */
export const StatsSkeleton: React.FC = () => (
  <View style={styles.statsRow}>
    {[1, 2, 3].map((i) => (
      <View key={i} style={styles.statItem}>
        <SkeletonBlock width={40} height={20} />
        <SkeletonBlock width={50} height={12} style={styles.mt6} />
      </View>
    ))}
  </View>
);

/** Home screen skeleton */
export const HomeSkeleton: React.FC = () => (
  <View style={styles.container}>
    <View style={styles.homeHeader}>
      <SkeletonBlock width={180} height={20} />
      <SkeletonBlock width="100%" height={14} style={styles.mt6} />
    </View>
    <StatsSkeleton />
    <View style={styles.section}>
      <SkeletonBlock width={100} height={16} />
      <View style={styles.quickRow}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.quickItem}>
            <SkeletonBlock width={48} height={48} borderRadius={24} />
            <SkeletonBlock width={50} height={10} style={styles.mt6} />
          </View>
        ))}
      </View>
    </View>
    <View style={styles.section}>
      <SkeletonBlock width={120} height={16} />
      <View style={styles.mt12}>
        {[1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </View>
    </View>
  </View>
);

/** List skeleton: renders N card skeletons */
export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <View style={styles.listContainer}>
    {Array.from({ length: count }, (_, i) => (
      <CardSkeleton key={i} />
    ))}
  </View>
);

export { SkeletonBlock };
export default SkeletonBlock;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  mt6: {
    marginTop: 6,
  },
  mt12: {
    marginTop: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    padding: spacing.lg,
    borderRadius: radii.card,
    marginBottom: spacing.sm,
  },
  cardContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  locationCard: {
    width: 200,
    backgroundColor: palette.surface,
    borderRadius: radii.card,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  locationContent: {
    padding: spacing.md,
  },
  gridCard: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radii.card,
    overflow: 'hidden',
    margin: spacing.xs,
  },
  gridContent: {
    padding: spacing.sm,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  profileInfo: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  statItem: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radii.input,
    padding: spacing.lg,
    alignItems: 'center',
  },
  homeHeader: {
    padding: spacing.xxl,
    paddingTop: 60,
  },
  section: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xxl,
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  quickItem: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
    alignItems: 'center',
  },
  listContainer: {
    padding: spacing.lg,
  },
});
