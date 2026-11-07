import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KivoLogo } from '@/components/kivo-logo';
import { Fonts } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, signOut, isLoading } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.replace('/');
  };

  const colors = isDark
    ? {
        bg: '#111111',
        cardBg: '#1c1c1c',
        cardBorder: 'rgba(255, 255, 255, 0.08)',
        title: '#FFFFFF',
        subtitle: '#9b9b9b',
        text: '#FFFFFF',
        subtext: '#888888',
        tagBg: 'rgba(0, 133, 255, 0.15)',
        tagText: '#38bdf8',
        logoutBg: 'rgba(239, 68, 68, 0.12)',
        logoutBorder: 'rgba(239, 68, 68, 0.3)',
        logoutText: '#f87171',
        btnBg: '#0085FF',
        btnText: '#FFFFFF',
      }
    : {
        bg: '#f8f9fa',
        cardBg: '#ffffff',
        cardBorder: 'rgba(0, 0, 0, 0.08)',
        title: '#111827',
        subtitle: '#6b7280',
        text: '#111827',
        subtext: '#6b7280',
        tagBg: 'rgba(0, 133, 255, 0.1)',
        tagText: '#0284c7',
        logoutBg: 'rgba(239, 68, 68, 0.08)',
        logoutBorder: 'rgba(239, 68, 68, 0.25)',
        logoutText: '#dc2626',
        btnBg: '#0085FF',
        btnText: '#FFFFFF',
      };

  const displayName = user?.name || user?.givenName || 'Kivo User';
  const displayEmail = user?.email || 'user@kivo.app';
  const photoUrl = user?.photo;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + 24, 40),
            paddingBottom: Math.max(insets.bottom + 28, 40),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header Branding */}
          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.logoRow}>
            <KivoLogo size={44} isDark={isDark} />
            <Text style={[styles.brandName, { color: colors.title }]}>Kivo</Text>
          </Animated.View>

          {/* Home Title */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(200)}
            style={styles.headerSection}
          >
            <Text style={[styles.pageTitle, { color: colors.title }]}>Home Page</Text>
            <Text style={[styles.pageSubtitle, { color: colors.subtitle }]}>
              Welcome back to your workspace
            </Text>
          </Animated.View>

          {/* Profile Card */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(300)}
            style={[
              styles.profileCard,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {/* Avatar */}
            <View style={styles.avatarWrapper}>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.btnBg }]}>
                  <Text style={styles.avatarInitials}>{displayName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </View>

            {/* User Details */}
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>{displayName}</Text>
              <Text style={[styles.userEmail, { color: colors.subtext }]}>{displayEmail}</Text>
              <View style={[styles.badge, { backgroundColor: colors.tagBg }]}>
                <Ionicons name="checkmark-circle" size={14} color={colors.tagText} />
                <Text style={[styles.badgeText, { color: colors.tagText }]}>
                  Google Account Active
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(400)}
            style={styles.actionsSection}
          >
            {/* Open Editor Button */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => router.push('/editor')}
              style={[styles.primaryButton, { backgroundColor: colors.btnBg }]}
            >
              <Ionicons name="document-text-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Open Document Editor</Text>
            </TouchableOpacity>

            {/* Logout Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleLogout}
              disabled={isLoading}
              style={[
                styles.logoutButton,
                {
                  backgroundColor: colors.logoutBg,
                  borderColor: colors.logoutBorder,
                },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.logoutText} />
              ) : (
                <>
                  <Ionicons name="log-out-outline" size={18} color={colors.logoutText} />
                  <Text style={[styles.logoutButtonText, { color: colors.logoutText }]}>
                    Log Out
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
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
  container: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    fontFamily: Fonts.sans,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
    fontFamily: Fonts.sans,
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.sans,
  },
  profileCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarWrapper: {
    marginBottom: 14,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    fontFamily: Fonts.sans,
  },
  userInfo: {
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Fonts.sans,
  },
  userEmail: {
    fontSize: 13,
    fontFamily: Fonts.sans,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: Fonts.sans,
  },
  actionsSection: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0085FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.sans,
  },
  logoutButton: {
    width: '100%',
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.sans,
  },
});
