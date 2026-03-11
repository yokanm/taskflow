/**
 * @file app/(auth)/register.tsx
 * FIXES:
 * 1. Android keyboard: KeyboardAvoidingView behavior="height" + keyboardVerticalOffset
 * 2. Web inputs: no browser outline clash, proper sizing
 * 3. Deprecated shadow* replaced with boxShadow / elevation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/services/api';
import { registerSchema, getFieldErrors } from '@/services/validators';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { User } from '@/types';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter',  test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number',            test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function getPasswordStrength(password: string) {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  if (passed === 0) return { label: '',       color: 'transparent', percentage: 0   };
  if (passed === 1) return { label: 'Weak',   color: '#EF4444',     percentage: 25  };
  if (passed === 2) return { label: 'Fair',   color: '#F59E0B',     percentage: 50  };
  if (passed === 3) return { label: 'Good',   color: '#3B82F6',     percentage: 75  };
  return              { label: 'Strong', color: '#22C55E',     percentage: 100 };
}

export default function Register() {
  const t       = useAppTheme();
  const router  = useRouter();
  const { setAuth } = useAuthStore();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState<Record<string, string>>({});

  const strength = getPasswordStrength(password);

  function validate(): boolean {
    const result = registerSchema.safeParse({
      name: name.trim(),
      email: email.trim(),
      password,
      confirmPassword: confirm,
    });
    if (!result.success) { setErrors(getFieldErrors(result.error)); return false; }
    setErrors({});
    return true;
  }

  async function handleRegister(): Promise<void> {
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await authApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      setAuth(response.user as unknown as User, response.accessToken);
      router.replace('/(tabs)');
    } catch (err) {
      setErrors({
        general: err instanceof Error
          ? err.message
          : 'Registration failed. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'android' ? 24 : 0}
        enabled={Platform.OS !== 'web'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <TouchableOpacity
              style={[styles.backBtn, { backgroundColor: t.surface, borderColor: t.border }]}
              onPress={() => router.back()}
            >
              <Text style={{ fontSize: 18, color: t.textPrimary }}>‹</Text>
            </TouchableOpacity>

            <Text style={[styles.heading, { color: t.textPrimary }]}>Create Account ✨</Text>
            <Text style={[styles.sub, { color: t.textSecondary }]}>
              Start managing your tasks today
            </Text>

            {errors.general ? (
              <View style={[styles.errorBanner, { backgroundColor: '#FEE2E2' }]}>
                <Text style={{ color: '#DC2626', fontSize: 13 }}>{errors.general}</Text>
              </View>
            ) : null}

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

            <Input
              label="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email}
              returnKeyType="next"
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              placeholder="••••••••"
              error={errors.password}
              returnKeyType="next"
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowPass(!showPass)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={{ color: t.textTertiary, fontSize: 12, fontWeight: '600' }}>
                    {showPass ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              }
            />

            {/* Password strength */}
            {password.length > 0 ? (
              <View style={{ marginTop: -8, marginBottom: 16 }}>
                <View style={[styles.strengthOuter, { backgroundColor: t.surface2 }]}>
                  <View
                    style={[
                      styles.strengthInner,
                      { width: `${strength.percentage}%` as `${number}%`, backgroundColor: strength.color },
                    ]}
                  />
                </View>
                {strength.label ? (
                  <Text style={{ fontSize: 11, fontWeight: '600', color: strength.color, marginTop: 4 }}>
                    {strength.label}
                  </Text>
                ) : null}
                <View style={{ marginTop: 8, gap: 4 }}>
                  {PASSWORD_RULES.map((rule) => (
                    <View key={rule.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View
                        style={[
                          styles.ruleDot,
                          { backgroundColor: rule.test(password) ? '#22C55E' : t.border },
                        ]}
                      />
                      <Text
                        style={{
                          fontSize: 11,
                          color: rule.test(password) ? t.textSecondary : t.textTertiary,
                        }}
                      >
                        {rule.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <Input
              label="Confirm Password"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showPass}
              placeholder="••••••••"
              error={errors.confirmPassword}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />

            <Button
              label="Create Account"
              fullWidth
              onPress={handleRegister}
              loading={loading}
              style={{ marginTop: 8, marginBottom: 24 }}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Text style={{ color: t.textSecondary, fontSize: 14 }}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text style={{ color: t.accent, fontWeight: '700', fontSize: 14 }}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { padding: 24, paddingTop: 12, flex: 1 },
  backBtn:       {
    width: 36, height: 36, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  heading:       { fontSize: 24, fontWeight: '700', letterSpacing: -0.8, marginBottom: 6 },
  sub:           { fontSize: 14, marginBottom: 28 },
  errorBanner:   { padding: 12, borderRadius: 10, marginBottom: 16 },
  strengthOuter: { height: 4, borderRadius: 2, overflow: 'hidden' },
  strengthInner: { height: '100%', borderRadius: 2 },
  ruleDot:       { width: 6, height: 6, borderRadius: 3 },
});
