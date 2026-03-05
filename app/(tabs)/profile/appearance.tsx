import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/auth.store';
import { userApi } from '@/services/api';
import type { ThemeKey } from '@/types';

const THEMES: { key: ThemeKey; label: string; color: string }[] = [
  { key: 'default',  label: 'Default',  color: '#6C63FF' },
  { key: 'rose',     label: 'Rose',     color: '#F43F5E' },
  { key: 'ocean',    label: 'Ocean',    color: '#0EA5E9' },
  { key: 'forest',   label: 'Forest',   color: '#22C55E' },
  { key: 'sunset',   label: 'Sunset',   color: '#F59E0B' },
  { key: 'midnight', label: 'Midnight', color: '#8B5CF6' },
];

export default function Appearance() {
  const t = useAppTheme();
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const handleDarkMode = async (isDark: boolean) => {
    t.toggleDarkMode();
    try {
      await userApi.updatePreferences({ darkMode: isDark });
      if (user) setUser({ ...user, darkMode: isDark });
    } catch {}
  };

  const handleTheme = async (key: ThemeKey) => {
    t.setAccentTheme(key);
    try {
      await userApi.updatePreferences({ accentTheme: key });
      if (user) setUser({ ...user, accentTheme: key });
    } catch {}
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: t.surface, borderColor: t.border }]} onPress={() => router.back()}>
            <Text style={{ color: t.textPrimary, fontSize: 18 }}>‹</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '700', color: t.textPrimary, letterSpacing: -0.4 }}>Appearance</Text>
        </View>

        {/* Theme mode */}
        <Text style={[styles.sectionTitle, { color: t.textTertiary }]}>Theme Mode</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
          {[{ label: '☀ Light', val: false }, { label: '● Dark', val: true }].map((m) => {
            const sel = t.isDark === m.val;
            return (
              <TouchableOpacity key={m.label} onPress={() => handleDarkMode(m.val)}
                style={[styles.modeBtn, { flex: 1,
                  backgroundColor: sel ? t.accent : t.surface,
                  borderColor: sel ? t.accent : t.border, borderWidth: 1.5,
                }]}>
                <Text style={{ fontSize: 14, fontWeight: sel ? '700' : '500', color: sel ? 'white' : t.textSecondary }}>{m.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Preview */}
        <View style={[styles.preview, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <View style={[styles.previewAvatar, { backgroundColor: t.accent }]}><Text style={{ color: 'white', fontWeight: '700' }}>A</Text></View>
            <View>
              <View style={[styles.sk, { width: 100, backgroundColor: t.surface2 }]} />
              <View style={[styles.sk, { width: 60, marginTop: 4, backgroundColor: t.surface2 }]} />
            </View>
          </View>
          <View style={[styles.previewCard, { backgroundColor: t.bg, borderColor: t.border }]}>
            <View style={[styles.sk, { width: '80%', backgroundColor: t.border }]} />
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
              <View style={[styles.chip, { backgroundColor: t.accentLight }]}><View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: t.accent }} /><Text style={{ fontSize: 10, color: t.accent, fontWeight: '600' }}>Active</Text></View>
            </View>
          </View>
        </View>

        {/* Accent */}
        <Text style={[styles.sectionTitle, { color: t.textTertiary, marginTop: 8 }]}>Accent Color</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {THEMES.map((th) => {
            const sel = t.accentTheme === th.key;
            return (
              <TouchableOpacity key={th.key} onPress={() => handleTheme(th.key)}
                style={[styles.thCard, { borderColor: sel ? th.color : t.border, borderWidth: sel ? 2 : 1, flex: 1, minWidth: '28%' }]}>
                <View style={[styles.thPreview, { backgroundColor: th.color }]}>
                  {sel && (
                    <View style={styles.thCheck}>
                      <Text style={{ color: 'white', fontSize: 10, fontWeight: '800' }}>✓</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: t.textPrimary, padding: 8, backgroundColor: t.surface }}>{th.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12 },
  modeBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  preview: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20 },
  previewAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sk: { height: 10, borderRadius: 5 },
  previewCard: { borderRadius: 10, borderWidth: 1, padding: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  thCard: { borderRadius: 14, overflow: 'hidden', minWidth: '28%' },
  thPreview: { height: 50, position: 'relative' },
  thCheck: { position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
});
