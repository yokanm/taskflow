/**
 * @file app/projects/[id].tsx
 *
 * FIX vs previous version:
 * The original code called `setTasks(result.data)` (the global Zustand setter)
 * with only the tasks belonging to this project. This silently replaced ALL
 * tasks in the global store with a subset — meaning navigating back to the
 * Home or Tasks tab would show an incomplete or empty task list until the
 * user manually pulled to refresh.
 *
 * Solution: use LOCAL component state (`projectTasks`) for the project detail
 * view. The global store is only touched when toggling a task (we call
 * `updateTask` to keep the status in sync), never `setTasks`.
 */

import { TaskCard } from '@/components/ui/TaskCard';
import { useAppTheme } from '@/context/ThemeContext';
import { projectApi, taskApi } from '@/services/api';
import { useProjectStore } from '@/store/project.store';
import { useTaskStore } from '@/store/task.store';
import type { Task } from '@/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TaskSkeleton } from '@/components/ui/Skeleton';
import { Plus, ArrowLeft } from 'lucide-react-native';

export default function ProjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t      = useAppTheme();
  const router = useRouter();

  const { projects, removeProject } = useProjectStore();

  // FIX: use LOCAL state for this project's tasks.
  // The global store's setTasks() is NOT called here — doing so would
  // replace all tasks with only this project's tasks.
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);

  // We still use updateTask from the global store so that toggling
  // a task here stays in sync with the Home and Tasks tabs.
  const { updateTask } = useTaskStore();

  const project = projects.find((p) => p.id === id);

  // ── Load this project's tasks into LOCAL state ─────────────────────────────
  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const result = await taskApi.list({ projectId: id });
      // FIX: update local state, NOT the global store
      setProjectTasks(result.data);
    } catch {
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // ── Delete project ─────────────────────────────────────────────────────────
  const handleDelete = () => {
    Alert.alert(
      'Delete Project',
      'This will also remove all tasks in this project. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            if (!id) return;
            try {
              await projectApi.remove(id);
              removeProject(id);
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to delete project');
            }
          },
        },
      ]
    );
  };

  // ── Toggle task ────────────────────────────────────────────────────────────
  // Updates both local state (for this screen) and the global store
  // (so the Home and Tasks tabs stay accurate without a full reload).
  const handleToggle = async (task: Task) => {
    // Optimistic update — local state
    const nextStatus = task.status === 'DONE'
      ? ('TODO' as const)
      : task.status === 'TODO'
        ? ('IN_PROGRESS' as const)
        : ('DONE' as const);

    setProjectTasks((prev) =>
      prev.map((t) => t.id === task.id ? { ...t, status: nextStatus } : t)
    );

    try {
      const res = await taskApi.toggle(task.id);
      // Sync actual server status back to both stores
      setProjectTasks((prev) =>
        prev.map((t) => t.id === task.id ? { ...t, status: res.data.status } : t)
      );
      // FIX: use updateTask (not setTasks) to patch the global store entry
      updateTask(task.id, { status: res.data.status });
    } catch {
      // Revert local state on failure
      setProjectTasks((prev) =>
        prev.map((t) => t.id === task.id ? { ...t, status: task.status } : t)
      );
    }
  };

  // ── Derived stats ──────────────────────────────────────────────────────────
  const total = projectTasks.length;
  const done  = projectTasks.filter((x) => x.status === 'DONE').length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>

      {/* Coloured project header */}
      <View style={[styles.header, { backgroundColor: project?.color ?? t.accent }]}>
        <View style={styles.orb} />

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={18} color="white" strokeWidth={2} />
        </TouchableOpacity>

        <Text style={{ fontSize: 28, marginBottom: 4 }}>
          {project?.emoji ?? '📁'}
        </Text>
        <Text style={styles.title}>{project?.name ?? 'Project'}</Text>
        <Text style={styles.count}>{total} task{total !== 1 ? 's' : ''}</Text>

        <View style={[styles.pb, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
          <View style={[styles.pbFill, { width: `${pct}%` as `${number}%` }]} />
        </View>
        <Text style={styles.pct}>{pct}% complete</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={load}
            tintColor={project?.color ?? t.accent}
          />
        }
      >
        {isLoading ? (
          <>{[1, 2, 3].map((i) => <TaskSkeleton key={i} />)}</>
        ) : projectTasks.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📝</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: t.textPrimary }}>
              No tasks yet
            </Text>
            <Text style={{ fontSize: 13, color: t.textSecondary, marginTop: 4, textAlign: 'center' }}>
              Tap + to add the first task to this project
            </Text>
          </View>
        ) : (
          projectTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={() => handleToggle(task)}
              onPress={() => router.push(`/tasks/${task.id}`)}
            />
          ))
        )}

        {/* Delete project button */}
        {project && !isLoading ? (
          <TouchableOpacity
            onPress={handleDelete}
            style={[styles.deleteBtn, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
          >
            <Text style={{ color: '#DC2626', fontWeight: '600', fontSize: 14 }}>
              🗑 Delete Project
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: project?.color ?? t.accent,
            ...(Platform.OS === 'web'
              ? { boxShadow: `0px 4px 8px ${project?.color ?? t.accent}66` }
              : {
                  shadowColor:   project?.color ?? t.accent,
                  shadowOffset:  { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius:  8,
                  elevation:     6,
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
  header: {
    padding: 20, paddingTop: 48,
    overflow: 'hidden', position: 'relative',
  },
  orb: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    top: -60, right: -60, backgroundColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: {
    width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  title: {
    fontSize: 24, fontWeight: '700', color: 'white',
    letterSpacing: -0.8, marginBottom: 4,
  },
  count:  { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 12 },
  pb:     { height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  pbFill: { height: '100%', backgroundColor: 'white', borderRadius: 2 },
  pct:    { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  deleteBtn: {
    marginTop: 24, padding: 14, borderRadius: 12,
    borderWidth: 1, alignItems: 'center',
  },
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
});
