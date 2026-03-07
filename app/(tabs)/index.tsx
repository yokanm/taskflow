/**
 * @file app/(tabs)/index.tsx
 * @description Home Dashboard screen.
 *
 * FIX: Removed Axios-style `const { data } = await taskApi.list()` pattern.
 * The Fetch-based API returns the JSON body directly, so we use:
 *   const result = await taskApi.list();
 *   setTasks(result.data);
 */

import React, { useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/auth.store';
import { useTaskStore } from '@/store/task.store';
import { taskApi } from '@/services/api';
import { TaskCard } from '@/components/ui/TaskCard';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { TaskSkeleton } from '@/components/ui/Skeleton';
import type { Task } from '@/types';

/** Returns a time-appropriate greeting */
function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function Home() {
  const t      = useAppTheme();
  const router = useRouter();
  const { user }                                    = useAuthStore();
  const { tasks, isLoading, setTasks, setLoading, toggleTask } = useTaskStore();

  // ── Data loading ───────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      // FIX: No destructuring - Fetch returns the body directly
      const result = await taskApi.list();
      setTasks(result.data);
    } catch {
      // Silent fail — RefreshControl lets user retry
    } finally {
      setLoading(false);
    }
  }, [setTasks, setLoading]);

  useEffect(() => { load(); }, [load]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const todayTasks = tasks.filter((task) => {
    if (!task.dueDate) return false;
    const due  = new Date(task.dueDate);
    const now  = new Date();
    return due.getDate()     === now.getDate()
        && due.getMonth()    === now.getMonth()
        && due.getFullYear() === now.getFullYear();
  });

  const doneCount   = tasks.filter((t) => t.status === 'DONE').length;
  const activeCount = tasks.filter((t) => t.status !== 'DONE').length;
  const pct         = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;
  const todayDate   = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const initials    = user?.name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) ?? '??';

  // ── Optimistic task toggle ─────────────────────────────────────────────────
  const handleToggle = async (task: Task) => {
    toggleTask(task.id); // optimistic update
    try {
      await taskApi.toggle(task.id);
    } catch {
      toggleTask(task.id); // revert on failure
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <View>
          <Text style={{ fontSize: 12, fontWeight: '500', color: t.textTertiary }}>{greeting()}</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: t.textPrimary, letterSpacing: -0.5 }}>
            {user?.name ?? 'User'} 👋
          </Text>
          <Text style={{ fontSize: 11, color: t.textTertiary, marginTop: 1, fontFamily: 'monospace' }}>
            {todayDate}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile')}
          style={[styles.avatar, { backgroundColor: t.accent }]}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: 'white' }}>{initials}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={t.accent} />}
      >
        {/* Hero progress card */}
        <View style={[styles.hero, { shadowColor: t.accent }]}>
          <View style={styles.heroOrb} />
          <Text style={styles.heroSub}>TODAY'S PROGRESS</Text>
          <Text style={styles.heroTitle}>
            You have {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', gap: 20, marginBottom: 8 }}>
                <View>
                  <Text style={styles.heroStat}>{doneCount}</Text>
                  <Text style={styles.heroStatLabel}>Done</Text>
                </View>
                <View>
                  <Text style={styles.heroStat}>{activeCount}</Text>
                  <Text style={styles.heroStatLabel}>Remaining</Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 5 }}>
                {pct}% completed today
              </Text>
              <View style={styles.pbarOuter}>
                <View style={[styles.pbarInner, { width: `${pct}%` }]} />
              </View>
            </View>
            <ProgressRing progress={pct} label="Done" />
          </View>
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          {[
            { dot: '#3B82F6', num: todayTasks.length, label: 'Today'  },
            { dot: '#F59E0B', num: activeCount,        label: 'Active' },
            { dot: '#22C55E', num: doneCount,           label: 'Done'   },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: t.surface, borderColor: t.border }]}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: s.dot, marginBottom: 6, alignSelf: 'center' }} />
              <Text style={{ fontSize: 22, fontWeight: '700', color: t.textPrimary, letterSpacing: -0.5, textAlign: 'center' }}>
                {s.num}
              </Text>
              <Text style={{ fontSize: 10, color: t.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center', marginTop: 2 }}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Today's tasks section */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: t.textPrimary }}>Today's Tasks</Text>
            <View style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: t.textSecondary }}>{todayTasks.length}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/tasks')}>
            <Text style={{ color: t.accent, fontSize: 13, fontWeight: '500' }}>See all</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <>{[1, 2, 3].map((i) => <TaskSkeleton key={i} />)}</>
        ) : todayTasks.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🎉</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: t.textPrimary }}>All clear today!</Text>
            <Text style={{ fontSize: 13, color: t.textSecondary, marginTop: 4 }}>No tasks due today</Text>
          </View>
        ) : (
          todayTasks.slice(0, 5).map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={() => handleToggle(task)}
              onPress={() => router.push(`/tasks/${task.id}`)}
              showProject
            />
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: t.accent, shadowColor: t.accent }]}
        onPress={() => router.push('/tasks/create')}
        activeOpacity={0.85}
      >
        <Text style={{ color: 'white', fontSize: 24, fontWeight: '300', lineHeight: 26 }}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header:       { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatar:       { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  hero:         { borderRadius: 20, padding: 20, marginBottom: 16, marginTop: 12, overflow: 'hidden', position: 'relative', backgroundColor: '#6C63FF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 24, elevation: 8 },
  heroOrb:      { position: 'absolute', width: 130, height: 130, borderRadius: 65, top: -30, right: -30, backgroundColor: 'rgba(255,255,255,0.1)' },
  heroSub:      { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  heroTitle:    { fontSize: 22, fontWeight: '700', color: 'white', letterSpacing: -0.5, marginBottom: 14 },
  heroStat:     { fontSize: 24, fontWeight: '700', color: 'white', letterSpacing: -1 },
  heroStatLabel:{ fontSize: 10, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 0.4 },
  pbarOuter:    { height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' },
  pbarInner:    { height: '100%', backgroundColor: 'white', borderRadius: 2 },
  statCard:     { flex: 1, borderRadius: 12, padding: 12, borderWidth: 1 },
  fab:          { position: 'absolute', bottom: 90, right: 20, width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 20, elevation: 8 },
});
