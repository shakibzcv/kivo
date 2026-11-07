import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KivoLogo } from '@/components/kivo-logo';
import { Fonts } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [email, setEmail] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const { signInWithGoogle, isGoogleSigningIn, user } = useAuth();

  useEffect(() => {
    if (user) {
      router.replace('/home');
    }
  }, [user, router]);

  const handleContinue = () => {
    // Navigate to home page
    router.push('/home');
  };

  const handleOAuthLogin = async (provider: string) => {
    if (provider === 'google') {
      try {
        const result = await signInWithGoogle();
        if (result.success) {
          router.push('/home');
        } else if (result.error && !result.cancelled) {
          Alert.alert('Google Sign-In', result.error);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
        Alert.alert('Google Sign-In', msg);
      }
      return;
    }
    // Auth provider placeholder -> routes to home page
    router.push('/home');
  };

  // Exact theme palette aligned with desktop app design
  const colors = isDark
    ? {
        bg: '#111111',
        cardBg: '#1c1c1c',
        cardBorder: 'rgba(255, 255, 255, 0.08)',
        cardBorderActive: 'rgba(255, 255, 255, 0.16)',
        inputBg: '#222222',
        inputBorder: 'rgba(255, 255, 255, 0.12)',
        inputBorderFocus: '#0085FF',
        inputText: '#FFFFFF',
        placeholder: '#666666',
        label: '#8b8b8b',
        subtext: '#707070',
        title: '#FFFFFF',
        subtitle: '#9b9b9b',
        divider: 'rgba(255, 255, 255, 0.08)',
        dividerText: '#6e6e6e',
        btnText: '#d4d4d4',
        footerText: '#666666',
        footerLink: '#888888',
      }
    : {
        bg: '#f8f9fa',
        cardBg: '#ffffff',
        cardBorder: 'rgba(0, 0, 0, 0.08)',
        cardBorderActive: 'rgba(0, 0, 0, 0.16)',
        inputBg: '#ffffff',
        inputBorder: '#d1d5db',
        inputBorderFocus: '#0085FF',
        inputText: '#111827',
        placeholder: '#9ca3af',
        label: '#6b7280',
        subtext: '#9ca3af',
        title: '#111827',
        subtitle: '#6b7280',
        divider: '#e5e7eb',
        dividerText: '#9ca3af',
        btnText: '#374151',
        footerText: '#6b7280',
        footerLink: '#374151',
      };

  const iconColor = isDark ? '#FFFFFF' : '#111827';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: colors.bg }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + 20, 36),
            paddingBottom: Math.max(insets.bottom + 24, 36),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentWrapper}>
          {/* 1. Standalone Kivo Logo */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(100)}
            style={styles.logoContainer}
          >
            <KivoLogo size={48} isDark={isDark} />
          </Animated.View>

          {/* 2. Header Title & Subtitle */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(200)}
            style={styles.headerContainer}
          >
            <Text style={[styles.title, { color: colors.title }]}>Your AI workspace.</Text>
            <Text style={[styles.subtitle, { color: colors.subtitle }]}>
              Log in to your Kivo account
            </Text>
          </Animated.View>

          {/* 3. Email Input & Continue Form */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(300)}
            style={styles.formContainer}
          >
            <Text style={[styles.inputLabel, { color: colors.label }]}>EMAIL</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email address..."
              placeholderTextColor={colors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: isInputFocused ? colors.inputBorderFocus : colors.inputBorder,
                  color: colors.inputText,
                },
              ]}
            />
            <Text style={[styles.helperText, { color: colors.subtext }]}>
              Use an organization email to easily collaborate with teammates
            </Text>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleContinue}
              style={styles.continueButton}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* 4. Divider */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(400)}
            style={styles.dividerContainer}
          >
            <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
            <View style={[styles.dividerBadge, { backgroundColor: colors.bg }]}>
              <Text style={[styles.dividerText, { color: colors.dividerText }]}>
                or continue with
              </Text>
            </View>
          </Animated.View>

          {/* 5. OAuth & Auth Providers Grid */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(500)}
            style={styles.authGridContainer}
          >
            {/* Row 1: Google, Apple, Microsoft */}
            <View style={styles.gridRow}>
              {/* Google */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleOAuthLogin('google')}
                disabled={isGoogleSigningIn}
                style={[
                  styles.oauthButton,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.cardBorder,
                    opacity: isGoogleSigningIn ? 0.6 : 1,
                  },
                ]}
              >
                {isGoogleSigningIn ? (
                  <ActivityIndicator size="small" color="#0085FF" style={styles.oauthIcon} />
                ) : (
                  <Image
                    source={require('@/assets/icons/google.png')}
                    style={styles.oauthIcon}
                    contentFit="contain"
                  />
                )}
                <Text style={[styles.oauthButtonText, { color: colors.btnText }]}>
                  {isGoogleSigningIn ? 'Signing in...' : 'Google'}
                </Text>
              </TouchableOpacity>

              {/* Apple */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleOAuthLogin('apple')}
                style={[
                  styles.oauthButton,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Ionicons name="logo-apple" size={20} color={iconColor} style={styles.oauthIcon} />
                <Text style={[styles.oauthButtonText, { color: colors.btnText }]}>Apple</Text>
              </TouchableOpacity>

              {/* Microsoft */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleOAuthLogin('microsoft')}
                style={[
                  styles.oauthButton,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <View style={[styles.oauthIcon, styles.microsoftGrid]}>
                  <View style={[styles.msSquare, { backgroundColor: '#F25022' }]} />
                  <View style={[styles.msSquare, { backgroundColor: '#7FBA00' }]} />
                  <View style={[styles.msSquare, { backgroundColor: '#00A4EF' }]} />
                  <View style={[styles.msSquare, { backgroundColor: '#FFB900' }]} />
                </View>
                <Text style={[styles.oauthButtonText, { color: colors.btnText }]}>Microsoft</Text>
              </TouchableOpacity>
            </View>

            {/* Row 2: Passkey, SSO */}
            <View style={[styles.gridRow, styles.gridRowCentered]}>
              {/* Passkey */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleOAuthLogin('passkey')}
                style={[
                  styles.oauthButton,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Ionicons name="key-outline" size={19} color={iconColor} style={styles.oauthIcon} />
                <Text style={[styles.oauthButtonText, { color: colors.btnText }]}>Passkey</Text>
              </TouchableOpacity>

              {/* SSO */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleOAuthLogin('sso')}
                style={[
                  styles.oauthButton,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Ionicons
                  name="business-outline"
                  size={19}
                  color={iconColor}
                  style={styles.oauthIcon}
                />
                <Text style={[styles.oauthButtonText, { color: colors.btnText }]}>SSO</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* 6. Footer Terms & Privacy */}
          <Animated.View
            entering={FadeInUp.duration(600).delay(600)}
            style={styles.footerContainer}
          >
            <Text style={[styles.footerText, { color: colors.footerText }]}>
              By continuing, you acknowledge that you understand and agree to the{' '}
              <Text style={[styles.footerLink, { color: colors.footerLink }]} onPress={() => {}}>
                Terms &amp; Conditions
              </Text>{' '}
              and{' '}
              <Text style={[styles.footerLink, { color: colors.footerLink }]} onPress={() => {}}>
                Privacy Policy
              </Text>
            </Text>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 25,
    fontWeight: '700',
    letterSpacing: -0.5,
    fontFamily: Fonts.sans,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.sans,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    fontFamily: Fonts.sans,
  },
  textInput: {
    width: '100%',
    height: 46,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: Fonts.sans,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
    fontFamily: Fonts.sans,
  },
  continueButton: {
    width: '100%',
    height: 46,
    borderRadius: 9,
    backgroundColor: '#0085FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    shadowColor: '#0085FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.sans,
  },
  dividerContainer: {
    width: '100%',
    height: 30,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    width: '100%',
    height: 1,
  },
  dividerBadge: {
    position: 'absolute',
    paddingHorizontal: 12,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  authGridContainer: {
    width: '100%',
    gap: 10,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  gridRowCentered: {
    maxWidth: 280,
    alignSelf: 'center',
  },
  oauthButton: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  oauthIcon: {
    width: 21,
    height: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  microsoftGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  msSquare: {
    width: 7.5,
    height: 7.5,
    borderRadius: 1,
  },
  oauthButtonText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: Fonts.sans,
  },
  footerContainer: {
    marginTop: 26,
    paddingHorizontal: 12,
  },
  footerText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    fontFamily: Fonts.sans,
  },
  footerLink: {
    textDecorationLine: 'underline',
  },
});
