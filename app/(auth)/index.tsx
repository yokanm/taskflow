import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

// const { width } = Dimensions.get('window');

const FEATURES = [
  { icon: '✓', label: 'Smart Tasks' },
  { icon: '⊞', label: 'Projects' },
  { icon: '🔔', label: 'Reminders' },
];

export default function Onboarding() {
  const router = useRouter();
  const scale = useSharedValue(1);

  const handleGetStarted = () => {
    scale.value = withSpring(0.97, {}, () => { scale.value = withSpring(1); });
    router.push('/(auth)/register');
  };

  const logoAnim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={styles.root}>
      {/* Orbs */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />
      <SafeAreaView style={styles.safe}>
        {/* Logo */}
        <Animated.View style={[styles.center, logoAnim]}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoIcon}>✓</Text>
          </View>
          <Text style={styles.title}>TaskFlow</Text>
          <Text style={styles.sub}>Organize. Focus. Achieve.</Text>

          {/* Feature icons */}
          <View style={styles.features}>
            {FEATURES.map((f) => (
              <View key={f.label} style={styles.featureItem}>
                <View style={styles.featureIcon}><Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)' }}>{f.icon}</Text></View>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </View>

          {/* Dots */}
          <View style={styles.dots}>
            <View style={styles.dotActive} />
            <View style={styles.dotInactive} />
            <View style={styles.dotInactive} />
          </View>

          {/* CTAs */}
          <TouchableOpacity style={styles.primaryBtn} onPress={handleGetStarted} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Get Started Free</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(auth)/login')} activeOpacity={0.7}>
            <Text style={styles.secondaryBtnText}>Sign In</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F0F1A' },
  orb1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, top: -80, left: -60,
    backgroundColor: 'rgba(108,99,255,0.25)', opacity: 0.6 },
  orb2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, bottom: 120, right: -40,
    backgroundColor: 'rgba(236,72,153,0.2)', opacity: 0.6 },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 40 },
  logoWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#6C63FF', alignItems: 'center',
    justifyContent: 'center', marginBottom: 24,
    shadowColor: 'rgba(108,99,255,0.5)', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 1, shadowRadius: 32, elevation: 12 },
  logoIcon: { fontSize: 36, color: 'white', fontWeight: '700' },
  title: { fontSize: 36, fontWeight: '700', color: 'white', letterSpacing: -1.5, marginBottom: 8 },
  sub: { fontSize: 16, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 24, marginBottom: 36 },
  features: { flexDirection: 'row', gap: 20, marginBottom: 36 },
  featureItem: { alignItems: 'center', gap: 8 },
  featureIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  featureLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  dots: { flexDirection: 'row', gap: 6, marginBottom: 36 },
  dotActive: { width: 20, height: 6, borderRadius: 3, backgroundColor: '#6C63FF' },
  dotInactive: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  primaryBtn: { width: '100%', backgroundColor: '#6C63FF', paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', marginBottom: 12,
    shadowColor: 'rgba(108,99,255,0.5)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 24, elevation: 8 },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: 'white' },
  secondaryBtn: { width: '100%', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  secondaryBtnText: { fontSize: 15, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },
});
