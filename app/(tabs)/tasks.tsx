/**
 * @file app/(tabs)/tasks.tsx
 * @description Tasks screen — status cycling with proper icons.
 * Toggle cycles: TODO → IN_PROGRESS → DONE → TODO
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
import { Plus, CheckSquare, Circle, Play, CheckCircle2 } from 'lucide-react-native';

type Filter = 'ALL' | TaskStatus;

const FILTERS: { key: Filter; label: string; Icon: React.ComponentType<any>; activeColor: string }[] = [
  { key: 'ALL',         label: 'All',         Icon: CheckSquare,  activeColor: '' },
  { key: 'TODO',        label: 'To Do',       Icon: Circle,       activeColor: '#A0A3B8' },
  { key: 'IN_PROGRESS', label: 'In Progress', Icon: Play,         activeColor: '#3B82F6' },
  { key: 'DONE',        label: 'Done',        Icon: CheckCircle2, activeColor: '#22C55E' },
];

const STATUS_GROUPS = [
  { key: 'TODO'        as TaskStatus, label: 'To Do',       dot: '#A0A3B8' },
  { key: 'IN_PROGRESS' as TaskStatus, label: 'In Progress', dot: '#3B82F6' },
  { key: 'DONE'        as TaskStatus, label: 'Done',        dot: '#22C55E' },
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
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [setTasks, setLoading]);

  useEffect(() => { load(); }, [load]);

  const filtered =
    filter === 'ALL' ? tasks : tasks.filter((t) => t.status === filter);

  const handleToggle = async (task: Task) => {
    toggleTask(task.id);
    try {
      const res = await taskApi.toggle(task.id);
      updateTask(task.id, { status: res.data.status });
    } catch {
      toggleTask(task.id); // revert
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <View>
          <Text style={{ fontSize: 12, color: t.textTertiary }}>
            {tasks.length} total task{tasks.length !== 1 ? 's' : ''}
          </Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: t.textPrimary, letterSpacing: -0.5 }}>
            My Tasks
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: t.accent }]}
          onPress={() => router.push('/tasks/create')}
        >
          <Plus size={20} color="white" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8, flexDirection: 'row' }}
      >
        {FILTERS.map((f) => {
          const isActive = filter === f.key;
          const activeColor = f.key === 'ALL' ? t.accent : f.activeColor;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.pill,
                {
                  backgroundColor: isActive ? (f.key === 'ALL' ? t.accent : activeColor + '18') : t.surface2,
                  borderColor: isActive ? (f.key === 'ALL' ? t.accent : activeColor) : t.border,
                },
              ]}
            >
              <f.Icon
                size={12}
                color={isActive ? (f.key === 'ALL' ? 'white' : activeColor) : t.textSecondary}
                strokeWidth={2.5}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: isActive ? (f.key === 'ALL' ? 'white' : activeColor) : t.textSecondary,
                }}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={t.accent} />}
      >
        {isLoading ? (
          <>{[1, 2, 3, 4].map((i) => <TaskSkeleton key={i} />)}</>
        ) : filter !== 'ALL' ? (
          filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <View style={[styles.emptyIcon, { backgroundColor: t.surface2 }]}>
                <CheckSquare size={32} color={t.textTertiary} strokeWidth={1.5} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: t.textPrimary, marginTop: 14 }}>
                No tasks here
              </Text>
              <Text style={{ fontSize: 13, color: t.textSecondary, marginTop: 4 }}>
                {filter === 'TODO' ? 'Nothing to do!' : filter === 'IN_PROGRESS' ? 'No active tasks' : 'Nothing done yet'}
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
              <View key={key} style={{ marginBottom: 6 }}>
                <View style={styles.groupHeader}>
                  <View style={[styles.groupDot, { backgroundColor: dot }]} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: t.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                    {label}
                  </Text>
                  <View style={[styles.groupCount, { backgroundColor: t.surface2 }]}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: t.textSecondary }}>{items.length}</Text>
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

      {/* FAB */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: t.accent,
            ...(Platform.OS === 'web'
              ? { boxShadow: `0px 8px 20px ${t.accent}33` }
              : { shadowColor: t.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 8 }),
          },
        ]}
        onPress={() => router.push('/tasks/create')}
      >
        <Plus size={24} color="white" strokeWidth={2.5} />
      </TouchableOpacity>
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
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1.5,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    marginTop: 4,
  },
  groupDot: { width: 8, height: 8, borderRadius: 4 },
  groupCount: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
