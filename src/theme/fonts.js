import { rf } from './responsive';

export const fonts = {
  sizes: {
    xs: rf(11),
    sm: rf(13),
    md: rf(15),
    lg: rf(17),
    xl: rf(20),
    xxl: rf(24),
    xxxl: rf(30),
    display: rf(38),
  },
  weights: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
    black: '900',
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};