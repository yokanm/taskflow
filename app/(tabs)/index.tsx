/**
 * @file app/(tabs)/index.tsx
 * @description Home screen: Today's tasks, Tomorrow's tasks, Project tasks.
 * Uses Lucide icons throughout.
 */

import { ProgressRing } from '@/components/ui/ProgressRing';
import { TaskSkeleton } from '@/components/ui/Skeleton';
import { TaskCard } from '@/components/ui/TaskCard';
import { Avatar } from '@/components/ui/Avatar';
import { useAppTheme } from '@/context/ThemeContext';
import { taskApi } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { useTaskStore } from '@/store/task.store';
import type { Task } from '@/types';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Plus,
  TrendingUp,
  Calendar,
  FolderOpen,
  ChevronRight,
  Sun,
  Clock,
} from 'lucide-react-native';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function isTomorrow(date: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  );
}

// ─── Section header ────────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  count,
  onSeeAll,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  onSeeAll?: () => void;
  color?: string;
}) {
  const t = useAppTheme();
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionLeft}>
        <View
          style={[
            styles.sectionIconWrap,
            { backgroundColor: (color ?? t.accent) + '18' },
          ]}
        >
          {icon}
        </View>
        <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>
          {title}
        </Text>
        <View
          style={[
            styles.countBadge,
            { backgroundColor: t.surface2 },
          ]}
        >
          <Text style={{ fontSize: 11, fontWeight: '700', color: t.textSecondary }}>
            {count}
          </Text>
        </View>
      </View>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} style={styles.seeAllBtn}>
          <Text style={{ color: t.accent, fontSize: 12, fontWeight: '600' }}>
            See all
          </Text>
          <ChevronRight size={13} color={t.accent} strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptySection({ message }: { message: string }) {
  const t = useAppTheme();
  return (
    <View style={[styles.emptyCard, { backgroundColor: t.surface2, borderColor: t.border }]}>
      <Text style={{ fontSize: 12, color: t.textTertiary }}>{message}</Text>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Home() {
  const t = useAppTheme();
  const router = useRouter();
  const { user } = useAuthStore();
  const { tasks, isLoading, setTasks, setLoading, toggleTask, updateTask } = useTaskStore();
  const [expandedSections, setExpandedSections] = useState({
    today: true,
    tomorrow: true,
    projects: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await taskApi.list();
      setTasks(result.data);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [setTasks, setLoading]);

  useEffect(() => { load(); }, [load]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const todayTasks = tasks.filter((task) => {
    if (!task.dueDate) return false;
    return isToday(new Date(task.dueDate));
  });

  const tomorrowTasks = tasks.filter((task) => {
    if (!task.dueDate) return false;
    return isTomorrow(new Date(task.dueDate));
  });

  // Group tasks by project (only tasks with a project)
  const projectTaskMap = tasks.reduce<Record<string, { name: string; color: string; tasks: Task[] }>>(
    (acc, task) => {
      if (task.project) {
        const key = task.project.id;
        if (!acc[key]) {
          acc[key] = { name: task.project.name, color: task.project.color, tasks: [] };
        }
        acc[key]!.tasks.push(task);
      }
      return acc;
    },
    {}
  );

  const doneCount = tasks.filter((tk) => tk.status === 'DONE').length;
  const inProgressCount = tasks.filter((tk) => tk.status === 'IN_PROGRESS').length;
  const todoCount = tasks.filter((tk) => tk.status === 'TODO').length;
  const pct = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const handleToggle = async (task: Task) => {
    toggleTask(task.id);
    try {
      const res = await taskApi.toggle(task.id);
      updateTask(task.id, { status: res.data.status });
    } catch {
      toggleTask(task.id); // revert
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '500', color: t.textTertiary }}>
            {greeting()}
          </Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: t.textPrimary, letterSpacing: -0.5 }}>
            {user?.name ?? 'User'}
          </Text>
          <Text style={{ fontSize: 11, color: t.textTertiary, marginTop: 1 }}>
            {todayDate}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
          <Avatar
            name={user?.name}
            color={user?.avatarColor}
            // imageUri={user?.profileImage}
            size={42}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={load}
            tintColor={t.accent}
          />
        }
      >
        {/* Hero progress card */}
        <View
          style={[
            styles.hero,
            {
              backgroundColor: t.accent,
              ...(Platform.OS === 'web'
                ? { boxShadow: `0px 8px 24px ${t.accent}55` }
                : {
                    shadowColor: t.accent,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.4,
                    shadowRadius: 24,
                    elevation: 8,
                  }),
            },
          ]}
        >
          <View style={styles.heroOrb} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <TrendingUp size={13} color="rgba(255,255,255,0.7)" strokeWidth={2} />
            <Text style={styles.heroSub}>OVERALL PROGRESS</Text>
          </View>
          <Text style={styles.heroTitle}>
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} in total
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', gap: 16, marginBottom: 10 }}>
                {[
                  { num: todoCount, label: 'To Do' },
                  { num: inProgressCount, label: 'Active' },
                  { num: doneCount, label: 'Done' },
                ].map((s) => (
                  <View key={s.label}>
                    <Text style={styles.heroStat}>{s.num}</Text>
                    <Text style={styles.heroStatLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.progressbarOuter}>
                <View
                  style={[
                    styles.progressbarInner,
                    { width: `${pct}%` as `${number}%` },
                  ]}
                />
              </View>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 5 }}>
                {pct}% completed
              </Text>
            </View>
            <ProgressRing progress={pct} label="Done" />
          </View>
        </View>

        {/* Quick stats row */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
          {[
            { icon: <Sun size={14} color={t.accent} strokeWidth={2} />, num: todayTasks.length, label: 'Due Today', color: t.accent },
            { icon: <Clock size={14} color="#3B82F6" strokeWidth={2} />, num: inProgressCount, label: 'In Progress', color: '#3B82F6' },
            { icon: <FolderOpen size={14} color="#22C55E" strokeWidth={2} />, num: Object.keys(projectTaskMap).length, label: 'Projects', color: '#22C55E' },
          ].map((s) => (
            <View
              key={s.label}
              style={[
                styles.statCard,
                { backgroundColor: t.surface, borderColor: t.border },
              ]}
            >
              <View style={[styles.statIcon, { backgroundColor: s.color + '15' }]}>
                {s.icon}
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: t.textPrimary, letterSpacing: -0.5 }}>
                {s.num}
              </Text>
              <Text style={{ fontSize: 10, color: t.textTertiary, textAlign: 'center', marginTop: 1 }}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Today's Tasks ─────────────────────────────────────────────── */}
        <SectionHeader
          icon={<Sun size={14} color={t.accent} strokeWidth={2} />}
          title="Today"
          count={todayTasks.length}
          onSeeAll={() => router.push('/(tabs)/tasks')}
          color={t.accent}
        />

        {isLoading ? (
          <>{[1, 2].map((i) => <TaskSkeleton key={i} />)}</>
        ) : todayTasks.length === 0 ? (
          <EmptySection message="No tasks due today — enjoy your day! 🎉" />
        ) : (
          todayTasks.slice(0, 4).map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={() => handleToggle(task)}
              onPress={() => router.push(`/tasks/${task.id}`)}
              showProject
            />
          ))
        )}

        {/* ── Tomorrow's Tasks ──────────────────────────────────────────── */}
        <View style={{ marginTop: 8 }}>
          <SectionHeader
            icon={<Calendar size={14} color="#F59E0B" strokeWidth={2} />}
            title="Tomorrow"
            count={tomorrowTasks.length}
            color="#F59E0B"
          />

          {isLoading ? (
            <TaskSkeleton />
          ) : tomorrowTasks.length === 0 ? (
            <EmptySection message="Nothing scheduled for tomorrow" />
          ) : (
            tomorrowTasks.slice(0, 3).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={() => handleToggle(task)}
                onPress={() => router.push(`/tasks/${task.id}`)}
                showProject
              />
            ))
          )}
        </View>

        {/* ── Project Tasks ─────────────────────────────────────────────── */}
        {!isLoading && Object.entries(projectTaskMap).length > 0 && (
          <View style={{ marginTop: 8 }}>
            <SectionHeader
              icon={<FolderOpen size={14} color="#8B5CF6" strokeWidth={2} />}
              title="By Project"
              count={Object.keys(projectTaskMap).length}
              onSeeAll={() => router.push('/(tabs)/projects')}
              color="#8B5CF6"
            />

            {Object.entries(projectTaskMap)
              .slice(0, 3)
              .map(([projectId, { name, color, tasks: project_tasks }]) => {
                const pending = project_tasks.filter((x) => x.status !== 'DONE');
                const done = project_tasks.filter((x) => x.status === 'DONE');
                const pct2 =
                  project_tasks.length > 0
                    ? Math.round((done.length / project_tasks.length) * 100)
                    : 0;

                return (
                  <TouchableOpacity
                    key={projectId}
                    style={[
                      styles.projectRow,
                      {
                        backgroundColor: t.surface,
                        borderColor: t.border,
                        borderLeftColor: color,
                      },
                    ]}
                    onPress={() => router.push(`/projects/${projectId}`)}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.projectDot,
                        { backgroundColor: color + '22' },
                      ]}
                    >
                      <View
                        style={[
                          styles.projectDotInner,
                          { backgroundColor: color },
                        ]}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: t.textPrimary,
                          marginBottom: 3,
                        }}
                      >
                        {name}
                      </Text>
                      <View style={[styles.miniProgress, { backgroundColor: t.surface2 }]}>
                        <View
                          style={[
                            styles.miniProgressFill,
                            {
                              width: `${pct2}%` as `${number}%`,
                              backgroundColor: color,
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: t.textPrimary }}>
                        {pending.length}
                      </Text>
                      <Text style={{ fontSize: 10, color: t.textTertiary }}>
                        pending
                      </Text>
                    </View>
                    <ChevronRight size={14} color={t.textTertiary} strokeWidth={2} />
                  </TouchableOpacity>
                );
              })}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: t.accent,
            ...(Platform.OS === 'web'
              ? { boxShadow: `0px 8px 20px ${t.accent}55` }
              : {
                  shadowColor: t.accent,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.4,
                  shadowRadius: 20,
                  elevation: 8,
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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  hero: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    marginTop: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  heroOrb: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    top: -30,
    right: -30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroSub: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  heroStat: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -1,
  },
  heroStatLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  progressbarOuter: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressbarInner: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  emptyCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 3,
    marginBottom: 8,
  },
  projectDot: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  miniProgress: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});