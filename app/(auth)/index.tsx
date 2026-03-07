/**
 * @file app/(auth)/index.tsx
 * @description Splash / Onboarding screen — the first screen new users see.
 * Shows the app branding and two CTAs: Sign In and Create Account.
 */

import { useAppTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function Onboarding() {
  const t = useAppTheme();
  const router = useRouter();

  // Entrance animations
  const logoAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.spring(logoAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }),
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [logoAnim, textAnim, buttonAnim]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Background orbs */}
      <View style={[styles.orb1, { backgroundColor: t.accent + '22' }]} />
      <View style={[styles.orb2, { backgroundColor: t.accentLight + '44' }]} />

      <View style={styles.container}>
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoWrap,
            {
              opacity: logoAnim,
              transform: [{ scale: logoAnim }],
            },
          ]}
        >
          <View style={[styles.logoBox, { backgroundColor: t.accent }]}>
            <Text style={styles.logoText}>✓</Text>
          </View>
          <Text style={[styles.appName, { color: t.textPrimary }]}>
            TaskFlow
          </Text>
          <Text style={[styles.tagline, { color: t.textSecondary }]}>
            Get things done, beautifully.
          </Text>
        </Animated.View>

        {/* Feature pills */}
        <Animated.View style={[styles.pills, { opacity: textAnim }]}>
          {['📋 Smart tasks', '📁 Projects', '📊 Progress tracking'].map(
            (f) => (
              <View
                key={f}
                style={[
                  styles.pill,
                  { backgroundColor: t.surface2, borderColor: t.border },
                ]}
              >
                <Text style={{ fontSize: 13, color: t.textSecondary }}>
                  {f}
                </Text>
              </View>
            )
          )}
        </Animated.View>

        {/* CTA buttons */}
        <Animated.View style={[styles.buttons, { opacity: buttonAnim }]}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: t.accent }]}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Get Started Free</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: t.border }]}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryBtnText, { color: t.textPrimary }]}>
              I already have an account
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  orb1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -80,
    right: -80,
  },
  orb2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    bottom: 60,
    left: -60,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 32,
  },
  logoWrap: { alignItems: 'center', gap: 14 },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 12px 24px rgba(108,99,255,0.4)' }
      : {
          shadowColor: '#6C63FF',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.4,
          shadowRadius: 24,
          elevation: 12,
        }),
  },
  logoText: { fontSize: 36, color: 'white', fontWeight: '700' },
  appName: { fontSize: 36, fontWeight: '700', letterSpacing: -1.5 },
  tagline: { fontSize: 15, textAlign: 'center' },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
  },
  buttons: { width: '100%', gap: 12 },
  primaryBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 8px 16px rgba(108,99,255,0.35)' }
      : {
          shadowColor: '#6C63FF',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
          elevation: 8,
        }),
  },
  primaryBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '600' },
});
