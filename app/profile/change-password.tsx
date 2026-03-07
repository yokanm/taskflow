/**
 * @file app/profile/change-password.tsx
 * @description Change password screen with strength indicator.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { userApi } from '@/services/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Eye, EyeOff, ShieldCheck, Check, X } from 'lucide-react-native';

const PASSWORD_RULES = [
  { label: 'At least 8 characters',  test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter',   test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number',             test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character',  test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function getPasswordStrength(password: string) {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  if (passed === 0) return { label: '',       color: 'transparent', pct: 0   };
  if (passed === 1) return { label: 'Weak',   color: '#EF4444',     pct: 25  };
  if (passed === 2) return { label: 'Fair',   color: '#F59E0B',     pct: 50  };
  if (passed === 3) return { label: 'Good',   color: '#3B82F6',     pct: 75  };
  return              { label: 'Strong', color: '#22C55E',     pct: 100 };
}

export default function ChangePassword() {
  const t = useAppTheme();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent]         = useState(false);
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [saving, setSaving]                   = useState(false);
  const [errors, setErrors]                   = useState<Record<string, string>>({});
  const [success, setSuccess]                 = useState(false);

  const strength = getPasswordStrength(newPassword);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!currentPassword) errs.currentPassword = 'Current password is required';
    if (!newPassword)     errs.newPassword = 'New password is required';
    else if (!PASSWORD_RULES.every((r) => r.test(newPassword))) {
      errs.newPassword = 'Password does not meet all requirements';
    }
    if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await userApi.changePassword({ currentPassword, newPassword });
      setSuccess(true);
      setTimeout(() => router.back(), 1500);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
        <View style={[styles.successCard, { backgroundColor: t.surface, borderColor: '#22C55E30' }]}>
          <View style={[styles.successIcon, { backgroundColor: '#DCFCE7' }]}>
            <ShieldCheck size={36} color="#22C55E" strokeWidth={2} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: t.textPrimary, marginTop: 14 }}>
            Password Changed!
          </Text>
          <Text style={{ fontSize: 13, color: t.textSecondary, marginTop: 6, textAlign: 'center' }}>
            Your password has been updated successfully.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
          Change Password
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <View style={[styles.lockIcon, { backgroundColor: t.accentLight }]}>
            <ShieldCheck size={32} color={t.accent} strokeWidth={1.5} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '600', color: t.textPrimary, marginTop: 12 }}>
            Set a new password
          </Text>
          <Text style={{ fontSize: 13, color: t.textSecondary, marginTop: 4, textAlign: 'center' }}>
            Must be different from your current password
          </Text>
        </View>

        <Input
          label="Current Password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry={!showCurrent}
          placeholder="••••••••"
          error={errors.currentPassword}
          returnKeyType="next"
          rightIcon={
            <TouchableOpacity onPress={() => setShowCurrent((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {showCurrent
                ? <EyeOff size={16} color={t.textTertiary} strokeWidth={2} />
                : <Eye size={16} color={t.textTertiary} strokeWidth={2} />}
            </TouchableOpacity>
          }
        />

        <Input
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showNew}
          placeholder="••••••••"
          error={errors.newPassword}
          returnKeyType="next"
          rightIcon={
            <TouchableOpacity onPress={() => setShowNew((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {showNew
                ? <EyeOff size={16} color={t.textTertiary} strokeWidth={2} />
                : <Eye size={16} color={t.textTertiary} strokeWidth={2} />}
            </TouchableOpacity>
          }
        />

        {/* Strength indicator */}
        {newPassword.length > 0 && (
          <View style={{ marginTop: -8, marginBottom: 16 }}>
            <View style={[styles.strengthBar, { backgroundColor: t.surface2 }]}>
              <View
                style={[
                  styles.strengthFill,
                  {
                    width: `${strength.pct}%` as `${number}%`,
                    backgroundColor: strength.color,
                  },
                ]}
              />
            </View>
            {strength.label ? (
              <Text style={{ fontSize: 11, fontWeight: '600', color: strength.color, marginTop: 4 }}>
                {strength.label}
              </Text>
            ) : null}
            <View style={{ marginTop: 8, gap: 5 }}>
              {PASSWORD_RULES.map((rule) => {
                const pass = rule.test(newPassword);
                return (
                  <View key={rule.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {pass
                      ? <Check size={12} color="#22C55E" strokeWidth={3} />
                      : <X size={12} color={t.border} strokeWidth={3} />
                    }
                    <Text style={{ fontSize: 11, color: pass ? t.textSecondary : t.textTertiary }}>
                      {rule.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <Input
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirm}
          placeholder="••••••••"
          error={errors.confirmPassword}
          returnKeyType="done"
          onSubmitEditing={handleSave}
          rightIcon={
            <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {showConfirm
                ? <EyeOff size={16} color={t.textTertiary} strokeWidth={2} />
                : <Eye size={16} color={t.textTertiary} strokeWidth={2} />}
            </TouchableOpacity>
          }
        />

        <Button
          label="Update Password"
          fullWidth
          onPress={handleSave}
          loading={saving}
          style={{ marginTop: 12 }}
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
  lockIcon: {
    width: 72, height: 72, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  strengthBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 2 },
  successCard: {
    padding: 32, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', marginHorizontal: 32,
  },
  successIcon: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
});
