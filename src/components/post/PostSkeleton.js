import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

// A single pulsing skeleton "bone"
const SkeletonBone = ({ style }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
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
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return <Animated.View style={[styles.bone, style, { opacity }]} />;
};

// Full post card skeleton
const PostSkeleton = () => (
  <View style={styles.card}>
    {/* Header */}
    <View style={styles.header}>
      <SkeletonBone style={styles.avatar} />
      <View style={styles.userInfo}>
        <SkeletonBone style={styles.nameBone} />
        <SkeletonBone style={styles.timeBone} />
      </View>
    </View>
    {/* Content */}
    <SkeletonBone style={styles.line} />
    <SkeletonBone style={[styles.line, { width: '70%' }]} />
    {/* Image placeholder */}
    <SkeletonBone style={styles.image} />
    {/* Actions */}
    <View style={styles.actions}>
      <SkeletonBone style={styles.action} />
      <SkeletonBone style={styles.action} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  bone: {
    backgroundColor: colors.border,
    borderRadius: 8,
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 16,
    padding: spacing.md,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  nameBone: {
    width: '45%',
    height: 14,
    marginBottom: 6,
  },
  timeBone: {
    width: '25%',
    height: 10,
  },
  line: {
    width: '100%',
    height: 13,
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
  },
  action: {
    width: 60,
    height: 24,
    borderRadius: 12,
  },
});

export default PostSkeleton;
