import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

const NetworkBanner = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  // useRef keeps the same Animated.Value across all re-renders
  const slideAnim = useRef(new Animated.Value(-50)).current;

  // Separate the show/hide animations into stable callbacks
  const showBannerAnim = useCallback(() => {
    setShowBanner(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [slideAnim]);

  const hideBannerAnim = useCallback(() => {
    setTimeout(() => {
      Animated.spring(slideAnim, {
        toValue: -50,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start(() => setShowBanner(false));
    }, 2000);
  }, [slideAnim]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = Boolean(state.isConnected && state.isInternetReachable);
      setIsConnected(connected);

      if (!connected) {
        showBannerAnim();
      } else {
        hideBannerAnim();
      }
    });

    return () => unsubscribe();
  }, [showBannerAnim, hideBannerAnim]);

  if (!showBanner) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          transform: [{ translateY: slideAnim }],
          backgroundColor: isConnected ? colors.success : colors.error,
        },
      ]}
    >
      <Text style={styles.text}>
        {isConnected ? '✅ Back online' : '⚠️ No internet connection'}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.text.white,
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.semiBold,
  },
});

export default NetworkBanner;
