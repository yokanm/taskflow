/**
 * @file app/profile/edit-profile.tsx
 * @description Edit Profile screen — update name, email, and avatar color.
 *
 * This screen was missing entirely. "Edit Profile" in profile.tsx
 * previously navigated to /profile/appearance (the theme screen),
 * which has no profile editing functionality.
 *
 * Connects to:
 *   PATCH /api/v1/users/me         — name, email
 *   PATCH /api/v1/users/me/preferences — avatarColor
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/auth.store';
import { userApi } from '@/services/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { ArrowLeft, Check } from 'lucide-react-native';

// ─── Avatar colour options ────────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#6C63FF', '#F43F5E', '#0EA5E9', '#22C55E',
  '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6',
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function EditProfile() {
  const t      = useAppTheme();
  const router = useRouter();
  const { user, updateUser } = useAuthStore();

  const [name,        setName]        = useState(user?.name         ?? '');
  const [email,       setEmail]       = useState(user?.email        ?? '');
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor  ?? t.accent);
  const [saving,      setSaving]      = useState(false);
  const [errors,      setErrors]      = useState<Record<string, string>>({});

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (name.trim().length < 2)  errs.name  = 'Name must be at least 2 characters';
    if (!email.trim().includes('@')) errs.email = 'Enter a valid email address';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      // Update name and email
      const profileRes = await userApi.updateProfile({
        name:  name.trim(),
        email: email.trim(),
      });

      // Update avatar color if it changed
      if (avatarColor !== user?.avatarColor) {
        await userApi.updatePreferences({ avatarColor });
      }

      // Reflect changes in the local store immediately
      updateUser({
        name:        profileRes.user.name,
        email:       profileRes.user.email,
        avatarColor: avatarColor,
      });

      Alert.alert('Saved', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to update profile'
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: t.surface, borderColor: t.border }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={18} color={t.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: t.textPrimary, letterSpacing: -0.4 }}>
          Edit Profile
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* Avatar preview */}
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <Avatar
            name={name || user?.name}
            color={avatarColor}
            size={80}
            showEditBadge
          />
          <Text style={{ fontSize: 12, color: t.textTertiary, marginTop: 10 }}>
            Choose a colour below
          </Text>
        </View>

        {/* Avatar colour picker */}
        <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>
          Avatar Colour
        </Text>
        <View style={styles.colorRow}>
          {AVATAR_COLORS.map((c) => {
            const active = avatarColor === c;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setAvatarColor(c)}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c },
                  active && styles.colorSwatchActive,
                ]}
              >
                {active && (
                  <Check size={16} color="white" strokeWidth={3} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Name */}
        <Input
          label="Full Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="name"
          placeholder="Alex Johnson"
          error={errors.name}
          returnKeyType="next"
        />

        {/* Email */}
        <Input
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email}
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />

        {/* Info note */}
        <View style={[styles.infoBox, { backgroundColor: t.surface2, borderColor: t.border }]}>
          <Text style={{ fontSize: 12, color: t.textSecondary, lineHeight: 18 }}>
            Your name and email are used across the app. Changing your email may
            require you to verify the new address.
          </Text>
        </View>

        <Button
          label="Save Changes"
          fullWidth
          onPress={handleSave}
          loading={saving}
          style={{ marginTop: 8 }}
        />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  colorSwatch: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  colorSwatchActive: {
    transform: [{ scale: 1.15 }],
  },
  infoBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
});
