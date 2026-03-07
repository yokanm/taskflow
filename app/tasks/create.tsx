/**
 * @file app/tasks/create.tsx
 * @description Create OR Edit task screen.
 *
 * When navigated with ?id=<taskId>, loads the existing task and
 * switches to "edit mode" — populating all fields and calling
 * taskApi.update() on save instead of taskApi.create().
 *
 * Features:
 * - Zod validation
 * - Due date + time picker
 * - Priority selector
 * - Project picker
 * - In Progress status (edit mode only)
 */

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppTheme } from '@/context/ThemeContext';
import { projectApi, taskApi } from '@/services/api';
import { createTaskSchema, getFieldErrors } from '@/services/validators';
import { useProjectStore } from '@/store/project.store';
import { useTaskStore } from '@/store/task.store';
import type { Priority, Task, TaskStatus } from '@/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Calendar, Clock, Flag, FolderOpen, Circle, Play, CheckCircle2 } from 'lucide-react-native';

type PriorityOption = { key: Priority; label: string; color: string };
type StatusOption   = { key: TaskStatus; label: string; color: string; Icon: React.ComponentType<any> };

const PRIORITIES: PriorityOption[] = [
  { key: 'HIGH',   label: 'High',   color: '#EF4444' },
  { key: 'MEDIUM', label: 'Medium', color: '#F59E0B' },
  { key: 'LOW',    label: 'Low',    color: '#22C55E' },
];

const STATUSES: StatusOption[] = [
  { key: 'TODO',        label: 'To Do',       color: '#A0A3B8', Icon: Circle },
  { key: 'IN_PROGRESS', label: 'In Progress', color: '#3B82F6', Icon: Play },
  { key: 'DONE',        label: 'Done',        color: '#22C55E', Icon: CheckCircle2 },
];

