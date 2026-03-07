/**
 * @file app/tasks/[id].tsx
 * @description Task Detail screen.
 *
 * FIXES:
 * 1. "Edit Task" button now navigates to /tasks/create?id=<taskId>
 *    so the create/edit screen loads the existing task data.
 * 2. Toggle cycles status: TODO → IN_PROGRESS → DONE → TODO
 * 3. Replaced all emoji icons with Lucide icons.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useTaskStore } from '@/store/task.store';
import { taskApi } from '@/services/api';
import { Button } from '@/components/ui/Button';
import type { Task } from '@/types';
import { PRIORITY_STYLES } from '@/constants/theme-config';
import {
  ArrowLeft, Calendar, Flag, Plus, Trash2,
  Edit2, Circle, Play, CheckCircle2, FolderOpen,
  AlertCircle,
} from 'lucide-react-native';

const STATUS_CYCLE = {
  TODO: 'IN_PROGRESS',
  IN_PROGRESS: 'DONE',
  DONE: 'TODO',
} as const;

const STATUS_CONFIG = {
  TODO:        { Icon: Circle,       color: '#A0A3B8', label: 'To Do'       },
  IN_PROGRESS: { Icon: Play,         color: '#3B82F6', label: 'In Progress' },
  DONE:        { Icon: CheckCircle2, color: '#22C55E', label: 'Done'        },
};

export default function TaskDetail() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const t        = useAppTheme();
  const router   = useRouter();
  const { tasks, updateTask, removeTask } = useTaskStore();

  const [task,         setTask]         = useState<Task | null>(tasks.find((x) => x.id === id) ?? null);
  const [loading,      setLoading]      = useState(!task);
  const [toggling,     setToggling]     = useState(false);
  const [subtaskInput, setSubtaskInput] = useState('');

  // ── Load task ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!id) return;
    try {
      const result = await taskApi.get(id);
      setTask(result.data);
      updateTask(id, result.data);
    } catch {
      Alert.alert('Error', 'Task not found');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router, updateTask]);

  useEffect(() => { load(); }, [load]);

  // ── Toggle (cycles status) ─────────────────────────────────────────────────
  const handleToggle = async () => {
    if (!task || toggling) return;
    setToggling(true);
    const nextStatus = STATUS_CYCLE[task.status];
    const next = { ...task, status: nextStatus };
    setTask(next);
    try {
      const res = await taskApi.toggle(task.id);
      const updated = { ...next, status: res.data.status };
      setTask(updated);
      updateTask(task.id, { status: res.data.status });
    } catch {
      setTask(task);
    } finally {
      setToggling(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = () => {
    Alert.alert('Delete Task', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          if (!task) return;
          try {
            await taskApi.remove(task.id);
            removeTask(task.id);
            router.back();
          } catch {
            Alert.alert('Error', 'Failed to delete task');
          }
        },
      },
    ]);
  };

  // ── Add subtask ────────────────────────────────────────────────────────────
  const handleAddSubtask = async () => {
    if (!subtaskInput.trim() || !task) return;
    try {
      await taskApi.addSubtask(task.id, subtaskInput.trim());
      setSubtaskInput('');
      load();
    } catch {
      Alert.alert('Error', 'Failed to add subtask');
    }
  };

  // ── Toggle subtask ─────────────────────────────────────────────────────────
  const handleToggleSubtask = async (subId: string) => {
    if (!task) return;
    setTask((prev) =>
      prev
        ? { ...prev, subTasks: prev.subTasks.map((s) => s.id === subId ? { ...s, done: !s.done } : s) }
        : null
    );
    try {
      await taskApi.toggleSubtask(task.id, subId);
    } catch {
      load();
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading || !task) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: t.textSecondary }}>Loading…</Text>
      </SafeAreaView>
    );
  }

  const pri       = PRIORITY_STYLES[task.priority];
  const statusCfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.TODO;
  const isDone    = task.status === 'DONE';
  const dueDate   = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : null;
  const dueTime = task.dueDate
    ? new Date(task.dueDate).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit',
      })
    : null;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isDone;
  const subDone   = task.subTasks.filter((s) => s.done).length;

  const nextStatus = STATUS_CYCLE[task.status];
  const nextCfg    = STATUS_CONFIG[nextStatus];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Hero header */}
      <View style={[styles.hero, { backgroundColor: t.accent }]}>
        <View style={styles.heroOrb} />
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={18} color="white" strokeWidth={2} />
        </TouchableOpacity>
        {task.project && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 }}>
            <FolderOpen size={11} color="rgba(255,255,255,0.65)" strokeWidth={2} />
            <Text style={styles.heroProject}>{task.project.name}</Text>
          </View>
        )}
        <Text style={styles.heroTitle} numberOfLines={2}>{task.title}</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <View style={[styles.heroBadge, { flexDirection: 'row', gap: 4, alignItems: 'center' }]}>
            <statusCfg.Icon size={11} color="rgba(255,255,255,0.9)" strokeWidth={2.5} />
            <Text style={styles.heroBadgeText}>{statusCfg.label}</Text>
          </View>
          <View style={[styles.heroBadge, { flexDirection: 'row', gap: 4, alignItems: 'center' }]}>
            <Flag size={11} color="rgba(255,255,255,0.9)" strokeWidth={2.5} />
            <Text style={styles.heroBadgeText}>
              {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Info grid */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          {dueDate ? (
            <View
              style={[
                styles.infoCard,
                {
                  flex: 1,
                  backgroundColor: isOverdue ? '#FEF2F2' : t.surface2,
                  borderColor:     isOverdue ? '#FECACA' : t.border,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Calendar size={11} color={isOverdue ? '#EF4444' : t.textTertiary} strokeWidth={2} />
                <Text style={styles.infoLabel}>Deadline</Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: t.textPrimary, marginBottom: 6 }}>
                {dueDate}
              </Text>
              {dueTime && (
                <Text style={{ fontSize: 11, color: t.textSecondary, marginBottom: 6 }}>
                  {dueTime}
                </Text>
              )}
              <View style={[styles.badge, {
                backgroundColor: isOverdue ? '#FEE2E2' : t.accentLight,
                borderColor:     isOverdue ? '#EF4444' : t.accent,
              }]}>
                {isOverdue && <AlertCircle size={9} color="#EF4444" strokeWidth={2.5} />}
                <Text style={{ fontSize: 10, fontWeight: '700', color: isOverdue ? '#DC2626' : t.accent }}>
                  {isOverdue ? 'Overdue' : 'Due soon'}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={[styles.infoCard, { flex: 1, backgroundColor: t.surface2, borderColor: t.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <Flag size={11} color={t.textTertiary} strokeWidth={2} />
              <Text style={styles.infoLabel}>Priority</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: t.isDark ? pri.bgDark : pri.bg, alignSelf: 'flex-start', marginTop: 4 }]}>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: pri.dot }} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: t.isDark ? pri.textDark : pri.text }}>
                {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {task.description ? (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={{ fontSize: 13, color: t.textSecondary, lineHeight: 21 }}>
              {task.description}
            </Text>
          </View>
        ) : null}

        {/* Subtasks */}
        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={styles.sectionTitle}>Subtasks</Text>
            {task.subTasks.length > 0 && (
              <Text style={{ fontSize: 11, fontWeight: '600', color: t.accent }}>
                {subDone} of {task.subTasks.length}
              </Text>
            )}
          </View>

          {task.subTasks.length > 0 && (
            <>
              <View style={[styles.subProgress, { backgroundColor: t.surface2 }]}>
                <View style={[styles.subProgressFill, {
                  width: `${task.subTasks.length > 0 ? (subDone / task.subTasks.length) * 100 : 0}%` as `${number}%`,
                  backgroundColor: t.accent,
                }]} />
              </View>
              {task.subTasks.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => handleToggleSubtask(s.id)}
                  style={[styles.subtaskRow, { borderBottomColor: t.border }]}
                >
                  <View style={[styles.cb, {
                    borderColor:     s.done ? t.accent : t.border,
                    backgroundColor: s.done ? t.accent : 'transparent',
                  }]}>
                    {s.done && <View style={styles.check} />}
                  </View>
                  <Text style={{
                    fontSize: 13, flex: 1,
                    color:              s.done ? t.textTertiary : t.textPrimary,
                    textDecorationLine: s.done ? 'line-through' : 'none',
                  }}>
                    {s.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          <View style={[styles.addSubtask, { borderColor: t.border }]}>
            <TextInput
              value={subtaskInput}
              onChangeText={setSubtaskInput}
              placeholder="Add a subtask…"
              placeholderTextColor={t.textTertiary}
              style={{ flex: 1, fontSize: 12, color: t.textPrimary }}
              onSubmitEditing={handleAddSubtask}
            />
            <TouchableOpacity onPress={handleAddSubtask}>
              <Plus size={18} color={t.accent} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Delete button */}
        <TouchableOpacity
          onPress={handleDelete}
          style={[styles.deleteBtn, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
        >
          <Trash2 size={15} color="#DC2626" strokeWidth={2} />
          <Text style={{ color: '#DC2626', fontWeight: '600', fontSize: 14 }}>
            Delete Task
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom action bar */}
      <View style={[styles.footer, { backgroundColor: t.surface, borderTopColor: t.border }]}>
        <Button
          label={`Mark as ${nextCfg?.label ?? 'Done'}`}
          style={{ flex: 1 }}
          onPress={handleToggle}
          loading={toggling}
        />
        <Button
          label="Edit Task"
          variant="secondary"
          style={{ flex: 1 }}
          icon={<Edit2 size={14} color={t.textPrimary} strokeWidth={2} />}
          // FIX: navigate to create screen with task id so it loads existing data
          onPress={() => router.push(`/tasks/create?id=${task.id}`)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero:            { padding: 20, paddingTop: 56, position: 'relative', overflow: 'hidden' },
  heroOrb:         { position: 'absolute', width: 150, height: 150, borderRadius: 75, top: -40, right: -40, backgroundColor: 'rgba(255,255,255,0.08)' },
  backBtn:         { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  heroProject:     { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  heroTitle:       { fontSize: 22, fontWeight: '700', color: 'white', letterSpacing: -0.5, lineHeight: 28 },
  heroBadge:       { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5 },
  heroBadgeText:   { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  infoCard:        { borderRadius: 12, padding: 12, borderWidth: 1 },
  infoLabel:       { fontSize: 10, fontWeight: '600', color: '#6B6E8E', textTransform: 'uppercase', letterSpacing: 0.6 },
  badge:           { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  chip:            { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100 },
  sectionTitle:    { fontSize: 11, fontWeight: '700', color: '#6B6E8E', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 },
  subProgress:     { height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 10 },
  subProgressFill: { height: '100%', borderRadius: 2 },
  subtaskRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
  cb:              { width: 20, height: 20, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  check:           { width: 10, height: 7, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: 'white', transform: [{ rotate: '-45deg' }, { translateY: -1 }] },
  addSubtask:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderStyle: 'dashed', borderRadius: 8, marginTop: 4, gap: 8 },
  deleteBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1 },
  footer:          { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 24, flexDirection: 'row', gap: 10, borderTopWidth: 1 },
});
