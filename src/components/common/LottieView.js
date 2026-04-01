import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

const LottieAnimation = ({
  source,
  width = 200,
  height = 200,
  autoPlay = true,
  loop = true,
  speed = 1,
  style,
  onAnimationFinish,
}) => {
  const animRef = useRef(null);

  useEffect(() => {
    if (autoPlay && animRef.current) {
      animRef.current.play();
    }
  }, [autoPlay]);

  return (
    <View style={[styles.container, { width, height }, style]}>
      <LottieView
        ref={animRef}
        source={source}
        autoPlay={autoPlay}
        loop={loop}
        speed={speed}
        style={{ width, height }}
        onAnimationFinish={onAnimationFinish}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LottieAnimation;