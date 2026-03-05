import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useTaskStore } from '@/store/task.store';
import { taskApi } from '@/services/api';
import { TaskCard } from '@/components/ui/TaskCard';
import { TaskSkeleton } from '@/components/ui/Skeleton';
import type { Task, TaskStatus } from '@/types';

type Filter = 'ALL' | TaskStatus;
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'TODO', label: 'Todo' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'DONE', label: 'Done' },
];

export default function Tasks() {
  const t = useAppTheme();
  const router = useRouter();
  const { tasks, isLoading, setTasks, setLoading, toggleTask } = useTaskStore();
  const [filter, setFilter] = useState<Filter>('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await taskApi.list();
      const payload = data as { data: Task[] };
      setTasks(payload.data);
    } catch { } finally { setLoading(false); }
  }, [setTasks, setLoading]);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'ALL' ? tasks : tasks.filter((t) => t.status === filter);

  const groups = [
    { key: 'TODO' as TaskStatus, label: 'To Do', dot: t.textSecondary },
    { key: 'IN_PROGRESS' as TaskStatus, label: 'In Progress', dot: '#3B82F6' },
    { key: 'DONE' as TaskStatus, label: 'Done', dot: '#22C55E' },
  ];

  const handleToggle = async (task: Task) => {
    toggleTask(task.id);
    try { await taskApi.toggle(task.id); } catch { toggleTask(task.id); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Header */}
      <View style={[styles.header]}>
        <View style={[styles.iconBtn, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={{ color: t.textPrimary }}>‹</Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: t.textPrimary, letterSpacing: -0.4 }}>My Tasks</Text>
        <View style={[styles.iconBtn, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={{ color: t.textPrimary }}>⊟</Text>
        </View>
      </View>

      {/* Filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 14, gap: 8, flexDirection: 'row' }}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f.key} onPress={() => setFilter(f.key)} style={[styles.pill,
            { backgroundColor: filter === f.key ? t.accent : t.surface2, borderColor: filter === f.key ? t.accent : t.border }]}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: filter === f.key ? 'white' : t.textSecondary }}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={t.accent} />}
      >
        {isLoading ? (
          <>{[1,2,3,4].map((i) => <TaskSkeleton key={i} />)}</>
        ) : filter !== 'ALL' ? (
          filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>📭</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: t.textPrimary }}>No tasks here</Text>
            </View>
          ) : (
            filtered.map((task) => (
              <TaskCard key={task.id} task={task}
                onToggle={() => handleToggle(task)}
                onPress={() => router.push(`/(tabs)/tasks/${task.id}`)}
                showProject />
            ))
          )
        ) : (
          groups.map(({ key, label, dot }) => {
            const items = tasks.filter((x) => x.status === key);
            if (items.length === 0) return null;
            return (
              <View key={key}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: key !== 'TODO' ? 6 : 0 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot }} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: t.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</Text>
                  <View style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: t.textSecondary }}>{items.length}</Text>
                  </View>
                </View>
                {items.map((task) => (
                  <TaskCard key={task.id} task={task}
                    onToggle={() => handleToggle(task)}
                    onPress={() => router.push(`/(tabs)/tasks/${task.id}`)}
                    showProject />
                ))}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: t.accent, shadowColor: t.accentShadow }]}
        onPress={() => router.push('/(tabs)/tasks/create')}
      >
        <Text style={{ color: 'white', fontSize: 24, fontWeight: '300', lineHeight: 26 }}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pill: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 100, borderWidth: 1 },
  fab: { position: 'absolute', bottom: 90, right: 20, width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 20, elevation: 8 },
});
