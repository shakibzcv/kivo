import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface KivoLogoProps {
  size?: number;
  isDark?: boolean;
}

export function KivoLogo({ size = 48, isDark = true }: KivoLogoProps) {
  const iconSource = isDark
    ? require('@/assets/icons/kivo-logo-dark-transparent.png')
    : require('@/assets/icons/kivo-logo-light-transparent.png');

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image source={iconSource} style={{ width: size, height: size }} contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default KivoLogo;
