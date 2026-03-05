import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/auth.store';
import { useTaskStore } from '@/store/task.store';
import { useProjectStore } from '@/store/project.store';
import { authApi } from '@/services/api';

function SettingsRow({ icon, iconBg, iconColor, label, value, showChevron = false, onPress, isRed = false, rightEl }: {
  icon: string; iconBg: string; iconColor?: string; label: string;
  value?: string; showChevron?: boolean; onPress?: () => void; isRed?: boolean; rightEl?: React.ReactNode;
}) {
  const t = useAppTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.row, { borderBottomColor: t.border }]} activeOpacity={onPress ? 0.7 : 1}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Text style={{ fontSize: 14 }}>{icon}</Text>
      </View>
      <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: isRed ? '#EF4444' : t.textPrimary }}>{label}</Text>
      {value && <Text style={{ fontSize: 12, color: t.textTertiary, marginRight: 4 }}>{value}</Text>}
      {rightEl}
      {showChevron && <Text style={{ color: t.textTertiary, fontSize: 14 }}>›</Text>}
    </TouchableOpacity>
  );
}

export default function Profile() {
  const t = useAppTheme();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { clearTasks } = useTaskStore();
  const { clearProjects } = useProjectStore();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  const initials = user?.name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) ?? '??';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        try { await authApi.logout(); } catch {}
        logout();
        clearTasks();
        clearProjects();
        router.replace('/(auth)');
      }},
    ]);
  };

  const totalDone = 24; // Would come from stats API

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: t.textPrimary, letterSpacing: -0.8, marginBottom: 16 }}>Profile</Text>

        {/* Profile card */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border, flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
          <View style={[styles.avatar, { backgroundColor: t.accent }]}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: 'white' }}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: t.textPrimary, letterSpacing: -0.3 }}>{user?.name}</Text>
            <Text style={{ fontSize: 13, color: t.textSecondary, marginTop: 2 }}>{user?.email}</Text>
          </View>
          <TouchableOpacity style={[styles.editBtn, { backgroundColor: t.surface2 }]}
            onPress={() => router.push('/(tabs)/profile/appearance')}>
            <Text style={{ fontSize: 14 }}>✏️</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          {[
            { dot: '#22C55E', num: totalDone, label: 'Done' },
            { dot: t.accent,   num: 3,          label: 'Projects' },
            { dot: '#F59E0B', num: '7🔥',       label: 'Streak' },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: t.surface, borderColor: t.border }]}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: s.dot, marginBottom: 6, alignSelf: 'center' }} />
              <Text style={{ fontSize: 20, fontWeight: '700', color: t.textPrimary, letterSpacing: -0.5, textAlign: 'center' }}>{s.num}</Text>
              <Text style={{ fontSize: 10, color: t.textTertiary, textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center', marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Notifications group */}
        <Text style={[styles.groupTitle, { color: t.textTertiary }]}>Notifications</Text>
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <SettingsRow icon="🔔" iconBg="#EFF6FF" label="Push Notifications"
            rightEl={<Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ false: t.border, true: t.accent }} />} />
          <SettingsRow icon="⏰" iconBg="#EFF6FF" label="Task Reminders"
            rightEl={<Switch value={remindersEnabled} onValueChange={setRemindersEnabled} trackColor={{ false: t.border, true: t.accent }} />} />
        </View>

        {/* Appearance group */}
        <Text style={[styles.groupTitle, { color: t.textTertiary }]}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <SettingsRow icon="🌙" iconBg={t.accentLight} label="Theme"
            value={t.isDark ? 'Dark' : 'Light'} showChevron
            onPress={() => router.push('/(tabs)/profile/appearance')} />
          <SettingsRow icon="🎨" iconBg={t.accentLight} label="Accent Color"
            rightEl={<View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: t.accent, marginRight: 4 }} />}
            showChevron onPress={() => router.push('/(tabs)/profile/appearance')} />
        </View>

        {/* Account group */}
        <Text style={[styles.groupTitle, { color: t.textTertiary }]}>Account</Text>
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <SettingsRow icon="👤" iconBg={t.surface2} label="Edit Profile" showChevron
            onPress={() => router.push('/(tabs)/profile/appearance')} />
          <SettingsRow icon="🔒" iconBg={t.surface2} label="Change Password" showChevron />
          <SettingsRow icon="🌐" iconBg={t.surface2} label="Language" value="English" showChevron />
          <SettingsRow icon="🚪" iconBg="#FEF2F2" label="Sign Out" isRed onPress={handleLogout} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', padding: 16, marginBottom: 12 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  editBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statCard: { flex: 1, borderRadius: 12, padding: 12, borderWidth: 1 },
  groupTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
