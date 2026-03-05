import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { PRIORITY_STYLES } from '@/constants/theme-config';
import type { Task } from '@/types';

interface Props {
  task: Task;
  onToggle?: () => void;
  onPress?: () => void;
  showProject?: boolean;
}

export function TaskCard({ task, onToggle, onPress, showProject }: Props) {
  const t = useAppTheme();
  const isDone = task.status === 'DONE';
  const pri = PRIORITY_STYLES[task.priority];

  const dueLabel = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}
      style={[styles.card, { backgroundColor: t.surface, borderColor: t.border, opacity: isDone ? 0.7 : 1 }]}>
      {/* Checkbox */}
      <TouchableOpacity onPress={onToggle} style={[styles.cb,
        { borderColor: isDone ? t.accent : t.border, backgroundColor: isDone ? t.accent : 'transparent' }]}>
        {isDone && <View style={styles.check} />}
      </TouchableOpacity>

      <View style={styles.info}>
        <Text numberOfLines={1}
          style={{ fontSize: 14, fontWeight: '600', color: isDone ? t.textTertiary : t.textPrimary,
            textDecorationLine: isDone ? 'line-through' : 'none', marginBottom: 5 }}>
          {task.title}
        </Text>
        <View style={styles.foot}>
          {/* Priority chip */}
          <View style={[styles.chip, { backgroundColor: t.isDark ? pri.bgDark : pri.bg }]}>
            <View style={[styles.dot, { backgroundColor: pri.dot }]} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: t.isDark ? pri.textDark : pri.text }}>
              {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
            </Text>
          </View>
          {/* Project */}
          {showProject && task.project && (
            <View style={[styles.chip, { backgroundColor: t.surface2 }]}>
              <View style={[styles.dot, { backgroundColor: task.project.color }]} />
              <Text style={{ fontSize: 11, fontWeight: '500', color: t.textSecondary }} numberOfLines={1}>{task.project.name}</Text>
            </View>
          )}
          {/* Due date */}
          {dueLabel && <Text style={{ fontSize: 10, color: t.textTertiary, marginLeft: 'auto', fontFamily: 'monospace' }}>{dueLabel}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 8, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cb: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
  check: { width: 10, height: 7, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: 'white', transform: [{ rotate: '-45deg' }, { translateY: -1 }] },
  info: { flex: 1, minWidth: 0 },
  foot: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  dot: { width: 5, height: 5, borderRadius: 3 },
});