export default function CreateTask() {
  const t = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const taskId = params.id; // present in edit mode
  const isEdit = Boolean(taskId);

  const { addTask, updateTask, tasks } = useTaskStore();
  const { projects, setProjects } = useProjectStore();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority]     = useState<Priority>('MEDIUM');
  const [status, setStatus]         = useState<TaskStatus>('TODO');
  const [dueDate, setDueDate]       = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [projectId, setProjectId]   = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [loaded, setLoaded]         = useState(!isEdit); // true if not editing

  // ── Load existing task in edit mode ─────────────────────────────────────────
  useEffect(() => {
    if (!isEdit || !taskId) return;

    const loadTask = async () => {
      // First try from store
      let task: Task | undefined = tasks.find((t) => t.id === taskId);

      // If not in store, fetch from API
      if (!task) {
        try {
          const result = await taskApi.get(taskId);
          task = result.data;
        } catch {
          Alert.alert('Error', 'Could not load task');
          router.back();
          return;
        }
      }

      if (task) {
        setTitle(task.title);
        setDescription(task.description ?? '');
        setPriority(task.priority);
        setStatus(task.status);
        setDueDate(task.dueDate ? new Date(task.dueDate) : null);
        setProjectId(task.projectId ?? null);
      }
      setLoaded(true);
    };

    loadTask();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, isEdit]);

  // ── Load projects ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (projects.length === 0) {
      (async () => {
        try {
          const result = await projectApi.list();
          setProjects(result.data);
        } catch { /* non-critical */ }
      })();
    }
  }, [projects.length, setProjects]);

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSave(): Promise<void> {
    const dueDateISO = dueDate ? dueDate.toISOString() : undefined;

    const result = createTaskSchema.safeParse({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDateISO,
      projectId: projectId ?? undefined,
    });

    if (!result.success) {
      setErrors(getFieldErrors(result.error));
      return;
    }
    setErrors({});
    setSaving(true);

    try {
      const payload: Record<string, unknown> = {
        title: result.data.title,
        priority: result.data.priority,
        status,
      };
      if (result.data.description)  payload.description = result.data.description;
      if (result.data.dueDate)      payload.dueDate = result.data.dueDate;
      if (result.data.projectId)    payload.projectId = result.data.projectId;
      else                          payload.projectId = null; // clear project

      if (isEdit && taskId) {
        const response = await taskApi.update(taskId, payload);
        updateTask(taskId, response.data as Partial<Task>);
      } else {
        const response = await taskApi.create(payload);
        addTask(response.data as unknown as Task);
      }

      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setSaving(false);
    }
  }

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  if (!loaded) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: t.textSecondary }}>Loading…</Text>
      </SafeAreaView>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'android' ? 80 : 0}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: t.border }]}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: t.surface, borderColor: t.border }]}
            onPress={() => router.back()}
          >
            <X size={18} color={t.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '700', color: t.textPrimary, letterSpacing: -0.4 }}>
            {isEdit ? 'Edit Task' : 'New Task'}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Input
            label="Task Title"
            value={title}
            onChangeText={setTitle}
            placeholder="What needs to be done?"
            autoFocus={!isEdit}
            error={errors.title}
          />

          {/* Description */}
          <Input
            label="Description (optional)"
            value={description}
            onChangeText={setDescription}
            placeholder="Add more details…"
            multiline
            numberOfLines={3}
            error={errors.description}
          />

          {/* Priority */}
          <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>Priority</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
            {PRIORITIES.map((p) => {
              const active = priority === p.key;
              return (
                <TouchableOpacity
                  key={p.key}
                  onPress={() => setPriority(p.key)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? p.color + '20' : t.surface2,
                      borderColor: active ? p.color : t.border,
                      borderWidth: active ? 1.5 : 1,
                    },
                  ]}
                >
                  <Flag
                    size={12}
                    color={active ? p.color : t.textTertiary}
                    strokeWidth={2.5}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: active ? p.color : t.textSecondary,
                    }}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Status — only in edit mode */}
          {isEdit && (
            <>
              <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>Status</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {STATUSES.map((s) => {
                  const active = status === s.key;
                  return (
                    <TouchableOpacity
                      key={s.key}
                      onPress={() => setStatus(s.key)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active ? s.color + '18' : t.surface2,
                          borderColor: active ? s.color : t.border,
                          borderWidth: active ? 1.5 : 1,
                        },
                      ]}
                    >
                      <s.Icon
                        size={12}
                        color={active ? s.color : t.textTertiary}
                        strokeWidth={2.5}
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: active ? s.color : t.textSecondary,
                        }}
                      >
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Due date + time */}
          <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>Due Date & Time (optional)</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: errors.dueDate ? 4 : 16 }}>
            {/* Date button */}
            <TouchableOpacity
              style={[
                styles.dateBtn,
                {
                  flex: 1,
                  backgroundColor: t.surface2,
                  borderColor: dueDate ? t.accent : t.border,
                },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={15} color={dueDate ? t.accent : t.textTertiary} strokeWidth={2} />
              <Text style={{ fontSize: 13, color: dueDate ? t.textPrimary : t.textTertiary, flex: 1 }}>
                {dueDate ? formatDate(dueDate) : 'Select date'}
              </Text>
              {dueDate && (
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation(); setDueDate(null); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={14} color={t.textTertiary} strokeWidth={2} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {/* Time button — only show if date selected */}
            {dueDate && (
              <TouchableOpacity
                style={[
                  styles.dateBtn,
                  { backgroundColor: t.surface2, borderColor: t.accent },
                ]}
                onPress={() => setShowTimePicker(true)}
              >
                <Clock size={15} color={t.accent} strokeWidth={2} />
                <Text style={{ fontSize: 13, color: t.textPrimary }}>
                  {formatTime(dueDate)}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {errors.dueDate ? (
            <Text style={{ color: '#EF4444', fontSize: 11, marginBottom: 12 }}>
              {errors.dueDate}
            </Text>
          ) : null}

          {/* Date picker */}
          {showDatePicker && (
            <DateTimePicker
              value={dueDate ?? new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={(_event, date) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (date) {
                  // Preserve time from existing dueDate or use current time
                  const existing = dueDate ?? new Date();
                  date.setHours(existing.getHours(), existing.getMinutes());
                  setDueDate(date);
                }
              }}
            />
          )}

          {/* Time picker */}
          {showTimePicker && dueDate && (
            <DateTimePicker
              value={dueDate}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_event, date) => {
                setShowTimePicker(Platform.OS === 'ios');
                if (date) setDueDate(date);
              }}
            />
          )}

          {/* Project picker */}
          <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>Project (optional)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 28 }}
          >
            <View style={{ flexDirection: 'row', gap: 8, paddingRight: 8 }}>
              <TouchableOpacity
                onPress={() => setProjectId(null)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: !projectId ? t.accent + '20' : t.surface2,
                    borderColor: !projectId ? t.accent : t.border,
                  },
                ]}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: !projectId ? t.accent : t.textSecondary }}>
                  None
                </Text>
              </TouchableOpacity>

              {projects.map((p) => {
                const active = projectId === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setProjectId(p.id)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? p.color + '20' : t.surface2,
                        borderColor: active ? p.color : t.border,
                      },
                    ]}
                  >
                    <View style={[styles.dot, { backgroundColor: p.color }]} />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: active ? p.color : t.textSecondary }}>
                      {p.emoji ? `${p.emoji} ` : ''}{p.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <Button
            label={isEdit ? 'Save Changes' : 'Create Task'}
            fullWidth
            onPress={handleSave}
            loading={saving}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
  iconBtn: {
    width: 36, height: 36, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
});
