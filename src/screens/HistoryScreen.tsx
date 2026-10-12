import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Modal,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';
import { WorkoutLog } from '../types';

export interface TimeBucket {
  key: string;
  label: string;
  order: number;
}

export function getTimeBucket(dateStr: string): TimeBucket {
  const workoutDate = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWorkout = new Date(workoutDate.getFullYear(), workoutDate.getMonth(), workoutDate.getDate()).getTime();
  const diffDays = Math.floor((startOfToday - startOfWorkout) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return { key: 'today', label: 'Today', order: 1 };
  } else if (diffDays < 7) {
    return { key: 'less_than_week', label: 'Less than a week ago', order: 2 };
  } else if (diffDays < 14) {
    return { key: 'week_ago', label: 'A week ago', order: 3 };
  } else if (diffDays < 28) {
    return { key: 'two_weeks_ago', label: '2 weeks ago', order: 4 };
  } else if (diffDays < 60) {
    return { key: 'month_ago', label: '1 month ago', order: 5 };
  } else {
    return { key: 'older', label: 'Older', order: 6 };
  }
}

type SortBy = 'newest' | 'oldest' | 'volume' | 'duration';
type TimeFilter = 'all' | 'today' | '7d' | '30d' | '90d';
type CategoryFilter = 'all' | string;

