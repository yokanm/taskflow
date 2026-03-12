/**
 * @file app/(tabs)/tasks.tsx
 * @description Tasks screen — matches TaskFlow v2 S05 design exactly.
 */

import { TaskSkeleton } from '@/components/ui/Skeleton';
import { TaskCard } from '@/components/ui/TaskCard';
import { useAppTheme } from '@/context/ThemeContext';
import { taskApi } from '@/services/api';
import { useTaskStore } from '@/store/task.store';
import type { Task, TaskStatus } from '@/types';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, ChevronLeft, SlidersHorizontal, CheckSquare } from 'lucide-react-native';

type Filter = 'ALL' | TaskStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL',         label: 'All'         },
  { key: 'TODO',        label: 'Todo'        },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'DONE',        label: 'Done'        },
];

const STATUS_GROUPS: { key: TaskStatus; label: string; dot: string }[] = [
  { key: 'TODO',        label: 'To Do',       dot: '#A0A3B8' },
  { key: 'IN_PROGRESS', label: 'In Progress', dot: '#3B82F6' },
  { key: 'DONE',        label: 'Done',        dot: '#22C55E' },
];

export default function Tasks() {
  const t = useAppTheme();
  const router = useRouter();
  const { tasks, isLoading, setTasks, setLoading, toggleTask, updateTask } = useTaskStore();
  const [filter, setFilter] = useState<Filter>('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await taskApi.list();
      setTasks(result.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [setTasks, setLoading]);

  useEffect(() => { load(); }, [load]);

  const filtered =
    filter === 'ALL' ? tasks : tasks.filter((tk) => tk.status === filter);

  const handleToggle = async (task: Task) => {
    toggleTask(task.id);
    try {
      const res = await taskApi.toggle(task.id);
      updateTask(task.id, { status: res.data.status });
    } catch {
      toggleTask(task.id);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: t.surface, borderColor: t.border }]}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={16} color={t.textPrimary} strokeWidth={2} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>My Tasks</Text>

        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: t.surface, borderColor: t.border }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <SlidersHorizontal size={16} color={t.textPrimary} strokeWidth={2} />
          <View style={[styles.accentDot, { backgroundColor: t.accent }]} />
        </TouchableOpacity>
      </View>

      {/* ── Filter pills ───────────────────────────────────── */}
      <View style={styles.pillsOuter}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
        >
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.75}
                style={[
                  styles.pill,
                  { backgroundColor: isActive ? t.accent : t.surface2 },
                ]}
              >
                <Text style={[styles.pillText, { color: isActive ? 'white' : t.textSecondary }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Task list ──────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={load} tintColor={t.accent} />
        }
      >
        {isLoading ? (
          <>{[1, 2, 3, 4].map((i) => <TaskSkeleton key={i} />)}</>

        ) : filter !== 'ALL' ? (
          filtered.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={[styles.emptyIcon, { backgroundColor: t.surface2 }]}>
                <CheckSquare size={32} color={t.textTertiary} strokeWidth={1.5} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: t.textPrimary, marginTop: 14 }}>
                No tasks here
              </Text>
              <Text style={{ fontSize: 13, color: t.textSecondary, marginTop: 4 }}>
                {filter === 'TODO'
                  ? 'Nothing to do!'
                  : filter === 'IN_PROGRESS'
                    ? 'No active tasks'
                    : 'Nothing done yet'}
              </Text>
            </View>
          ) : (
            filtered.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={() => handleToggle(task)}
                onPress={() => router.push(`/tasks/${task.id}`)}
                showProject
              />
            ))
          )

        ) : (
          STATUS_GROUPS.map(({ key, label, dot }) => {
            const items = tasks.filter((x) => x.status === key);
            if (items.length === 0) return null;
            return (
              <View key={key} style={styles.group}>
                {/* Group header: dot · LABEL · count badge */}
                <View style={styles.groupHeader}>
                  <View style={[styles.groupDot, { backgroundColor: dot }]} />
                  <Text style={[styles.groupLabel, { color: t.textSecondary }]}>
                    {label}
                  </Text>
                  <View style={[styles.groupBadge, { backgroundColor: t.surface2 }]}>
                    <Text style={[styles.groupBadgeText, { color: t.textSecondary }]}>
                      {items.length}
                    </Text>
                  </View>
                </View>

                {items.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() => handleToggle(task)}
                    onPress={() => router.push(`/tasks/${task.id}`)}
                    showProject
                  />
                ))}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── FAB ────────────────────────────────────────────── */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: t.accent,
            ...(Platform.OS === 'web'
              ? { boxShadow: `0px 8px 24px ${t.accentShadow}` }
              : {
                  shadowColor: t.accent,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.4,
                  shadowRadius: 20,
                  elevation: 8,
                }),
          },
        ]}
        onPress={() => router.push('/tasks/create')}
        activeOpacity={0.85}
      >
        <Plus size={24} color="white" strokeWidth={2.5} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* ── Header ── */
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  accentDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  /* ── Filter pills ── */
  pillsOuter: {
    paddingTop: 12,
    paddingBottom: 14,
  },
  pillsRow: {
    paddingHorizontal: 20,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    // explicit height = flat compact pill, NOT a tall oval
    height: 32,
    paddingHorizontal: 16,
    borderRadius: 100,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    includeFontPadding: false,   // Android: removes extra vertical padding
    textAlignVertical: 'center',
  },

  /* ── Task list ── */
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 110,
  },

  /* ── Group ── */
  group: {
    marginBottom: 6,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginTop: 6,
  },
  groupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  groupBadge: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* ── Empty state ── */
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── FAB ── */
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});