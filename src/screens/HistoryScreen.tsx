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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';

export const HistoryScreen: React.FC = () => {
  const { workouts, deleteWorkout, walkingLogs, deleteWalk, activeUser, colors, isDark } = useFitness();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [historyType, setHistoryType] = useState<'workouts' | 'walks'>('workouts');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const athleteName = activeUser?.name?.includes('@')
    ? activeUser.name.split('@')[0]
    : activeUser?.name || 'Guest Athlete';

  const totalTonnageKg = (
    workouts.reduce((acc, w) => acc + (w.totalVolume || 0), 0) / 1000
  ).toFixed(1);

  const totalSteps = walkingLogs.reduce((acc, w) => acc + (w.steps || 0), 0);
  const totalWalkKm = walkingLogs.reduce((acc, w) => acc + (w.distanceKm || 0), 0);

  const filteredWorkouts = workouts.filter((w) => {
    return (
      w.title.toLowerCase().includes(search.toLowerCase()) ||
      w.exercises.some((e) => e.exerciseName.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const filteredWalks = walkingLogs.filter((w) => {
    return (
      w.title.toLowerCase().includes(search.toLowerCase()) ||
      (w.notes && w.notes.toLowerCase().includes(search.toLowerCase()))
    );
  });

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

      {/* Content Rendering */}
      {historyType === 'workouts' ? (
        filteredWorkouts.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconBox}>
              <MaterialCommunityIcons name="dumbbell" size={32} color={colors.textDim} />
            </View>
            <Text style={styles.emptyTitle}>No workouts found</Text>
            <Text style={styles.emptySub}>
              Start your first session from the Log tab to see your exercise diary here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredWorkouts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isExpanded = expandedId === item.id;
              return (
                <View style={styles.card}>
                  <TouchableOpacity
                    style={styles.cardHeader}
                    onPress={() => setExpandedId(isExpanded ? null : item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={styles.dateRow}>
                        <MaterialCommunityIcons name="calendar-outline" size={14} color={colors.accent} />
                        <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                      </View>
                      <Text style={styles.workoutTitle}>{item.title}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteWorkout(item.id, item.title)}
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
            }}
          />
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
      marginBottom: 12,
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
    listContent: {
      paddingHorizontal: 16,
      gap: 12,
      paddingBottom: 110,
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
  });
