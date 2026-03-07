/**
 * @file app/(tabs)/tasks/create.tsx
 * @description Create Task screen.
 *
 * - Zod validation via createTaskSchema
 * - Converts the native DateTimePicker's Date object to ISO string before Zod
 * - Loads projects from store (fetches if empty)
 * - On success: adds task to store optimistically + navigates back
 */

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppTheme } from '@/context/ThemeContext';
import { projectApi, taskApi } from '@/services/api';
import { createTaskSchema, getFieldErrors } from '@/services/validators';
import { useProjectStore } from '@/store/project.store';
import { useTaskStore } from '@/store/task.store';
import type { Priority, Task } from '@/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
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

type PriorityOption = { key: Priority; label: string; color: string };

const PRIORITIES: PriorityOption[] = [
  { key: 'HIGH', label: 'High', color: '#EF4444' },
  { key: 'MEDIUM', label: 'Medium', color: '#F59E0B' },
  { key: 'LOW', label: 'Low', color: '#22C55E' },
];

export default function CreateTask() {
  const t = useAppTheme();
  const router = useRouter();
  const { addTask } = useTaskStore();
  const { projects, setProjects, isLoading } = useProjectStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Load projects if needed ─────────────────────────────────────────────────
  useEffect(() => {
    if (projects.length === 0) {
      (async () => {
        try {
          const result = await projectApi.list();
          setProjects(result.data);
        } catch {
          /* non-critical */
        }
      })();
    }
  }, [projects.length, setProjects]);

  // ── Validate & submit ───────────────────────────────────────────────────────
  async function handleCreate(): Promise<void> {
    // Convert the Date to an ISO string (Zod expects datetime format)
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
      // Build a clean payload (only include defined optional fields)
      const payload: Record<string, unknown> = {
        title: result.data.title,
        priority: result.data.priority,
      };
      if (result.data.description)
        payload.description = result.data.description;
      if (result.data.dueDate) payload.dueDate = result.data.dueDate;
      if (result.data.projectId) payload.projectId = result.data.projectId;

      const response = await taskApi.create(payload);
      addTask(response.data as unknown as Task);
      router.back();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create task';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
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
            style={[
              styles.iconBtn,
              { backgroundColor: t.surface, borderColor: t.border },
            ]}
            onPress={() => router.back()}
          >
            <Text style={{ color: t.textPrimary }}>✕</Text>
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: t.textPrimary,
              letterSpacing: -0.4,
            }}
          >
            New Task
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Input
            label="Task Title"
            value={title}
            onChangeText={setTitle}
            placeholder="What needs to be done?"
            autoFocus
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
          <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>
            Priority
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
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
                  <View style={[styles.dot, { backgroundColor: p.color }]} />
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

          {/* Due date */}
          <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>
            Due Date (optional)
          </Text>
          <TouchableOpacity
            style={[
              styles.dateBtn,
              {
                backgroundColor: t.surface2,
                borderColor: dueDate ? t.accent : t.border,
              },
            ]}
            onPress={() => setShowPicker(true)}
          >
            <Text
              style={{
                fontSize: 14,
                color: dueDate ? t.textPrimary : t.textTertiary,
              }}
            >
              {dueDate
                ? dueDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Select a date'}
            </Text>
            {dueDate ? (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  setDueDate(null);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={{ color: t.textTertiary, fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            ) : (
              <Text style={{ color: t.textTertiary }}>📅</Text>
            )}
          </TouchableOpacity>
          {errors.dueDate ? (
            <Text
              style={{
                color: '#EF4444',
                fontSize: 11,
                marginTop: -12,
                marginBottom: 12,
              }}
            >
              {errors.dueDate}
            </Text>
          ) : null}

          {showPicker && (
            <DateTimePicker
              value={dueDate ?? new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={(_event, date) => {
                setShowPicker(Platform.OS === 'ios'); // on Android, picker closes itself
                if (date) setDueDate(date);
              }}
            />
          )}

          {/* Project picker */}
          <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>
            Project (optional)
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 28 }}
          >
            <View style={{ flexDirection: 'row', gap: 8, paddingRight: 8 }}>
              {/* None option */}
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
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: !projectId ? t.accent : t.textSecondary,
                  }}
                >
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
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: active ? p.color : t.textSecondary,
                      }}
                    >
                      {p.emoji ? `${p.emoji} ` : ''}
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <Button
            label="Create Task"
            fullWidth
            onPress={handleCreate}
            loading={saving}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
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
  },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 16,
  },
});
