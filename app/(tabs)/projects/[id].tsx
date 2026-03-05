import React, { useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useProjectStore } from '@/store/project.store';
import { projectApi, taskApi } from '@/services/api';
import { TaskCard } from '@/components/ui/TaskCard';
import { useTaskStore } from '@/store/task.store';
import type { Project, Task } from '@/types';

export default function ProjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useAppTheme();
  const router = useRouter();
  const { projects, updateProject, removeProject } = useProjectStore();
  const { tasks, setTasks, toggleTask, isLoading, setLoading } = useTaskStore();
  const project = projects.find((p) => p.id === id);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await taskApi.list({ projectId: id });
      const payload = data as { data: Task[] };
      setTasks(payload.data);
    } catch { } finally { setLoading(false); }
  }, [id, setTasks, setLoading]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = () => {
    Alert.alert('Delete Project', 'This will delete all tasks in this project.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await projectApi.remove(id!);
          removeProject(id!);
          router.back();
        } catch { Alert.alert('Error', 'Failed to delete'); }
      }},
    ]);
  };

  const handleToggle = async (task: Task) => {
    toggleTask(task.id);
    try { await taskApi.toggle(task.id); } catch { toggleTask(task.id); }
  };

  const total = tasks.length;
  const done = tasks.filter((x) => x.status === 'DONE').length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Header with project color */}
      <View style={[styles.header, { backgroundColor: project?.color ?? t.accent }]}>
        <View style={styles.orb} />
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={{ color: 'white', fontSize: 18 }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 28, marginBottom: 4 }}>{project?.emoji ?? '📁'}</Text>
        <Text style={styles.title}>{project?.name ?? 'Project'}</Text>
        <Text style={styles.count}>{total} task{total !== 1 ? 's' : ''}</Text>
        <View style={[styles.pb, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
          <View style={[styles.pbFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.pct}>{pct}% complete</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={t.accent} />}
      >
        {tasks.length === 0 && !isLoading ? (
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>✓</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: t.textPrimary }}>No tasks yet</Text>
          </View>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task}
              onToggle={() => handleToggle(task)}
              onPress={() => router.push(`/(tabs)/tasks/${task.id}`)} />
          ))
        )}

        {project && (
          <TouchableOpacity onPress={handleDelete} style={[styles.deleteBtn, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <Text style={{ color: '#DC2626', fontWeight: '600', fontSize: 14 }}>🗑 Delete Project</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: project?.color ?? t.accent }]}
        onPress={() => router.push('/(tabs)/tasks/create')}
      >
        <Text style={{ color: 'white', fontSize: 24 }}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 20, paddingTop: 48, overflow: 'hidden', position: 'relative' },
  orb: { position: 'absolute', width: 200, height: 200, borderRadius: 100, top: -60, right: -60, backgroundColor: 'rgba(255,255,255,0.1)' },
  backBtn: { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: 'white', letterSpacing: -0.8, marginBottom: 4 },
  count: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 12 },
  pb: { height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  pbFill: { height: '100%', backgroundColor: 'white', borderRadius: 2 },
  pct: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  deleteBtn: { marginTop: 24, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
});
