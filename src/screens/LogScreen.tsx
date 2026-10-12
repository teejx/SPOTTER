import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';
import { RoutineTemplate, RoutineFolder } from '../types';
import { FOLDER_COLOR_PALETTE } from '../lib/seedData';
import { LogWalkModal } from '../components/LogWalkModal';

interface LogScreenProps {
  onStartRoutine: (routine?: RoutineTemplate) => void;
  onNavigateToRoutines: () => void;
}

export const LogScreen: React.FC<LogScreenProps> = ({
  onStartRoutine,
  onNavigateToRoutines,
}) => {
  const {
    activeUser,
    routines,
    activeSession,
    walkingLogs,
    folders,
    updateFolderColor,
    colors,
    isDark,
  } = useFitness();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [isWalkModalVisible, setIsWalkModalVisible] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [colorModalFolder, setColorModalFolder] = useState<RoutineFolder | null>(null);

  const athleteName = activeUser?.name?.includes('@')
    ? activeUser.name.split('@')[0]
    : activeUser?.name || 'Guest Athlete';

  const initials = athleteName.slice(0, 2).toUpperCase();

  // Today's Walking Stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todayWalks = walkingLogs.filter((w) => w.date.startsWith(todayStr));
  const todaySteps = todayWalks.reduce((acc, w) => acc + (w.steps || 0), 0);
  const todayDistance = todayWalks.reduce((acc, w) => acc + (w.distanceKm || 0), 0);
  const todayMinutes = todayWalks.reduce((acc, w) => acc + (w.durationMinutes || 0), 0);
  const todayCalories = todayWalks.reduce((acc, w) => acc + (w.caloriesBurned || 0), 0);

  // Folder Counts and Mapping
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    folders.forEach((f) => {
      counts[f.name] = 0;
    });
    routines.forEach((r) => {
      const f = r.folder || 'General';
      counts[f] = (counts[f] || 0) + 1;
    });
    return counts;
  }, [folders, routines]);

  const folderColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    folders.forEach((f) => {
      map[f.name] = f.color;
    });
    return map;
  }, [folders]);

  const folderRoutinesMap = useMemo(() => {
    const map: Record<string, RoutineTemplate[]> = {};
    folders.forEach((f) => {
      map[f.name] = [];
    });
    routines.forEach((r) => {
      const f = r.folder || 'General';
      if (!map[f]) map[f] = [];
      map[f].push(r);
    });
    return map;
  }, [folders, routines]);

  // Routines filtered by selected folder
  const displayedRoutines = useMemo(() => {
    if (!selectedFolder) return routines;
    return routines.filter((r) => (r.folder || 'General') === selectedFolder);
  }, [routines, selectedFolder]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* 1. Athlete Hero Card */}
        <View style={styles.athleteCard}>
          <View style={[styles.avatarBox, { backgroundColor: activeUser?.avatarBg || '#EA580C' }]}>
            {activeUser?.avatarUrl ? (
              <Image
                source={{ uri: activeUser.avatarUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
          </View>

          <View style={styles.athleteDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.athleteName}>{athleteName}</Text>
              <View style={styles.focusBadge}>
                <Text style={styles.focusBadgeText}>
                  {activeUser?.trainingGoal || 'Strength'}
                </Text>
              </View>
            </View>
            <Text style={styles.athleteMeta}>
              {activeUser?.bodyWeight || 75} {activeUser?.weightUnit || 'kg'} • {activeUser?.handle || '@guest_athlete'}
            </Text>
          </View>

          <View style={styles.streakBox}>
            <View style={styles.streakRow}>
              <MaterialCommunityIcons name="fire" size={16} color={colors.flame} />
              <Text style={styles.streakNum}>{activeUser?.streakDays || 1}d</Text>
            </View>
            <Text style={styles.streakLabel}>STREAK</Text>
          </View>
        </View>

        {/* 2. Start Empty Workout CTA */}
        <TouchableOpacity
          style={styles.heroStartBtn}
          onPress={() => onStartRoutine()}
          activeOpacity={0.85}
        >
          <View style={styles.heroStartLeft}>
            <View style={styles.heroIconCircle}>
              <MaterialCommunityIcons
                name="play"
                size={22}
                color={colors.accentContrastText === '#FFFFFF' ? '#000000' : '#FFFFFF'}
              />
            </View>
            <View>
              <Text style={styles.heroStartTitle}>START EMPTY WORKOUT</Text>
              <Text style={styles.heroStartSub}>LOG EXERCISES AS YOU TRAIN</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="arrow-right" size={22} color={colors.accentContrastText} />
        </TouchableOpacity>

        {/* 4. Walking Tracker Card */}
        <View style={styles.walkingCard}>
          <View style={styles.walkingHeader}>
            <View style={styles.walkingTitleRow}>
              <View style={styles.walkingIconBox}>
                <MaterialCommunityIcons name="walk" size={18} color={colors.accent} />
              </View>
              <View>
                <Text style={styles.walkingCardTitle}>WALKING & STEPS</Text>
                <Text style={styles.walkingCardSub}>
                  {todayWalks.length > 0 ? `${todayWalks.length} logged today` : 'No walks logged today'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.logWalkBtn}
              onPress={() => setIsWalkModalVisible(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="plus" size={16} color={colors.accentContrastText} />
              <Text style={styles.logWalkBtnText}>LOG WALK</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Metrics Bar */}
          <View style={styles.walkingMetricsRow}>
            <View style={styles.walkingMetricBox}>
              <Text style={styles.walkingMetricNum}>{todaySteps.toLocaleString()}</Text>
              <Text style={styles.walkingMetricLabel}>STEPS</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.walkingMetricBox}>
              <Text style={styles.walkingMetricNum}>{todayDistance.toFixed(1)} km</Text>
              <Text style={styles.walkingMetricLabel}>DISTANCE</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.walkingMetricBox}>
              <Text style={styles.walkingMetricNum}>{todayMinutes}m</Text>
              <Text style={styles.walkingMetricLabel}>DURATION</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.walkingMetricBox}>
              <Text style={styles.walkingMetricNum}>{todayCalories}</Text>
              <Text style={styles.walkingMetricLabel}>KCAL</Text>
            </View>
          </View>
        </View>

        {/* 5. Routine Folders Section in 2-Column Grid */}
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="folder-multiple" size={17} color={colors.accent} />
            <Text style={styles.sectionTitle}>ROUTINE FOLDERS ({folders.length})</Text>
          </View>
          <TouchableOpacity onPress={onNavigateToRoutines} activeOpacity={0.7}>
            <Text style={styles.sectionActionText}>Manage All</Text>
          </TouchableOpacity>
        </View>

        {/* 2-Column Grid: If only 1 folder total or last odd orphan, occupies full width */}
        <View style={styles.folderGrid}>
          {folders.map((folder, index) => {
            const count = folderCounts[folder.name] || 0;
            const routinesInFolder = folderRoutinesMap[folder.name] || [];
            const previewText =
              routinesInFolder.length > 0
                ? routinesInFolder.map((r) => r.title.replace(/^Workout [A-Z] — |^Indoor [A-Z] — /, '')).join(' • ')
                : 'No routines assigned';
            const isSelected = selectedFolder === folder.name;
            const isOnlyOne = folders.length === 1;
            const isLastOdd = folders.length % 2 === 1 && index === folders.length - 1;
            const isFullWidth = isOnlyOne || isLastOdd;

            return (
              <TouchableOpacity
                key={folder.id || folder.name}
                style={[
                  styles.folderCard,
                  isFullWidth ? styles.folderCardFull : styles.folderCardHalf,
                  isSelected && { borderColor: folder.color, backgroundColor: colors.surfaceRaised },
                ]}
                onPress={() => {
                  setSelectedFolder(isSelected ? null : folder.name);
                }}
                activeOpacity={0.8}
              >
                {/* Folder Top Row */}
                <View style={styles.folderCardTopRow}>
                  <View style={[styles.folderIconBox, { backgroundColor: folder.color + '1E' }]}>
                    <MaterialCommunityIcons
                      name={isSelected ? 'folder-open' : 'folder'}
                      size={18}
                      color={folder.color}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity
                      style={styles.folderPaletteBtn}
                      onPress={() => setColorModalFolder(folder)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="palette-outline" size={15} color={folder.color} />
                    </TouchableOpacity>

                    <View style={styles.folderCountBadge}>
                      <Text style={styles.folderCountText}>{count}</Text>
                    </View>
                  </View>
                </View>

                {/* Folder Title & Preview */}
                <Text style={styles.folderCardTitle} numberOfLines={1}>
                  {folder.name}
                </Text>
                <Text style={styles.folderCardPreview} numberOfLines={1}>
                  {previewText}
                </Text>

                {/* Footer status / toggle prompt */}
                <View style={styles.folderCardFooter}>
                  {isSelected ? (
                    <View style={[styles.filterActivePill, { backgroundColor: folder.color + '22' }]}>
                      <MaterialCommunityIcons name="check" size={11} color={folder.color} />
                      <Text style={[styles.filterActivePillText, { color: folder.color }]}>ACTIVE FILTER</Text>
                    </View>
                  ) : (
                    <Text style={styles.folderTapHint}>Tap to view ({count})</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 6. Workout Templates List (Filtered by selected folder or showing all) */}
        <View style={styles.routineSectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="dumbbell" size={15} color={colors.accent} />
            <Text style={styles.routineSubHeaderTitle}>
              {selectedFolder
                ? `${selectedFolder.toUpperCase()} ROUTINES (${displayedRoutines.length})`
                : `ALL WORKOUT TEMPLATES (${routines.length})`}
            </Text>
          </View>
          {selectedFolder && (
            <TouchableOpacity
              style={styles.clearSelectedFolderBtn}
              onPress={() => setSelectedFolder(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.clearSelectedFolderText}>Show All</Text>
              <MaterialCommunityIcons name="close-circle" size={13} color={colors.accent} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.routineList}>
          {displayedRoutines.length === 0 ? (
            <View style={styles.emptyFolderRoutinesBox}>
              <MaterialCommunityIcons name="folder-open-outline" size={28} color={colors.textDim} />
              <Text style={styles.emptyFolderRoutinesTitle}>No routines in this folder yet</Text>
              <TouchableOpacity onPress={onNavigateToRoutines} style={styles.assignRoutineBtn}>
                <Text style={styles.assignRoutineBtnText}>Manage Routines</Text>
              </TouchableOpacity>
            </View>
          ) : (
            displayedRoutines.map((routine) => {
              const rFolder = routine.folder || 'General';
              const fColor = folderColorMap[rFolder] || colors.accent;
              return (
                <View key={routine.id} style={styles.routineCard}>
                  <View style={styles.routineInfo}>
                    <View style={styles.routineTitleRow}>
                      <Text style={styles.routineTitle}>{routine.title}</Text>
                      <View style={[styles.folderBadgePill, { backgroundColor: fColor + '18', borderColor: fColor + '55' }]}>
                        <MaterialCommunityIcons name="folder" size={10} color={fColor} />
                        <Text style={[styles.folderBadgePillText, { color: fColor }]}>{rFolder}</Text>
                      </View>
                      <View style={styles.categoryPill}>
                        <Text style={styles.categoryPillText}>{routine.category}</Text>
                      </View>
                    </View>
                    <Text style={styles.routineDesc} numberOfLines={1}>
                      {routine.description}
                    </Text>
                    <Text style={styles.exerciseCountText}>
                      {routine.exerciseIds.length} exercises
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.startRoutineBtn}
                    onPress={() => onStartRoutine(routine)}
                    activeOpacity={0.75}
                  >
                    <MaterialCommunityIcons name="play" size={14} color={colors.accent} />
                    <Text style={styles.startRoutineBtnText}>START</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Manual Walk Logger Modal */}
      <LogWalkModal
        visible={isWalkModalVisible}
        onClose={() => setIsWalkModalVisible(false)}
      />

      {/* Folder Color Customization Modal */}
      <Modal
        visible={colorModalFolder !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setColorModalFolder(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.colorPickerModal}>
            <View style={styles.colorPickerHeader}>
              <View>
                <Text style={styles.colorPickerTitle}>Folder Color</Text>
                <Text style={styles.colorPickerSub}>
                  Select signature hue for "{colorModalFolder?.name}"
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setColorModalFolder(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.colorPaletteGrid}>
              {FOLDER_COLOR_PALETTE.map((c) => {
                const isSelected = colorModalFolder?.color?.toLowerCase() === c.toLowerCase();
                return (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorCircleOption,
                      { backgroundColor: c },
                      isSelected && styles.colorCircleActive,
                    ]}
                    onPress={async () => {
                      if (!colorModalFolder) return;
                      await updateFolderColor(colorModalFolder.name, c);
                      setColorModalFolder({ ...colorModalFolder, color: c });
                    }}
                    activeOpacity={0.8}
                  >
                    {isSelected && (
                      <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.colorDoneBtn}
              onPress={() => setColorModalFolder(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.colorDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
      gap: 16,
      paddingBottom: 110,
    },
    athleteCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      gap: 12,
    },
    avatarBox: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: '#EA580C',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImage: {
      width: 48,
      height: 48,
      borderRadius: 16,
    },
    avatarInitials: {
      fontSize: 16,
      fontWeight: '900',
      color: '#FFFFFF',
    },
    athleteDetails: {
      flex: 1,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    athleteName: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    focusBadge: {
      backgroundColor: colors.accentSubtle,
      borderWidth: 1,
      borderColor: colors.accent,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    focusBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.accent,
      fontFamily: 'monospace',
    },
    athleteMeta: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: 'monospace',
      marginTop: 4,
    },
    streakBox: {
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 16,
      alignItems: 'center',
    },
    streakRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    streakNum: {
      fontSize: 13,
      fontWeight: '900',
      color: colors.flame,
      fontFamily: 'monospace',
    },
    streakLabel: {
      fontSize: 8,
      fontWeight: '800',
      color: colors.textDim,
      fontFamily: 'monospace',
      letterSpacing: 0.8,
      marginTop: 2,
    },
    heroStartBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.accent,
      borderRadius: 24,
      paddingVertical: 18,
      paddingHorizontal: 18,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.2,
      shadowRadius: 12,
      elevation: 6,
    },
    heroStartLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    heroIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.accentContrastText === '#FFFFFF' ? '#FFFFFF' : '#000000',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroStartTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.5,
    },
    heroStartSub: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accentContrastText === '#FFFFFF' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.7)',
      letterSpacing: 0.5,
      marginTop: 2,
    },
    walkingCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      padding: 16,
      gap: 14,
    },
    walkingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    walkingTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    walkingIconBox: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    walkingCardTitle: {
      fontSize: 13,
      fontWeight: '900',
      letterSpacing: 0.8,
      color: colors.textPrimary,
    },
    walkingCardSub: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    logWalkBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accent,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      gap: 4,
    },
    logWalkBtnText: {
      fontSize: 11,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.5,
    },
    walkingMetricsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceRaised,
      borderRadius: 14,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    walkingMetricBox: {
      flex: 1,
      alignItems: 'center',
    },
    walkingMetricNum: {
      fontSize: 13,
      fontWeight: '900',
      color: colors.textPrimary,
      fontFamily: 'monospace',
    },
    walkingMetricLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 0.5,
      marginTop: 2,
    },
    metricDivider: {
      width: 1,
      height: 22,
      backgroundColor: colors.surfaceBorder,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.textMuted,
      letterSpacing: 1,
    },
    sectionActionText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.accent,
    },
    routineList: {
      gap: 12,
    },
    routineCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    routineInfo: {
      flex: 1,
      minWidth: 0,
      paddingRight: 10,
    },
    routineTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    routineTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
      flexShrink: 1,
    },
    categoryPill: {
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      flexShrink: 0,
      alignSelf: 'center',
    },
    categoryPillText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textMuted,
      fontFamily: 'monospace',
    },
    routineDesc: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
    },
    exerciseCountText: {
      fontSize: 11,
      color: colors.textDim,
      fontFamily: 'monospace',
      marginTop: 4,
    },
    startRoutineBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      gap: 6,
    },
    startRoutineBtnText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 0.5,
    },
    // Folder Grid Styles
    folderGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    folderCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 14,
      borderWidth: 1.5,
      borderColor: colors.surfaceBorder,
    },
    folderCardFull: {
      width: '100%',
    },
    folderCardHalf: {
      width: '48.4%',
    },
    folderCardTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    folderIconBox: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    folderPaletteBtn: {
      padding: 5,
      borderRadius: 8,
      backgroundColor: colors.surfaceRaised,
    },
    folderCountBadge: {
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    folderCountText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textMuted,
      fontFamily: 'monospace',
    },
    folderCardTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: 10,
    },
    folderCardPreview: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 3,
    },
    folderCardFooter: {
      marginTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
    },
    filterActivePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    filterActivePillText: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    folderTapHint: {
      fontSize: 10,
      color: colors.textDim,
      fontFamily: 'monospace',
    },
    routineSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
      marginBottom: 2,
    },
    routineSubHeaderTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textMuted,
      fontFamily: 'monospace',
      letterSpacing: 0.8,
    },
    clearSelectedFolderBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    clearSelectedFolderText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.accent,
    },
    emptyFolderRoutinesBox: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    emptyFolderRoutinesTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textMuted,
      marginTop: 8,
      marginBottom: 12,
    },
    assignRoutineBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: colors.accent,
    },
    assignRoutineBtnText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accentContrastText,
    },
    folderBadgePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 5,
      borderWidth: 1,
    },
    folderBadgePillText: {
      fontSize: 9,
      fontWeight: '700',
      fontFamily: 'monospace',
    },
    // Color Picker Modal Styles
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    colorPickerModal: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    colorPickerHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    colorPickerTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    colorPickerSub: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    colorPaletteGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'center',
      paddingVertical: 8,
    },
    colorCircleOption: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    colorCircleActive: {
      borderWidth: 3,
      borderColor: '#FFFFFF',
      elevation: 4,
    },
    colorDoneBtn: {
      marginTop: 18,
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: 'center',
    },
    colorDoneBtnText: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.5,
    },
  });
