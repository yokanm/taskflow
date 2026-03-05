import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useProjectStore } from '@/store/project.store';
import { projectApi } from '@/services/api';
import { ProjectCard } from '@/components/ui/ProjectCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Project } from '@/types';

const COLORS = ['#6C63FF','#F43F5E','#0EA5E9','#22C55E','#F59E0B','#8B5CF6','#EC4899'];

export default function Projects() {
  const t = useAppTheme();
  const router = useRouter();
  const { projects, isLoading, setProjects, addProject, setLoading } = useProjectStore();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [emoji, setEmoji] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await projectApi.list();
      const payload = data as { data: Project[] };
      setProjects(payload.data);
    } catch { } finally { setLoading(false); }
  }, [setProjects, setLoading]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const { data } = await projectApi.create({ name: name.trim(), color, emoji: emoji || undefined });
      const payload = data as { data: Project };
      addProject(payload.data);
      setShowModal(false);
      setName(''); setEmoji('');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to create project');
    } finally { setCreating(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={{ fontSize: 12, color: t.textTertiary }}>{projects.length} active projects</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: t.textPrimary, letterSpacing: -0.5 }}>My Projects</Text>
        </View>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: t.accent }]} onPress={() => setShowModal(true)}>
          <Text style={{ color: 'white', fontSize: 20 }}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={t.accent} />}
      >
        {projects.length === 0 && !isLoading ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📁</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: t.textPrimary, marginBottom: 8 }}>No Projects Yet</Text>
            <Text style={{ fontSize: 14, color: t.textSecondary, textAlign: 'center', marginBottom: 24 }}>Create your first project to organize your tasks</Text>
            <Button label="+ Create Project" onPress={() => setShowModal(true)} />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {projects.map((p) => (
              <View key={p.id} style={{ width: '47%' }}>
                <ProjectCard project={p} onPress={() => router.push(`/(tabs)/projects/${p.id}`)} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={[styles.modal, { backgroundColor: t.surface }]}>
            <View style={styles.drag} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: t.textPrimary }}>New Project</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><Text style={{ fontSize: 20, color: t.textTertiary }}>✕</Text></TouchableOpacity>
            </View>
            <Input label="Project Name" value={name} onChangeText={setName} placeholder="Q2 Campaign" />
            <Input label="Emoji (optional)" value={emoji} onChangeText={setEmoji} placeholder="📱" />
            <Text style={{ fontSize: 12, fontWeight: '600', color: t.textSecondary, marginBottom: 10 }}>Color</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
              {COLORS.map((c) => (
                <TouchableOpacity key={c} onPress={() => setColor(c)}
                  style={[styles.swatch, { backgroundColor: c }, color === c && styles.swatchSel]} />
              ))}
            </View>
            <Button label="Create Project" fullWidth onPress={handleCreate} loading={creating} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modal: { padding: 20, paddingBottom: 36, borderRadius: 20 },
  drag: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E4E6F0', alignSelf: 'center', marginBottom: 16 },
  swatch: { width: 28, height: 28, borderRadius: 14 },
  swatchSel: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, elevation: 4, transform: [{ scale: 1.15 }] },
});
