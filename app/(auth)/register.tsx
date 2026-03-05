import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '../../services/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { User } from '@/types';

const rules = [
  { label: '8+ characters', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'Special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function strength(p: string) {
  const score = rules.filter((r) => r.test(p)).length;
  if (score === 0) return { label: '', color: '#E4E6F0', pct: 0 };
  if (score === 1) return { label: 'Weak', color: '#EF4444', pct: 25 };
  if (score === 2) return { label: 'Fair', color: '#F59E0B', pct: 50 };
  if (score === 3) return { label: 'Good', color: '#84CC16', pct: 75 };
  return { label: 'Strong', color: '#22C55E', pct: 100 };
}

export default function Register() {
  const t = useAppTheme();
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const str = strength(password);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (str.pct < 100) e.password = 'Password does not meet all requirements';
    if (password !== confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await authApi.register({ name: name.trim(), email: email.trim(), password });
      const payload = data as { user: User; accessToken: string };
      setAuth(payload.user, payload.accessToken);
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Registration failed.';
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            <TouchableOpacity style={[styles.backBtn, { backgroundColor: t.surface, borderColor: t.border }]} onPress={() => router.back()}>
              <Text style={{ fontSize: 18, color: t.textPrimary }}>‹</Text>
            </TouchableOpacity>

            <Text style={[styles.heading, { color: t.textPrimary }]}>Create Account</Text>
            <Text style={[styles.sub, { color: t.textSecondary }]}>Join TaskFlow today</Text>

            {errors.general && (
              <View style={{ padding: 12, borderRadius: 10, backgroundColor: '#FEE2E2', marginBottom: 16 }}>
                <Text style={{ color: '#DC2626', fontSize: 13 }}>{errors.general}</Text>
              </View>
            )}

            <Input label="Full Name" value={name} onChangeText={setName} placeholder="Alex Johnson" error={errors.name} autoCapitalize="words" />
            <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com"
              keyboardType="email-address" autoCapitalize="none" error={errors.email} />

            <Input label="Password" value={password} onChangeText={setPassword}
              secureTextEntry={!showPass} placeholder="••••••••" error={errors.password}
              rightIcon={<TouchableOpacity onPress={() => setShowPass(!showPass)}><Text style={{ color: t.textTertiary, fontSize: 12 }}>{showPass ? 'Hide' : 'Show'}</Text></TouchableOpacity>} />

            {/* Strength bar */}
            {password.length > 0 && (
              <View style={{ marginTop: -8, marginBottom: 12 }}>
                <View style={styles.strBar}>
                  {[25, 50, 75, 100].map((seg) => (
                    <View key={seg} style={[styles.strSeg, { backgroundColor: str.pct >= seg ? str.color : t.border }]} />
                  ))}
                  <Text style={{ fontSize: 11, fontWeight: '700', color: str.color, marginLeft: 8, whiteSpace: 'nowrap' } as any}>{str.label}</Text>
                </View>
                {rules.map((r) => {
                  const ok = r.test(password);
                  return (
                    <View key={r.label} style={styles.rule}>
                      <View style={[styles.ruleDot, { backgroundColor: ok ? '#DCFCE7' : '#FEE2E2' }]}>
                        <Text style={{ fontSize: 8, color: ok ? '#16A34A' : '#DC2626', fontWeight: '800' }}>{ok ? '✓' : '✕'}</Text>
                      </View>
                      <Text style={{ fontSize: 11, color: t.textSecondary }}>{r.label}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            <Input label="Confirm Password" value={confirm} onChangeText={setConfirm}
              secureTextEntry={!showPass} placeholder="••••••••" error={errors.confirm} />

            <Button label="Create Account" fullWidth onPress={handleRegister} loading={loading} style={{ marginBottom: 16 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
              <Text style={{ color: t.textSecondary, fontSize: 14 }}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text style={{ color: t.accent, fontWeight: '700', fontSize: 14 }}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 12, flex: 1 },
  backBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  heading: { fontSize: 24, fontWeight: '700', letterSpacing: -0.8, marginBottom: 6 },
  sub: { fontSize: 14, marginBottom: 24 },
  strBar: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  strSeg: { flex: 1, height: 4, borderRadius: 100 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  ruleDot: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
