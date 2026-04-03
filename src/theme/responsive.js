import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

export const scaleW = (size) => (SCREEN_WIDTH / BASE_WIDTH) * size;

export const scaleH = (size) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;

export const moderateScale = (size, factor = 0.5) =>
  size + (scaleW(size) - size) * factor;

export const scaleFontSize = (size) => {
  const newSize = moderateScale(size);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const SCREEN = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: SCREEN_HEIGHT < 700,
  isMedium: SCREEN_HEIGHT >= 700 && SCREEN_HEIGHT < 844,
  isLarge: SCREEN_HEIGHT >= 844,
  isTablet: SCREEN_WIDTH >= 768,
};

export const IS_IOS = Platform.OS === 'ios';
export const IS_ANDROID = Platform.OS === 'android';

export const rp = (size) => scaleW(size);
export const rm = (size) => scaleW(size);
export const rf = (size) => scaleFontSize(size); 