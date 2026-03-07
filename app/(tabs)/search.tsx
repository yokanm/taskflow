/**
 * @file app/(tabs)/search.tsx
 * @description Search screen — search tasks and projects in real-time.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';
import { useTaskStore } from '@/store/task.store';
import { useProjectStore } from '@/store/project.store';
import { TaskCard } from '@/components/ui/TaskCard';
import { taskApi } from '@/services/api';
import type { Task, Project } from '@/types';
import {
  Search,
  X,
  FolderOpen,
  CheckSquare,
  Clock,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react-native';

type FilterType = 'all' | 'tasks' | 'projects';
type PriorityFilter = 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW';

export default function SearchScreen() {
  const t = useAppTheme();
  const router = useRouter();
  const { tasks, toggleTask, updateTask } = useTaskStore();
  const { projects } = useProjectStore();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const inputRef = useRef<TextInput>(null);
  const filtersAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(filtersAnim, {
      toValue: showFilters ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [showFilters, filtersAnim]);

  // ── Filtered results ────────────────────────────────────────────────────────
  const q = query.trim().toLowerCase();

  const filteredTasks: Task[] = q
    ? tasks.filter((task) => {
        const matchesQuery =
          task.title.toLowerCase().includes(q) ||
          task.description?.toLowerCase().includes(q) ||
          task.project?.name.toLowerCase().includes(q);
        const matchesPriority =
          priorityFilter === 'ALL' || task.priority === priorityFilter;
        return matchesQuery && matchesPriority;
      })
    : [];

  const filteredProjects: Project[] = q
    ? projects.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.emoji?.toLowerCase().includes(q)
      )
    : [];

  const showTasks = filter === 'all' || filter === 'tasks';
  const showProjects = filter === 'all' || filter === 'projects';

  const totalResults =
    (showTasks ? filteredTasks.length : 0) +
    (showProjects ? filteredProjects.length : 0);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleSearch = (text: string) => {
    setQuery(text);
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const handleRecentSearch = (term: string) => {
    setQuery(term);
  };

  const addToRecent = useCallback((term: string) => {
    if (!term.trim()) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((x) => x !== term);
      return [term, ...filtered].slice(0, 6);
    });
  }, []);

  const handleTaskToggle = async (task: Task) => {
    toggleTask(task.id);
    try {
      const res = await taskApi.toggle(task.id);
      updateTask(task.id, { status: res.data.status });
    } catch {
      toggleTask(task.id);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>
          Search
        </Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: t.surface,
              borderColor: query ? t.accent : t.border,
              ...(Platform.OS === 'web' && query
                ? { boxShadow: `0 0 0 3px ${t.accent}28` }
                : {}),
            },
          ]}
        >
          <Search size={18} color={query ? t.accent : t.textTertiary} strokeWidth={2} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={handleSearch}
            onSubmitEditing={() => addToRecent(query)}
            placeholder="Search tasks, projects..."
            placeholderTextColor={t.textTertiary}
            style={[
              styles.searchInput,
              {
                color: t.textPrimary,
                ...(Platform.OS === 'web' ? { outline: 'none' } as any : {}),
              },
            ]}
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <View style={[styles.clearBtn, { backgroundColor: t.surface2 }]}>
                <X size={12} color={t.textTertiary} strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.filterBtn,
            {
              backgroundColor: showFilters ? t.accentLight : t.surface,
              borderColor: showFilters ? t.accent : t.border,
            },
          ]}
          onPress={() => setShowFilters((v) => !v)}
        >
          <SlidersHorizontal
            size={18}
            color={showFilters ? t.accent : t.textSecondary}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>

      {/* Filter row */}
      <Animated.View
        style={[
          styles.filtersWrap,
          {
            maxHeight: filtersAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 120],
            }),
            opacity: filtersAnim,
            overflow: 'hidden',
          },
        ]}
      >
        <View style={styles.filtersInner}>
          {/* Type filter */}
          <Text style={[styles.filterLabel, { color: t.textTertiary }]}>
            Type
          </Text>
          <View style={styles.filterRow}>
            {(['all', 'tasks', 'projects'] as FilterType[]).map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor:
                      filter === f ? t.accent : t.surface2,
                    borderColor: filter === f ? t.accent : t.border,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: filter === f ? 'white' : t.textSecondary,
                    textTransform: 'capitalize',
                  }}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Priority filter */}
          <Text style={[styles.filterLabel, { color: t.textTertiary, marginTop: 8 }]}>
            Priority
          </Text>
          <View style={styles.filterRow}>
            {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as PriorityFilter[]).map((p) => {
              const colors: Record<PriorityFilter, string> = {
                ALL: t.accent,
                HIGH: '#EF4444',
                MEDIUM: '#F59E0B',
                LOW: '#22C55E',
              };
              return (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPriorityFilter(p)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor:
                        priorityFilter === p ? colors[p] + '20' : t.surface2,
                      borderColor:
                        priorityFilter === p ? colors[p] : t.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color:
                        priorityFilter === p ? colors[p] : t.textSecondary,
                    }}
                  >
                    {p === 'ALL' ? 'All' : p.charAt(0) + p.slice(1).toLowerCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Empty state / recent searches */}
        {!q ? (
          <View style={{ paddingTop: 24 }}>
            {recentSearches.length > 0 ? (
              <>
                <View style={styles.recentHeader}>
                  <Text style={[styles.recentTitle, { color: t.textSecondary }]}>
                    Recent Searches
                  </Text>
                  <TouchableOpacity onPress={() => setRecentSearches([])}>
                    <Text style={{ color: t.accent, fontSize: 12, fontWeight: '600' }}>
                      Clear
                    </Text>
                  </TouchableOpacity>
                </View>
                {recentSearches.map((term) => (
                  <TouchableOpacity
                    key={term}
                    onPress={() => handleRecentSearch(term)}
                    style={[
                      styles.recentItem,
                      { backgroundColor: t.surface, borderColor: t.border },
                    ]}
                  >
                    <Clock size={14} color={t.textTertiary} strokeWidth={2} />
                    <Text style={{ flex: 1, fontSize: 14, color: t.textPrimary }}>
                      {term}
                    </Text>
                    <ChevronRight size={14} color={t.textTertiary} strokeWidth={2} />
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <View style={{ alignItems: 'center', paddingTop: 48 }}>
                <View
                  style={[
                    styles.emptyIcon,
                    { backgroundColor: t.accentLight },
                  ]}
                >
                  <Search size={28} color={t.accent} strokeWidth={1.5} />
                </View>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: '700',
                    color: t.textPrimary,
                    marginTop: 16,
                    marginBottom: 6,
                  }}
                >
                  Search everything
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: t.textSecondary,
                    textAlign: 'center',
                    lineHeight: 20,
                    paddingHorizontal: 32,
                  }}
                >
                  Find tasks by title, description, or project.
                </Text>
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Result count */}
            <View style={styles.resultCount}>
              <Text style={{ fontSize: 13, color: t.textSecondary }}>
                <Text style={{ fontWeight: '700', color: t.textPrimary }}>
                  {totalResults}
                </Text>{' '}
                result{totalResults !== 1 ? 's' : ''} for &quot;
                <Text style={{ fontWeight: '600', color: t.accent }}>{query}</Text>&quot;
              </Text>
            </View>

            {/* No results */}
            {totalResults === 0 && (
              <View style={{ alignItems: 'center', paddingTop: 48 }}>
                <View
                  style={[
                    styles.emptyIcon,
                    { backgroundColor: t.surface2 },
                  ]}
                >
                  <Search size={28} color={t.textTertiary} strokeWidth={1.5} />
                </View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: t.textPrimary,
                    marginTop: 16,
                    marginBottom: 6,
                  }}
                >
                  No results found
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: t.textSecondary,
                    textAlign: 'center',
                  }}
                >
                  Try different keywords or filters
                </Text>
              </View>
            )}

            {/* Tasks results */}
            {showTasks && filteredTasks.length > 0 && (
              <View style={{ marginBottom: 12 }}>
                <View style={styles.resultSection}>
                  <CheckSquare size={15} color={t.accent} strokeWidth={2} />
                  <Text style={[styles.resultSectionTitle, { color: t.textSecondary }]}>
                    Tasks
                  </Text>
                  <View
                    style={[styles.countBadge, { backgroundColor: t.surface2 }]}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: t.textSecondary,
                      }}
                    >
                      {filteredTasks.length}
                    </Text>
                  </View>
                </View>
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() => handleTaskToggle(task)}
                    onPress={() => {
                      addToRecent(query);
                      router.push(`/tasks/${task.id}`);
                    }}
                    showProject
                  />
                ))}
              </View>
            )}

            {/* Project results */}
            {showProjects && filteredProjects.length > 0 && (
              <View>
                <View style={styles.resultSection}>
                  <FolderOpen size={15} color="#8B5CF6" strokeWidth={2} />
                  <Text style={[styles.resultSectionTitle, { color: t.textSecondary }]}>
                    Projects
                  </Text>
                  <View
                    style={[styles.countBadge, { backgroundColor: t.surface2 }]}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: t.textSecondary,
                      }}
                    >
                      {filteredProjects.length}
                    </Text>
                  </View>
                </View>
                {filteredProjects.map((project) => {
                  const projectTasks = project.tasks ?? [];
                  const done = projectTasks.filter(
                    (x) => x.status === 'DONE'
                  ).length;
                  return (
                    <TouchableOpacity
                      key={project.id}
                      style={[
                        styles.projectResult,
                        {
                          backgroundColor: t.surface,
                          borderColor: t.border,
                          borderLeftColor: project.color,
                        },
                      ]}
                      onPress={() => {
                        addToRecent(query);
                        router.push(`/projects/${project.id}`);
                      }}
                    >
                      <View
                        style={[
                          styles.projectIcon,
                          { backgroundColor: project.color + '20' },
                        ]}
                      >
                        <FolderOpen
                          size={16}
                          color={project.color}
                          strokeWidth={2}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: t.textPrimary,
                          }}
                        >
                          {project.emoji ? `${project.emoji} ` : ''}
                          {project.name}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: t.textSecondary,
                            marginTop: 1,
                          }}
                        >
                          {projectTasks.length} task
                          {projectTasks.length !== 1 ? 's' : ''} · {done} done
                        </Text>
                      </View>
                      <ChevronRight
                        size={16}
                        color={t.textTertiary}
                        strokeWidth={2}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
    margin: 0,
    ...(Platform.OS === 'web' ? { outline: 'none' } as any : {}),
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersWrap: {
    overflow: 'hidden',
  },
  filtersInner: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1.5,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recentTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCount: {
    paddingVertical: 10,
  },
  resultSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  resultSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  projectResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 3,
    marginBottom: 8,
  },
  projectIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
