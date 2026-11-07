import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import React, { useEffect } from 'react';
import { Platform, StatusBar, useColorScheme } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Colors } from '@/constants/theme';
import { AuthProvider } from '@/context/auth-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  useEffect(() => {
    // Sync root window background with theme (Android/iOS)
    SystemUI.setBackgroundColorAsync(colors.background);

    // Sync Android Status Bar and Navigation Bar (bottom back/home buttons)
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(colors.background, true);
      StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
      NavigationBar.setStyle(isDark ? 'light' : 'dark');
    }
  }, [colors, isDark]);

  const navigationTheme = React.useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: colors.background,
        card: colors.toolbarBackground,
        border: colors.toolbarBorder,
      },
    };
  }, [colors, isDark]);

  return (
    <KeyboardProvider>
      <ThemeProvider value={navigationTheme}>
        <AuthProvider>
          <StatusBar
            backgroundColor={colors.background}
            barStyle={isDark ? 'light-content' : 'dark-content'}
            animated={true}
          />
          <AnimatedSplashOverlay />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </KeyboardProvider>
  );
}