export const HistoryScreen: React.FC = () => {
  const { workouts, deleteWorkout, walkingLogs, deleteWalk, activeUser, colors, isDark } = useFitness();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [historyType, setHistoryType] = useState<'workouts' | 'walks'>('workouts');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Sorting & Filtering state
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Pagination / Display limit state
  const [isViewAll, setIsViewAll] = useState(false);
  const DEFAULT_HISTORY_LIMIT = 5;

  const athleteName = activeUser?.name?.includes('@')
    ? activeUser.name.split('@')[0]
    : activeUser?.name || 'Guest Athlete';

  const totalTonnageKg = (
    workouts.reduce((acc, w) => acc + (w.totalVolume || 0), 0) / 1000
  ).toFixed(1);

  const totalSteps = walkingLogs.reduce((acc, w) => acc + (w.steps || 0), 0);
  const totalWalkKm = walkingLogs.reduce((acc, w) => acc + (w.distanceKm || 0), 0);

  const isFiltered = useMemo(() => {
    return sortBy !== 'newest' || timeFilter !== 'all' || categoryFilter !== 'all' || search.trim() !== '';
  }, [sortBy, timeFilter, categoryFilter, search]);

  // Compute filtered & sorted workouts
  const filteredAndSortedWorkouts = useMemo(() => {
    let list = [...workouts];

    // 1. Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((w) =>
        w.title.toLowerCase().includes(q) ||
        w.exercises.some((e) => e.exerciseName.toLowerCase().includes(q))
      );
    }

    // 2. Category filter
    if (categoryFilter !== 'all') {
      const cf = categoryFilter.toLowerCase();
      list = list.filter((w) =>
        w.title.toLowerCase().includes(cf) ||
        w.exercises.some((e) => (e.category || '').toLowerCase() === cf)
      );
    }

    // 3. Time range filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      list = list.filter((w) => {
        const workoutDate = new Date(w.date);
        const startOfWorkout = new Date(workoutDate.getFullYear(), workoutDate.getMonth(), workoutDate.getDate()).getTime();
        const diffDays = Math.floor((startOfToday - startOfWorkout) / (1000 * 60 * 60 * 24));
        if (timeFilter === 'today') return diffDays <= 0;
        if (timeFilter === '7d') return diffDays <= 7;
        if (timeFilter === '30d') return diffDays <= 30;
        if (timeFilter === '90d') return diffDays <= 90;
        return true;
      });
    }

    // 4. Sort
    list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === 'volume') {
        return (b.totalVolume || 0) - (a.totalVolume || 0);
      }
      if (sortBy === 'duration') {
        return (b.durationMinutes || 0) - (a.durationMinutes || 0);
      }
      return 0;
    });

    return list;
  }, [workouts, search, categoryFilter, timeFilter, sortBy]);

  const totalMatching = filteredAndSortedWorkouts.length;
  const hasMore = totalMatching > DEFAULT_HISTORY_LIMIT;

  // Sliced according to isViewAll limit
  const displayedWorkouts = useMemo(() => {
    if (isViewAll || !hasMore) {
      return filteredAndSortedWorkouts;
    }
    return filteredAndSortedWorkouts.slice(0, DEFAULT_HISTORY_LIMIT);
  }, [filteredAndSortedWorkouts, isViewAll, hasMore]);

  // Group by relative time buckets when sorted newest (default chronological view)
  const groupedWorkouts = useMemo(() => {
    if (sortBy !== 'newest') return null;

    const groupsMap = new Map<string, { bucket: TimeBucket; workouts: WorkoutLog[] }>();
    displayedWorkouts.forEach((w) => {
      const b = getTimeBucket(w.date);
      if (!groupsMap.has(b.key)) {
        groupsMap.set(b.key, { bucket: b, workouts: [] });
      }
      groupsMap.get(b.key)!.workouts.push(w);
    });

    return Array.from(groupsMap.values()).sort((a, b) => a.bucket.order - b.bucket.order);
  }, [displayedWorkouts, sortBy]);

  const filteredWalks = useMemo(() => {
    return walkingLogs.filter((w) => {
      return (
        w.title.toLowerCase().includes(search.toLowerCase()) ||
        (w.notes && w.notes.toLowerCase().includes(search.toLowerCase()))
      );
    });
  }, [walkingLogs, search]);

  const handleDeleteWorkout = (id: string, title: string) => {
    Alert.alert('Delete Workout', `Are you sure you want to delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteWorkout(id),
      },
    ]);
  };

  const handleDeleteWalk = (id: string, title: string) => {
    Alert.alert('Delete Walk', `Are you sure you want to delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteWalk(id),
      },
    ]);
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const renderWorkoutCard = (item: WorkoutLog, index?: number) => {
    const isExpanded = expandedId === item.id;
    return (
      <View key={item.id} style={styles.card}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => setExpandedId(isExpanded ? null : item.id)}
          activeOpacity={0.7}
        >
          <View style={{ flex: 1 }}>
            <View style={styles.dateRow}>
              <MaterialCommunityIcons name="calendar-outline" size={14} color={colors.accent} />
              <Text style={styles.dateText}>{formatDate(item.date)}</Text>
              {sortBy === 'volume' && (
                <View style={styles.rankBadge}>
                  <Text style={styles.rankBadgeText}>#{index !== undefined ? index + 1 : ''} VOL</Text>
                </View>
              )}
              {sortBy === 'duration' && (
                <View style={styles.rankBadge}>
                  <Text style={styles.rankBadgeText}>#{index !== undefined ? index + 1 : ''} TIME</Text>
                </View>
              )}
            </View>
            <Text style={styles.workoutTitle}>{item.title}</Text>
          </View>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDeleteWorkout(item.id, item.title)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textDim} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>VOLUME</Text>
            <Text style={styles.statVal}>
              {item.totalVolume.toLocaleString()} {activeUser?.weightUnit}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>DURATION</Text>
            <Text style={styles.statVal}>{item.durationMinutes}m</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>EXERCISES</Text>
            <Text style={styles.statVal}>{item.exercises.length}</Text>
          </View>
        </View>

        {/* PRs Broken */}
        {item.prsBroken && item.prsBroken.length > 0 && (
          <View style={styles.prBox}>
            <MaterialCommunityIcons name="trophy" size={14} color={colors.accent} />
            <Text style={styles.prText}>{item.prsBroken.join(' • ')}</Text>
          </View>
        )}

        {/* Expanded Exercises */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {item.exercises.map((ex, exIdx) => (
              <View key={exIdx} style={styles.exerciseDetail}>
                <Text style={styles.exName}>{ex.exerciseName}</Text>
                <View style={styles.setRow}>
                  {ex.sets.map((set, sIdx) => (
                    <View
                      key={sIdx}
                      style={[styles.setBubble, set.completed && styles.setBubbleCompleted]}
                    >
                      <Text style={styles.setBubbleText}>
                        {set.weight}{activeUser?.weightUnit} × {set.reps}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity Logbook</Text>
        <Text style={styles.subtitle}>History and progress for {athleteName}</Text>
      </View>

      {/* Overview Metric Boxes */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{workouts.length}</Text>
          <Text style={styles.metricLabel}>WORKOUTS</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: colors.accent }]}>{totalTonnageKg}k</Text>
          <Text style={styles.metricLabel}>
            {(activeUser?.weightUnit || 'kg').toUpperCase()} TONNAGE
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{totalSteps.toLocaleString()}</Text>
          <Text style={styles.metricLabel}>STEPS</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: colors.azure }]}>{totalWalkKm.toFixed(1)}k</Text>
          <Text style={styles.metricLabel}>KM WALKED</Text>
        </View>
      </View>

      {/* Filter Tabs: Workouts vs Walks */}
      <View style={styles.typeTabsRow}>
        <TouchableOpacity
          style={[styles.typeTab, historyType === 'workouts' && styles.typeTabActive]}
          onPress={() => setHistoryType('workouts')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="dumbbell"
            size={16}
            color={historyType === 'workouts' ? colors.accentContrastText : colors.textMuted}
          />
          <Text
            style={[
              styles.typeTabText,
              historyType === 'workouts' && styles.typeTabTextActive,
            ]}
          >
            WORKOUTS ({workouts.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeTab, historyType === 'walks' && styles.typeTabActive]}
          onPress={() => setHistoryType('walks')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="walk"
            size={16}
            color={historyType === 'walks' ? colors.accentContrastText : colors.textMuted}
          />
          <Text
            style={[
              styles.typeTabText,
              historyType === 'walks' && styles.typeTabTextActive,
            ]}
          >
            WALKS ({walkingLogs.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textDim} />
        <TextInput
          style={styles.searchInput}
          placeholder={historyType === 'workouts' ? 'Search workouts or exercises...' : 'Search walks...'}
          placeholderTextColor={colors.textDim}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.textDim} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter & Sort Bar (Workouts Only) */}
      {historyType === 'workouts' && (
        <View style={styles.filterControlBar}>
          <TouchableOpacity
            style={[styles.filterTriggerBtn, isFiltered && styles.filterTriggerBtnActive]}
            onPress={() => setIsFilterModalOpen(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="tune"
              size={14}
              color={isFiltered ? colors.accentContrastText : colors.textPrimary}
            />
            <Text
              style={[
                styles.filterTriggerBtnText,
                isFiltered && styles.filterTriggerBtnTextActive,
              ]}
            >
              FILTER & SORT{isFiltered ? ' • ON' : ''}
            </Text>
          </TouchableOpacity>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickFilterScroll}
          >
            <TouchableOpacity
              style={[styles.quickFilterChip, sortBy !== 'newest' && styles.quickFilterChipActive]}
              onPress={() => setIsFilterModalOpen(true)}
            >
              <Text style={[styles.quickFilterText, sortBy !== 'newest' && styles.quickFilterTextActive]}>
                Sort: {sortBy === 'newest' ? 'Newest' : sortBy === 'oldest' ? 'Oldest' : sortBy === 'volume' ? 'Volume' : 'Duration'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={12} color={sortBy !== 'newest' ? colors.accent : colors.textDim} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickFilterChip, timeFilter !== 'all' && styles.quickFilterChipActive]}
              onPress={() => setIsFilterModalOpen(true)}
            >
              <Text style={[styles.quickFilterText, timeFilter !== 'all' && styles.quickFilterTextActive]}>
                Time: {timeFilter === 'all' ? 'All' : timeFilter === 'today' ? 'Today' : timeFilter === '7d' ? 'Past 7d' : timeFilter === '30d' ? 'Past 30d' : 'Past 90d'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={12} color={timeFilter !== 'all' ? colors.accent : colors.textDim} />
            </TouchableOpacity>

            {categoryFilter !== 'all' && (
              <TouchableOpacity
                style={[styles.quickFilterChip, styles.quickFilterChipActive]}
                onPress={() => setCategoryFilter('all')}
              >
                <Text style={styles.quickFilterTextActive}>{categoryFilter}</Text>
                <MaterialCommunityIcons name="close-circle" size={12} color={colors.accent} />
              </TouchableOpacity>
            )}

            {isFiltered && (
              <TouchableOpacity
                style={styles.clearFiltersBtn}
                onPress={() => {
                  setSortBy('newest');
                  setTimeFilter('all');
                  setCategoryFilter('all');
                  setSearch('');
                  setIsViewAll(false);
                }}
              >
                <MaterialCommunityIcons name="refresh" size={12} color={colors.accent} />
                <Text style={styles.clearFiltersText}>Reset</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}

      {/* Content Rendering */}
      {historyType === 'workouts' ? (
        filteredAndSortedWorkouts.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconBox}>
              <MaterialCommunityIcons name="dumbbell" size={32} color={colors.textDim} />
            </View>
            <Text style={styles.emptyTitle}>No workouts found</Text>
            <Text style={styles.emptySub}>
              {isFiltered
                ? 'Try resetting your filter or search query to view past workouts.'
                : 'Start your first session from the Log tab to see your exercise diary here.'}
            </Text>
            {isFiltered && (
              <TouchableOpacity
                style={styles.resetSearchBtn}
                onPress={() => {
                  setSortBy('newest');
                  setTimeFilter('all');
                  setCategoryFilter('all');
                  setSearch('');
                }}
              >
                <Text style={styles.resetSearchBtnText}>Reset All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent}>
            {groupedWorkouts ? (
              // Grouped by Relative Time Buckets (Today, Less than a week ago, A week ago, 2 weeks ago, 1 month ago, Older)
              groupedWorkouts.map((group) => (
                <View key={group.bucket.key} style={styles.bucketSection}>
                  <View style={styles.bucketHeader}>
                    <View style={styles.bucketBadge}>
                      <MaterialCommunityIcons name="clock-outline" size={13} color={colors.accent} />
                      <Text style={styles.bucketLabel}>{group.bucket.label.toUpperCase()}</Text>
                    </View>
                    <View style={styles.bucketCountBadge}>
                      <Text style={styles.bucketCountText}>{group.workouts.length}</Text>
                    </View>
                  </View>
                  <View style={{ gap: 12 }}>
                    {group.workouts.map((w) => renderWorkoutCard(w))}
                  </View>
                </View>
              ))
            ) : (
              // Flat view when sorted by Volume, Duration, or Oldest
              <View style={{ gap: 12 }}>
                {displayedWorkouts.map((w, index) => renderWorkoutCard(w, index))}
              </View>
            )}

            {/* View All / Show Less CTA Button */}
            {hasMore && (
              <TouchableOpacity
                style={styles.viewAllBtn}
                onPress={() => setIsViewAll((prev) => !prev)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={isViewAll ? 'chevron-up-circle-outline' : 'chevron-down-circle-outline'}
                  size={20}
                  color={colors.accent}
                />
                <Text style={styles.viewAllText}>
                  {isViewAll
                    ? 'SHOW LESS (COLLAPSE TO 5)'
                    : `VIEW ALL HISTORY (${totalMatching - DEFAULT_HISTORY_LIMIT} MORE)`}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )
      ) : (
        /* Walks List */
        filteredWalks.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconBox}>
              <MaterialCommunityIcons name="walk" size={32} color={colors.textDim} />
            </View>
            <Text style={styles.emptyTitle}>No walking sessions logged</Text>
            <Text style={styles.emptySub}>
              Tap "LOG WALK" on the Log screen to record your manual walk, distance, and steps.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredWalks}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.dateRow}>
                      <MaterialCommunityIcons name="walk" size={15} color={colors.accent} />
                      <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                    </View>
                    <Text style={styles.workoutTitle}>{item.title}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteWalk(item.id, item.title)}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textDim} />
                  </TouchableOpacity>
                </View>

                {/* Walk Metrics Row */}
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>STEPS</Text>
                    <Text style={styles.statVal}>{item.steps.toLocaleString()}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>DISTANCE</Text>
                    <Text style={styles.statVal}>{item.distanceKm.toFixed(1)} km</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>DURATION</Text>
                    <Text style={styles.statVal}>{item.durationMinutes}m</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>BURNED</Text>
                    <Text style={styles.statVal}>{item.caloriesBurned} kcal</Text>
                  </View>
                </View>

                {item.notes ? (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesText}>{item.notes}</Text>
                  </View>
                ) : null}
              </View>
            )}
          />
        )
      )}

      {/* Filter & Sort Modal */}
      <Modal
        visible={isFilterModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.filterModal}>
            <View style={styles.filterModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="tune-variant" size={20} color={colors.accent} />
                <Text style={styles.filterModalTitle}>Filter & Sort History</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsFilterModalOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {/* SORT BY */}
              <Text style={styles.filterSectionTitle}>SORT BY</Text>
              <View style={styles.filterOptionsGrid}>
                {[
                  { id: 'newest', label: 'Date: Newest First', icon: 'sort-calendar-descending' },
                  { id: 'oldest', label: 'Date: Oldest First', icon: 'sort-calendar-ascending' },
                  { id: 'volume', label: 'Highest Volume', icon: 'weight-lifter' },
                  { id: 'duration', label: 'Longest Duration', icon: 'timer-sand' },
                ].map((opt) => {
                  const isSelected = sortBy === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.filterChoice, isSelected && styles.filterChoiceActive]}
                      onPress={() => setSortBy(opt.id as SortBy)}
                      activeOpacity={0.75}
                    >
                      <MaterialCommunityIcons
                        name={opt.icon as any}
                        size={15}
                        color={isSelected ? colors.accentContrastText : colors.textMuted}
                      />
                      <Text style={[styles.filterChoiceText, isSelected && styles.filterChoiceTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* TIME RANGE */}
              <Text style={styles.filterSectionTitle}>TIME RANGE</Text>
              <View style={styles.filterOptionsGrid}>
                {[
                  { id: 'all', label: 'All Time' },
                  { id: 'today', label: 'Today Only' },
                  { id: '7d', label: 'Past 7 Days' },
                  { id: '30d', label: 'Past 30 Days' },
                  { id: '90d', label: 'Past 90 Days' },
                ].map((opt) => {
                  const isSelected = timeFilter === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.filterChoice, isSelected && styles.filterChoiceActive]}
                      onPress={() => setTimeFilter(opt.id as TimeFilter)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.filterChoiceText, isSelected && styles.filterChoiceTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* CATEGORY / SPLIT */}
              <Text style={styles.filterSectionTitle}>WORKOUT TYPE</Text>
              <View style={styles.filterOptionsGrid}>
                {[
                  { id: 'all', label: 'All Types' },
                  { id: 'Push', label: 'Push' },
                  { id: 'Pull', label: 'Pull' },
                  { id: 'Legs', label: 'Legs' },
                  { id: 'Indoor', label: 'Indoor' },
                ].map((opt) => {
                  const isSelected = categoryFilter === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.filterChoice, isSelected && styles.filterChoiceActive]}
                      onPress={() => setCategoryFilter(opt.id as CategoryFilter)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.filterChoiceText, isSelected && styles.filterChoiceTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Modal Buttons */}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setSortBy('newest');
                  setTimeFilter('all');
                  setCategoryFilter('all');
                  setIsFilterModalOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={() => setIsFilterModalOpen(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    title: {
      fontSize: 22,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    metricsRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      gap: 8,
      marginVertical: 12,
    },
    metricCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    metricValue: {
      fontSize: 15,
      fontWeight: '900',
      color: colors.textPrimary,
      fontFamily: 'monospace',
    },
    metricLabel: {
      fontSize: 8,
      fontWeight: '800',
      color: colors.textDim,
      letterSpacing: 0.5,
      marginTop: 2,
      textAlign: 'center',
    },
    typeTabsRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      gap: 8,
      marginBottom: 12,
    },
    typeTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    typeTabActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    typeTabText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 0.5,
    },
    typeTabTextActive: {
      color: colors.accentContrastText,
      fontWeight: '900',
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceRaised,
      marginHorizontal: 16,
      marginBottom: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 10,
      color: colors.textPrimary,
      fontSize: 13,
    },
    filterControlBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 10,
      gap: 8,
    },
    filterTriggerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 10,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    filterTriggerBtnActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    filterTriggerBtnText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 0.5,
    },
    filterTriggerBtnTextActive: {
      color: colors.accentContrastText,
      fontWeight: '900',
    },
    quickFilterScroll: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    quickFilterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    quickFilterChipActive: {
      borderColor: colors.accent,
      backgroundColor: colors.surfaceRaised,
    },
    quickFilterText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
    },
    quickFilterTextActive: {
      color: colors.accent,
      fontWeight: '800',
    },
    clearFiltersBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: colors.surfaceRaised,
    },
    clearFiltersText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accent,
    },
    emptyCard: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      gap: 12,
    },
    emptyIconBox: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    emptySub: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 18,
    },
    resetSearchBtn: {
      marginTop: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: colors.accent,
    },
    resetSearchBtnText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accentContrastText,
      letterSpacing: 0.5,
    },
    listContent: {
      paddingHorizontal: 16,
      gap: 14,
      paddingBottom: 110,
    },
    bucketSection: {
      gap: 10,
    },
    bucketHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceBorder,
    },
    bucketBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    bucketLabel: {
      fontSize: 11,
      fontWeight: '900',
      color: colors.accent,
      fontFamily: 'monospace',
      letterSpacing: 1,
    },
    bucketCountBadge: {
      backgroundColor: colors.surfaceRaised,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    bucketCountText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textDim,
      fontFamily: 'monospace',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      padding: 16,
      gap: 12,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dateText: {
      fontSize: 11,
      color: colors.accent,
      fontWeight: '800',
      fontFamily: 'monospace',
    },
    rankBadge: {
      backgroundColor: colors.accentSubtle,
      borderWidth: 1,
      borderColor: colors.accent,
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 4,
    },
    rankBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.accent,
      fontFamily: 'monospace',
    },
    workoutTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: 2,
    },
    deleteBtn: {
      padding: 6,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    statBox: {
      flex: 1,
      backgroundColor: colors.surfaceRaised,
      padding: 10,
      borderRadius: 10,
      alignItems: 'center',
    },
    statLabel: {
      fontSize: 8,
      fontWeight: '800',
      color: colors.textDim,
      letterSpacing: 0.5,
    },
    statVal: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: 'monospace',
      marginTop: 2,
    },
    notesBox: {
      backgroundColor: colors.surfaceRaised,
      padding: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    notesText: {
      fontSize: 11,
      color: colors.textMuted,
      fontStyle: 'italic',
    },
    prBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accentSubtle,
      borderWidth: 1,
      borderColor: colors.accent,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      gap: 6,
    },
    prText: {
      fontSize: 11,
      color: colors.accent,
      fontWeight: '700',
      fontFamily: 'monospace',
      flex: 1,
    },
    expandedContent: {
      borderTopWidth: 1,
      borderTopColor: colors.surfaceBorder,
      paddingTop: 10,
      gap: 10,
    },
    exerciseDetail: {
      gap: 6,
    },
    exName: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    setRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    setBubble: {
      backgroundColor: colors.surfaceRaised,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    setBubbleCompleted: {
      borderColor: colors.accent,
    },
    setBubbleText: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: 'monospace',
    },
    viewAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 16,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      marginTop: 4,
      marginBottom: 16,
    },
    viewAllText: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.accent,
      letterSpacing: 0.8,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    filterModal: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    filterModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceBorder,
    },
    filterModalTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    filterSectionTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textMuted,
      fontFamily: 'monospace',
      letterSpacing: 0.8,
      marginTop: 10,
      marginBottom: 8,
    },
    filterOptionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    filterChoice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    filterChoiceActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    filterChoiceText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
    },
    filterChoiceTextActive: {
      color: colors.accentContrastText,
      fontWeight: '800',
    },
    modalButtonsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 18,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.surfaceBorder,
    },
    modalCancelBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.surfaceRaised,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    modalCancelBtnText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textMuted,
    },
    modalConfirmBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.accent,
      alignItems: 'center',
    },
    modalConfirmBtnText: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.accentContrastText,
    },
  });
