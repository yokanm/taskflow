/**
 * @file app/(tabs)/projects.tsx
 * FIXES:
 * 1. Modal Input: KeyboardAvoidingView wraps modal content for Android
 * 2. Deprecated shadow* props replaced with Platform-aware boxShadow / elevation
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, Modal, Platform, KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useProjectStore } from '@/store/project.store';
import { projectApi } from '@/services/api';
import { ProjectCard } from '@/components/ui/ProjectCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';


const COLORS = ['#6C63FF', '#F43F5E', '#0EA5E9', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899'];
const DEFAULT_COLOR = COLORS[0]!;

export default function Projects() {
  const theme  = useAppTheme();
  const router = useRouter();
  const { projects, isLoading, setProjects, addProject, setLoading } = useProjectStore();

  const [showModal, setShowModal] = useState(false);
  const [name,      setName]      = useState('');
  const [color,     setColor]     = useState(DEFAULT_COLOR);
  const [emoji,     setEmoji]     = useState('');
  const [creating,  setCreating]  = useState(false);

  function resetForm() {
    setName('');
    setEmoji('');
    setColor(DEFAULT_COLOR);
  }

  function openModal()  { resetForm(); setShowModal(true); }
  function closeModal() { setShowModal(false); resetForm(); }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await projectApi.list();
      setProjects(result.data);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [setProjects, setLoading]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const result = await projectApi.create({ name: name.trim(), color, emoji: emoji || undefined });
      addProject(result.data);
      closeModal();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project';
      Alert.alert('Error', message);
    } finally {
      setCreating(false);
    }
  };

  const addBtnShadow = Platform.select({
    web:     { boxShadow: `0 4px 12px ${theme.accentShadow}` } as object,
    default: { elevation: 4 },
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={{ fontSize: 12, color: theme.textTertiary }}>
            {projects.length} active project{projects.length !== 1 ? 's' : ''}
          </Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: theme.textPrimary, letterSpacing: -0.5 }}>
            My Projects
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.accent }, addBtnShadow]}
          onPress={openModal}
        >
          <Text style={{ color: 'white', fontSize: 20 }}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={theme.accent} />}
      >
        {projects.length === 0 && !isLoading ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📁</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textPrimary, marginBottom: 8 }}>
              No Projects Yet
            </Text>
            <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginBottom: 24 }}>
              Create your first project to organize your tasks
            </Text>
            <Button label="+ Create Project" onPress={openModal} />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {projects.map((p) => (
              <View key={p.id} style={{ width: '47%' }}>
                <ProjectCard
                  project={p}
                  onPress={() => router.push(`/projects/${p.id}`)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create project modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'android' ? 24 : 0}
          enabled={Platform.OS !== 'web'}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modal, { backgroundColor: theme.surface }]}>
              <View style={styles.drag} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: theme.textPrimary }}>
                  New Project
                </Text>
                <TouchableOpacity onPress={closeModal} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={{ fontSize: 20, color: theme.textTertiary }}>✕</Text>
                </TouchableOpacity>
              </View>

              <Input
                label="Project Name"
                value={name}
                onChangeText={setName}
                placeholder="Q2 Campaign"
                returnKeyType="next"
                autoFocus
              />
              <Input
                label="Emoji (optional)"
                value={emoji}
                onChangeText={setEmoji}
                placeholder="📱"
                returnKeyType="done"
                onSubmitEditing={handleCreate}
              />

              <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Color
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
                {COLORS.map((c) => {
                  const selected = color === c;
                  const swatchShadow = Platform.select({
                    web:     selected ? { boxShadow: `0 4px 12px ${c}66` } as object : {},
                    default: selected ? { elevation: 4 } : { elevation: 0 },
                  });
                  return (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setColor(c)}
                      style={[
                        styles.swatch,
                        { backgroundColor: c },
                        selected && styles.swatchSelected,
                        swatchShadow,
                      ]}
                    />
                  );
                })}
              </View>

              <Button label="Create Project" fullWidth onPress={handleCreate} loading={creating} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header:         { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addBtn:         { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal:          { padding: 20, paddingBottom: 36, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  drag:           { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E4E6F0', alignSelf: 'center', marginBottom: 16 },
  swatch:         { width: 28, height: 28, borderRadius: 14 },
  swatchSelected: { transform: [{ scale: 1.15 }] },
});
