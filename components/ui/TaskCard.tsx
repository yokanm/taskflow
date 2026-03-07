/**
 * @file components/ui/TaskCard.tsx
 * @description Task card with Lucide icons, In Progress toggle support,
 * and proper status cycling: TODO → IN_PROGRESS → DONE → TODO.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { PRIORITY_STYLES } from '@/constants/theme-config';
import { Icon } from '@/components/ui/Icon';
import type { Task } from '@/types';

interface Props {
  task: Task;
  onToggle?: () => void;
  onLongPress?: () => void;
  onPress?: () => void;
  showProject?: boolean;
}

const STATUS_NEXT: Record<string, string> = {
  TODO: 'IN_PROGRESS',
  IN_PROGRESS: 'DONE',
  DONE: 'TODO',
};

const STATUS_CONFIG = {
  TODO: {
    iconName: 'circle' as const,
    color: '#A0A3B8',
    label: 'To Do',
  },
  IN_PROGRESS: {
    iconName: 'play' as const,
    color: '#3B82F6',
    label: 'In Progress',
  },
  DONE: {
    iconName: 'check-circle' as const,
    color: '#22C55E',
    label: 'Done',
  },
};

export function TaskCard({ task, onToggle, onLongPress, onPress, showProject }: Props) {
  const t = useAppTheme();
  const isDone = task.status === 'DONE';
  const isInProgress = task.status === 'IN_PROGRESS';
  const pri = PRIORITY_STYLES[task.priority];
  const statusCfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.TODO;

  const dueLabel = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && !isDone;

  const priorityIconMap: Record<string, 'flag'> = {
    HIGH: 'flag',
    MEDIUM: 'flag',
    LOW: 'flag',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      style={[
        styles.card,
        {
          backgroundColor: t.surface,
          borderColor: isInProgress ? '#3B82F620' : t.border,
          borderLeftWidth: isInProgress ? 3 : 1,
          borderLeftColor: isInProgress ? '#3B82F6' : t.border,
          opacity: isDone ? 0.72 : 1,
        },
      ]}
    >
      {/* Status toggle button */}
      <TouchableOpacity
        onPress={onToggle}
        style={styles.statusBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Icon
          name={statusCfg.iconName}
          size={20}
          color={statusCfg.color}
          strokeWidth={isDone ? 2.5 : 2}
        />
      </TouchableOpacity>

      <View style={styles.info}>
        <Text
          numberOfLines={1}
          style={[
            styles.title,
            {
              color: isDone ? t.textTertiary : t.textPrimary,
              textDecorationLine: isDone ? 'line-through' : 'none',
            },
          ]}
        >
          {task.title}
        </Text>

        <View style={styles.foot}>
          {/* Priority chip */}
          <View
            style={[
              styles.chip,
              { backgroundColor: t.isDark ? pri.bgDark : pri.bg },
            ]}
          >
            <Icon
              name="flag"
              size={9}
              color={t.isDark ? pri.textDark : pri.text}
              strokeWidth={2.5}
            />
            <Text
              style={{
                fontSize: 10,
                fontWeight: '600',
                color: t.isDark ? pri.textDark : pri.text,
              }}
            >
              {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
            </Text>
          </View>

          {/* Project */}
          {showProject && task.project && (
            <View style={[styles.chip, { backgroundColor: t.surface2 }]}>
              <View
                style={[styles.dot, { backgroundColor: task.project.color }]}
              />
              <Text
                style={{ fontSize: 10, fontWeight: '500', color: t.textSecondary }}
                numberOfLines={1}
              >
                {task.project.name}
              </Text>
            </View>
          )}

          {/* In Progress badge */}
          {isInProgress && (
            <View
              style={[
                styles.chip,
                { backgroundColor: '#EFF6FF' },
              ]}
            >
              <Icon name="play" size={9} color="#3B82F6" strokeWidth={2.5} />
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#3B82F6' }}>
                Active
              </Text>
            </View>
          )}

          {/* Due date */}
          {dueLabel && (
            <View
              style={[
                styles.chip,
                {
                  backgroundColor: isOverdue ? '#FEF2F2' : t.surface2,
                  marginLeft: 'auto',
                },
              ]}
            >
              <Icon
                name="calendar"
                size={9}
                color={isOverdue ? '#EF4444' : t.textTertiary}
                strokeWidth={2}
              />
              <Text
                style={{
                  fontSize: 10,
                  color: isOverdue ? '#EF4444' : t.textTertiary,
                  fontWeight: isOverdue ? '600' : '400',
                }}
              >
                {dueLabel}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  statusBtn: {
    marginTop: 1,
    flexShrink: 0,
  },
  info: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 20,
  },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 100,
  },
  dot: { width: 5, height: 5, borderRadius: 3 },
});
