/**
 * @file app/(tabs)/profile/appearance.tsx
 * @description Appearance settings screen.
 * Allows users to toggle dark/light mode and pick an accent color.
 * Changes are applied immediately via ThemeContext and synced to the server.
 */

import { useAppTheme } from '@/context/ThemeContext';
import { userApi } from '@/services/api';
import type { ThemeKey } from '@/store/theme.store';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ACCENT_SWATCHES: { key: ThemeKey; label: string; color: string }[] = [
  { key: 'default', label: 'Default', color: '#6C63FF' },
  { key: 'rose', label: 'Rose', color: '#F43F5E' },
  { key: 'ocean', label: 'Ocean', color: '#0EA5E9' },
  { key: 'forest', label: 'Forest', color: '#22C55E' },
  { key: 'sunset', label: 'Sunset', color: '#F59E0B' },
  { key: 'midnight', label: 'Midnight', color: '#8B5CF6' },
];

export default function Appearance() {
  const t = useAppTheme();
  const router = useRouter();

  // ── Dark mode ────────────────────────────────────────────────────────────────
  async function handleDarkMode(dark: boolean): Promise<void> {
    t.setAccentTheme(t.isDark ? 'default' : 'default'); // no-op trick to re-render
    t.toggleDarkMode();
    // Sync to server (fire-and-forget — UI already updated)
    try {
      await userApi.updatePreferences({ darkMode: dark });
    } catch {
      /* silent */
    }
  }

  // ── Accent color ─────────────────────────────────────────────────────────────
  async function handleAccent(key: ThemeKey, color: string): Promise<void> {
    t.setAccentTheme(key);
    try {
      await userApi.updatePreferences({ accentTheme: key });
    } catch {
      /* silent */
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <TouchableOpacity
          style={[
            styles.backBtn,
            { backgroundColor: t.surface, borderColor: t.border },
          ]}
          onPress={() => router.back()}
        >
          <Text style={{ color: t.textPrimary, fontSize: 18 }}>‹</Text>
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '700',
            color: t.textPrimary,
            letterSpacing: -0.4,
          }}
        >
          Appearance
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Mode toggle */}
        <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>
          Mode
        </Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Light', icon: '☀️', isDark: false },
            { label: 'Dark', icon: '🌙', isDark: true },
          ].map((mode) => {
            const active = t.isDark === mode.isDark;
            return (
              <TouchableOpacity
                key={mode.label}
                onPress={() => handleDarkMode(mode.isDark)}
                style={[
                  styles.modeCard,
                  {
                    backgroundColor: active ? t.accentLight : t.surface,
                    borderColor: active ? t.accent : t.border,
                    borderWidth: active ? 2 : 1,
                  },
                ]}
              >
                <Text style={{ fontSize: 28, marginBottom: 8 }}>
                  {mode.icon}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: active ? t.accent : t.textPrimary,
                  }}
                >
                  {mode.label}
                </Text>
                {active ? (
                  <View
                    style={[styles.checkBadge, { backgroundColor: t.accent }]}
                  >
                    <Text
                      style={{
                        color: 'white',
                        fontSize: 10,
                        fontWeight: '700',
                      }}
                    >
                      ✓
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Accent color */}
        <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>
          Accent Colour
        </Text>
        <View style={styles.swatchGrid}>
          {ACCENT_SWATCHES.map((s) => {
            const active = t.accent === s.color;
            return (
              <TouchableOpacity
                key={s.key}
                onPress={() => handleAccent(s.key, s.color)}
                style={styles.swatchItem}
              >
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: s.color },
                    active &&
                      Platform.select({
                        web: {
                          borderWidth: 3,
                          borderColor: s.color,
                          boxShadow: `0px 4px 8px ${s.color}66`,
                        },
                        default: {
                          borderWidth: 3,
                          borderColor: s.color,
                          shadowColor: s.color,
                          shadowOpacity: 0.4,
                          shadowRadius: 8,
                          shadowOffset: { width: 0, height: 4 },
                          elevation: 6,
                        },
                      }),
                  ]}
                >
                  {active ? (
                    <Text
                      style={{
                        color: 'white',
                        fontSize: 18,
                        fontWeight: '700',
                      }}
                    >
                      ✓
                    </Text>
                  ) : null}
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    color: t.textSecondary,
                    marginTop: 6,
                    textAlign: 'center',
                  }}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Live preview */}
        <Text
          style={[
            styles.sectionTitle,
            { color: t.textTertiary, marginTop: 28 },
          ]}
        >
          Preview
        </Text>
        <View
          style={[
            styles.preview,
            { backgroundColor: t.surface, borderColor: t.border },
          ]}
        >
          <View style={[styles.previewAccent, { backgroundColor: t.accent }]}>
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>
              Your Theme
            </Text>
          </View>
          <View style={{ padding: 14, gap: 10 }}>
            <View
              style={[
                styles.previewTask,
                { backgroundColor: t.surface2, borderColor: t.border },
              ]}
            >
              <View style={[styles.previewCb, { backgroundColor: t.accent }]}>
                <Text style={{ color: 'white', fontSize: 10 }}>✓</Text>
              </View>
              <Text style={{ fontSize: 13, color: t.textPrimary, flex: 1 }}>
                Example task
              </Text>
              <View
                style={[styles.previewChip, { backgroundColor: t.accentLight }]}
              >
                <Text
                  style={{ fontSize: 10, color: t.accent, fontWeight: '700' }}
                >
                  High
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.previewTask,
                { backgroundColor: t.surface2, borderColor: t.border },
              ]}
            >
              <View
                style={[
                  styles.previewCb,
                  { borderWidth: 2, borderColor: t.border },
                ]}
              />
              <Text style={{ fontSize: 13, color: t.textPrimary, flex: 1 }}>
                Another task
              </Text>
              <View
                style={[styles.previewChip, { backgroundColor: t.surface2 }]}
              >
                <Text
                  style={{
                    fontSize: 10,
                    color: t.textSecondary,
                    fontWeight: '700',
                  }}
                >
                  Low
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 12,
  },
  modeCard: {
    flex: 1,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  swatchItem: { alignItems: 'center', width: 56 },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: { borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  previewAccent: { padding: 14, alignItems: 'center' },
  previewTask: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  previewCb: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
});
