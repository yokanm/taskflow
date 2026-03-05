import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import type { Project } from '@/types';

interface Props { project: Project; onPress?: () => void; }

export function ProjectCard({ project, onPress }: Props) {
  const t = useAppTheme();
  const total = project.tasks.length;
  const done = project.tasks.filter((x) => x.status === 'DONE').length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}
      style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      <View style={[styles.stripe, { backgroundColor: project.color }]} />
      <View style={{ padding: 14 }}>
        <View style={[styles.icon, { backgroundColor: project.color + '22' }]}>
          <Text style={{ fontSize: 18 }}>{project.emoji ?? '📁'}</Text>
        </View>
        <Text style={{ fontSize: 14, fontWeight: '700', color: t.textPrimary, marginBottom: 3 }} numberOfLines={1}>{project.name}</Text>
        <Text style={{ fontSize: 11, color: t.textSecondary, marginBottom: 10 }}>{total} task{total !== 1 ? 's' : ''}</Text>
        <View style={[styles.pb, { backgroundColor: t.surface2 }]}>
          <View style={[styles.pf, { width: `${pct}%`, backgroundColor: project.color }]} />
        </View>
        <Text style={{ fontSize: 10, fontWeight: '600', color: t.textTertiary, marginTop: 4 }}>{pct}% complete</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  stripe: { height: 4 },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  pb: { height: 4, borderRadius: 2, overflow: 'hidden' },
  pf: { height: '100%', borderRadius: 2 },
});
