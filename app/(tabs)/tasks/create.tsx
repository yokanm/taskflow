import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useTaskStore } from '@/store/task.store';
import { useProjectStore } from '@/store/project.store';
import { taskApi, projectApi } from '@/services/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Priority, Project, Task } from '@/types';

const PRIORITIES: { key: Priority; label: string; color: string }[] = [
  { key: 'LOW',    label: '🟢 Low',    color: '#22C55E' },
  { key: 'MEDIUM', label: '🟡 Medium', color: '#F59E0B' },
  { key: 'HIGH',   label: '🔴 High',   color: '#EF4444' },
];

export default function CreateTask() {
  const t = useAppTheme();
  const router = useRouter();
  const { addTask } = useTaskStore();
  const { projects, setProjects } = useProjectStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (projects.length === 0) {
      projectApi.list().then(({ data }) => {
        const payload = data as { data: Project[] };
        setProjects(payload.data);
      }).catch(() => {});
    }
  }, [projects.length, setProjects]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required';
    if (title.length > 120) e.title = 'Title must be under 120 characters';
    if (dueDate) {
      const d = new Date(dueDate);
      if (isNaN(d.getTime())) e.dueDate = 'Enter a valid date (YYYY-MM-DD)';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        priority,
      };
      if (description.trim()) payload.description = description.trim();
      if (dueDate) payload.dueDate = new Date(dueDate).toISOString();
      if (selectedProject) payload.projectId = selectedProject;

      const { data } = await taskApi.create(payload);
      const res = data as { data: Task };
      addTask(res.data);
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: t.border }]}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: t.surface, borderColor: t.border }]}
            onPress={() => router.back()}
          >
            <Text style={{ fontSize: 18, color: t.textPrimary }}>‹</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '700', color: t.textPrimary, letterSpacing: -0.4 }}>
            New Task
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Input
            label="Task Title *"
            value={title}
            onChangeText={setTitle}
            placeholder="What needs to be done?"
            error={errors.title}
            autoFocus
          />

          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Add details (optional)"
            multiline
            numberOfLines={3}
            style={{ minHeight: 72, textAlignVertical: 'top' }}
          />

          {/* Priority */}
          <Text style={[styles.label, { color: t.textSecondary }]}>Priority</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {PRIORITIES.map((p) => {
              const sel = priority === p.key;
              return (
                <TouchableOpacity
                  key={p.key}
                  onPress={() => setPriority(p.key)}
                  style={[styles.priorityBtn, {
                    flex: 1,
                    backgroundColor: sel ? p.color + '22' : t.surface2,
                    borderColor: sel ? p.color : t.border,
                    borderWidth: sel ? 2 : 1,
                  }]}
                >
                  <Text style={{ fontSize: 12, fontWeight: sel ? '700' : '500', color: sel ? p.color : t.textSecondary }}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Due date */}
          <Input
            label="Due Date"
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            error={errors.dueDate}
          />

          {/* Project */}
          {projects.length > 0 && (
            <>
              <Text style={[styles.label, { color: t.textSecondary }]}>Project</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, flexDirection: 'row', marginBottom: 24 }}>
                <TouchableOpacity
                  onPress={() => setSelectedProject(null)}
                  style={[styles.projectChip, {
                    backgroundColor: !selectedProject ? t.accent + '22' : t.surface2,
                    borderColor: !selectedProject ? t.accent : t.border,
                    borderWidth: !selectedProject ? 2 : 1,
                  }]}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: !selectedProject ? t.accent : t.textSecondary }}>
                    None
                  </Text>
                </TouchableOpacity>
                {projects.map((proj) => {
                  const sel = selectedProject === proj.id;
                  return (
                    <TouchableOpacity
                      key={proj.id}
                      onPress={() => setSelectedProject(proj.id)}
                      style={[styles.projectChip, {
                        backgroundColor: sel ? proj.color + '22' : t.surface2,
                        borderColor: sel ? proj.color : t.border,
                        borderWidth: sel ? 2 : 1,
                        flexDirection: 'row', alignItems: 'center', gap: 6,
                      }]}
                    >
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: proj.color }} />
                      <Text style={{ fontSize: 12, fontWeight: '600', color: sel ? proj.color : t.textSecondary }}>
                        {proj.emoji ? `${proj.emoji} ` : ''}{proj.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}

          <Button label="Create Task" fullWidth onPress={handleCreate} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8, letterSpacing: 0.2 },
  priorityBtn: { paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  projectChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100 },
});