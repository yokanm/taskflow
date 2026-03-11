/**
 * @file app/(tabs)/profile.tsx
 *
 * FIXES vs previous version:
 * 1. "Change Password" SettingsRow had no onPress — button was visually
 *    present but completely non-functional. Now navigates to
 *    /profile/change-password which has the full form.
 * 2. "Edit Profile" navigated to /profile/appearance (the theme screen).
 *    Fixed to navigate to /profile/edit-profile.
 * 3. Profile card edit button (✏️) also fixed to go to /profile/edit-profile.
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Switch, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/auth.store';
import { useTaskStore } from '@/store/task.store';
import { useProjectStore } from '@/store/project.store';
import { authApi } from '@/services/api';
import { Avatar } from '@/components/ui/Avatar';

// ─── Settings row ─────────────────────────────────────────────────────────────

function SettingsRow({
  icon, iconBg, label, value, showChevron = false, onPress, isRed = false, rightEl,
}: {
  icon:         string;
  iconBg:       string;
  label:        string;
  value?:       string;
  showChevron?: boolean;
  onPress?:     () => void;
  isRed?:       boolean;
  rightEl?:     React.ReactNode;
}) {
  const t = useAppTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.row, { borderBottomColor: t.border }]}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Text style={{ fontSize: 14 }}>{icon}</Text>
      </View>
      <Text style={{
        flex: 1, fontSize: 14, fontWeight: '500',
        color: isRed ? '#EF4444' : t.textPrimary,
      }}>
        {label}
      </Text>
      {value   ? <Text style={{ fontSize: 12, color: t.textTertiary, marginRight: 4 }}>{value}</Text> : null}
      {rightEl}
      {showChevron ? <Text style={{ color: t.textTertiary, fontSize: 14 }}>›</Text> : null}
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function Profile() {
  const t      = useAppTheme();
  const router = useRouter();

  const { user, logout }            = useAuthStore();
  const { tasks, clearTasks }       = useTaskStore();
  const { projects, clearProjects } = useProjectStore();

  const totalDone    = tasks.filter((task) => task.status === 'DONE').length;
  const projectCount = projects.length;

  const [pushEnabled,      setPushEnabled]      = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          try { await authApi.logout(); } catch { /* clear local state regardless */ }
          logout();
          clearTasks();
          clearProjects();
          router.replace('/(auth)');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{
          fontSize: 24, fontWeight: '700', color: t.textPrimary,
          letterSpacing: -0.8, marginBottom: 16,
        }}>
          Profile
        </Text>

        {/* Profile card */}
        <View style={[
          styles.card,
          {
            backgroundColor: t.surface, borderColor: t.border,
            flexDirection: 'row', alignItems: 'center', gap: 14,
          },
        ]}>
          <Avatar
            name={user?.name}
            color={user?.avatarColor}
            imageUri={user?.profileImage}
            size={64}
          />
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 18, fontWeight: '700',
              color: t.textPrimary, letterSpacing: -0.3,
            }}>
              {user?.name}
            </Text>
            <Text style={{ fontSize: 13, color: t.textSecondary, marginTop: 2 }}>
              {user?.email}
            </Text>
          </View>
          {/* FIX: was going to /profile/appearance — should go to /profile/edit-profile */}
          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: t.surface2 }]}
            onPress={() => router.push('/profile/edit-profile')}
          >
            <Text style={{ fontSize: 14 }}>✏️</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          {[
            { dot: '#22C55E', num: totalDone,    label: 'Done'     },
            { dot: t.accent,  num: projectCount, label: 'Projects' },
            { dot: '#F59E0B', num: '7🔥',        label: 'Streak'   },
          ].map((s) => (
            <View
              key={s.label}
              style={[styles.statCard, { backgroundColor: t.surface, borderColor: t.border }]}
            >
              <View style={{
                width: 6, height: 6, borderRadius: 3,
                backgroundColor: s.dot, marginBottom: 6, alignSelf: 'center',
              }} />
              <Text style={{
                fontSize: 20, fontWeight: '700', color: t.textPrimary,
                letterSpacing: -0.5, textAlign: 'center',
              }}>
                {s.num}
              </Text>
              <Text style={{
                fontSize: 10, color: t.textTertiary, textTransform: 'uppercase',
                letterSpacing: 0.4, textAlign: 'center', marginTop: 2,
              }}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Notifications */}
        <Text style={[styles.groupTitle, { color: t.textTertiary }]}>Notifications</Text>
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <SettingsRow
            icon="🔔" iconBg="#EFF6FF" label="Push Notifications"
            rightEl={
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ false: t.border, true: t.accent }}
              />
            }
          />
          <SettingsRow
            icon="⏰" iconBg="#EFF6FF" label="Task Reminders"
            rightEl={
              <Switch
                value={remindersEnabled}
                onValueChange={setRemindersEnabled}
                trackColor={{ false: t.border, true: t.accent }}
              />
            }
          />
        </View>

        {/* Appearance */}
        <Text style={[styles.groupTitle, { color: t.textTertiary }]}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <SettingsRow
            icon="🌙" iconBg={t.accentLight} label="Theme"
            value={t.isDark ? 'Dark' : 'Light'} showChevron
            onPress={() => router.push('/profile/appearance')}
          />
          <SettingsRow
            icon="🎨" iconBg={t.accentLight} label="Accent Color"
            rightEl={
              <View style={{
                width: 20, height: 20, borderRadius: 10,
                backgroundColor: t.accent, marginRight: 4,
              }} />
            }
            showChevron
            onPress={() => router.push('/profile/appearance')}
          />
        </View>

        {/* Account */}
        <Text style={[styles.groupTitle, { color: t.textTertiary }]}>Account</Text>
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          {/* FIX: was navigating to /profile/appearance */}
          <SettingsRow
            icon="👤" iconBg={t.surface2} label="Edit Profile" showChevron
            onPress={() => router.push('/profile/edit-profile')}
          />
          {/* FIX: onPress was undefined — button did nothing */}
          <SettingsRow
            icon="🔒" iconBg={t.surface2} label="Change Password" showChevron
            onPress={() => router.push('/profile/change-password')}
          />
          <SettingsRow
            icon="🌐" iconBg={t.surface2} label="Language" value="English" showChevron
          />
          <SettingsRow
            icon="🚪" iconBg="#FEF2F2" label="Sign Out" isRed onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card:       { borderRadius: 16, borderWidth: 1, overflow: 'hidden', padding: 16, marginBottom: 12 },
  editBtn:    { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statCard:   { flex: 1, borderRadius: 12, padding: 12, borderWidth: 1 },
  groupTitle: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 0.7, marginBottom: 8, marginTop: 4,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingVertical: 12, borderBottomWidth: 1,
  },
  rowIcon: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
});
