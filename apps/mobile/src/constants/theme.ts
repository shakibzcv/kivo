/**
 * Below are the colors and design tokens used throughout the application.
 * All UI components reference these tokens to maintain complete theme consistency.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    textSecondary: '#60646C',
    textPlaceholder: '#9CA3AF',
    background: '#F0F0F3',
    backgroundElement: '#E4E5E9',
    backgroundSelected: '#D8DAE0',
    border: '#E0E1E6',
    borderMuted: '#E5E7EB',
    primary: '#0085FF',
    primaryText: '#FFFFFF',
    toolbarBackground: '#F0F0F3',
    toolbarBorder: '#E0E1E6',
    toolbarIcon: '#111827',
    toolbarIconActive: '#0085FF',
    toolbarIconDisabled: '#9CA3AF',
    toolbarActiveBackground: '#D0D2D7',
    editorCodeBackground: '#E4E5E9',
    editorBlockquoteBorder: '#CBD5E1',
    editorHighlight: '#FEF08A',
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#B0B4BA',
    textPlaceholder: '#80848C',
    background: '#212225',
    backgroundElement: '#2B2D31',
    backgroundSelected: '#34373D',
    border: '#2E3135',
    borderMuted: '#27272A',
    primary: '#0085FF',
    primaryText: '#FFFFFF',
    toolbarBackground: '#212225',
    toolbarBorder: '#2E3135',
    toolbarIcon: '#FFFFFF',
    toolbarIconActive: '#0085FF',
    toolbarIconDisabled: '#60646C',
    toolbarActiveBackground: '#3A3D42',
    editorCodeBackground: '#2B2D31',
    editorBlockquoteBorder: '#60646C',
    editorHighlight: '#854D0E',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
