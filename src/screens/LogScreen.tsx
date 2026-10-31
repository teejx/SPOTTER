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
  TextInput,
  Alert,
  Platform,
  StatusBar as RNStatusBar,
  Animated,
} from 'react-native';
import { LogScreenSkeleton } from '../components/ClaySkeleton';
import { useScreenLoading } from '../hooks/useScreenLoading';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';
import { useScreenBottomPadding } from '../hooks/useScreenBottomPadding';
import { RoutineTemplate, RoutineFolder } from '../types';
import { FOLDER_COLOR_PALETTE } from '../lib/seedData';
import { LogWalkModal } from '../components/LogWalkModal';
import { BottomSheetModal } from '../components/BottomSheetModal';
import { getLevelInfo } from '../utils/gamification';

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
    renameFolder,
    deleteFolder,
    colors,
    isDark,
    isLoading,
  } = useFitness();
  const bottomPadding = useScreenBottomPadding(32);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 0
  );

  const [isWalkModalVisible, setIsWalkModalVisible] = useState(false);
  const [openedFolder, setOpenedFolder] = useState<RoutineFolder | null>(null);
  const [menuFolder, setMenuFolder] = useState<RoutineFolder | null>(null);
  const [renameModalFolder, setRenameModalFolder] = useState<RoutineFolder | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [colorModalFolder, setColorModalFolder] = useState<RoutineFolder | null>(null);

  const athleteName = activeUser?.name?.includes('@')
    ? activeUser.name.split('@')[0]
    : activeUser?.name || 'Guest Athlete';

  const initials = athleteName.slice(0, 2).toUpperCase();

  const levelInfo = useMemo(() => getLevelInfo(activeUser?.exp || 0), [activeUser?.exp]);

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



  const { showSkeleton, contentOpacity } = useScreenLoading({ isLoading: isLoading || !activeUser });

  if (showSkeleton) {
    return <LogScreenSkeleton />;
  }

  return (
    <Animated.View style={[styles.container, { opacity: contentOpacity }]}>
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]} showsVerticalScrollIndicator={false}>
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
              {activeUser?.bodyWeight || 75} {activeUser?.weightUnit || 'kg'}
            </Text>
          </View>

          <View style={styles.statMetricBox}>
            <View style={styles.statMetricRow}>
              <MaterialCommunityIcons name="shield-star" size={16} color={colors.accent} />
              <Text style={styles.statMetricNum}>LVL {levelInfo.level}</Text>
            </View>
            <Text style={styles.statMetricLabel}>{levelInfo.title.toUpperCase()}</Text>
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
                color={colors.accentContrastText}
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
                ? routinesInFolder.map((r) => r.title.replace(/^Workout [A-Z] — |^Indoor [A-Z] — |^Outdoor [A-Z] — /, '')).join(' • ')
                : 'No routines assigned';
            const isOnlyOne = folders.length === 1;
            const isLastOdd = folders.length % 2 === 1 && index === folders.length - 1;
            const isFullWidth = isOnlyOne || isLastOdd;

            return (
              <TouchableOpacity
                key={folder.id || folder.name}
                style={[
                  styles.folderCard,
                  isFullWidth ? styles.folderCardFull : styles.folderCardHalf,
                ]}
                onPress={() => {
                  setOpenedFolder(folder);
                }}
                activeOpacity={0.8}
              >
                {/* Folder Top Row */}
                <View style={styles.folderCardTopRow}>
                  <View style={[styles.folderIconBox, { backgroundColor: folder.color + '1E' }]}>
                    <MaterialCommunityIcons
                      name="folder"
                      size={18}
                      color={folder.color}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={styles.folderCountBadge}>
                      <Text style={styles.folderCountText}>{count}</Text>
                    </View>

                    {/* 3 Dots Menu Button (Rename, Delete, Change Color) */}
                    <TouchableOpacity
                      style={styles.folderMenuBtn}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        setMenuFolder(folder);
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="dots-vertical" size={17} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Folder Title & Preview */}
                <Text style={styles.folderCardTitle} numberOfLines={1}>
                  {folder.name}
                </Text>
                <Text style={styles.folderCardPreview} numberOfLines={1}>
                  {previewText}
                </Text>

                {/* Footer status / open prompt */}
                <View style={styles.folderCardFooter}>
                  <Text style={styles.folderTapHint}>Tap to open ({count})</Text>
                  <MaterialCommunityIcons name="chevron-right" size={14} color={colors.textDim} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Manual Walk Logger Modal */}
      <LogWalkModal
        visible={isWalkModalVisible}
        onClose={() => setIsWalkModalVisible(false)}
      />

      {/* Dedicated Folder Detail Screen / View Modal */}
      <Modal
        visible={openedFolder !== null}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setOpenedFolder(null)}
      >
        <RNStatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <View style={[styles.folderDetailContainer, { paddingTop: topInset + 10 }]}>
          {/* Header */}
          <View style={styles.folderDetailHeader}>
            <TouchableOpacity
              style={styles.folderDetailBackBtn}
              onPress={() => setOpenedFolder(null)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </TouchableOpacity>

            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={[
                  styles.folderDetailIconBox,
                  { backgroundColor: (openedFolder?.color || colors.accent) + '22' },
                ]}
              >
                <MaterialCommunityIcons
                  name="folder-open"
                  size={20}
                  color={openedFolder?.color || colors.accent}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.folderDetailTitle} numberOfLines={1}>
                  {openedFolder?.name}
                </Text>
                <Text style={styles.folderDetailSubtitle}>
                  {(folderRoutinesMap[openedFolder?.name || ''] || []).length} workout templates
                </Text>
              </View>
            </View>

            {/* Top Right Action: 3 Dots Menu */}
            <TouchableOpacity
              style={styles.folderDetailActionBtn}
              onPress={() => {
                if (openedFolder) setMenuFolder(openedFolder);
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="dots-vertical" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Folder Templates List */}
          <ScrollView
            style={styles.folderDetailScroll}
            contentContainerStyle={styles.folderDetailScrollContent}
          >
            {openedFolder && (folderRoutinesMap[openedFolder.name] || []).length === 0 ? (
              <View style={styles.emptyFolderDetailBox}>
                <MaterialCommunityIcons name="folder-open-outline" size={48} color={colors.textDim} />
                <Text style={styles.emptyFolderDetailTitle}>No routines in this folder</Text>
                <Text style={styles.emptyFolderDetailSub}>
                  Use "Manage All" or the Routines tab to assign workouts to "{openedFolder.name}".
                </Text>
                <TouchableOpacity
                  style={styles.folderDetailManageBtn}
                  onPress={() => {
                    setOpenedFolder(null);
                    onNavigateToRoutines();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.folderDetailManageBtnText}>GO TO ROUTINES</Text>
                </TouchableOpacity>
              </View>
            ) : (
              (folderRoutinesMap[openedFolder?.name || ''] || []).map((routine) => {
                const fColor = openedFolder?.color || colors.accent;
                return (
                  <View key={routine.id} style={styles.routineCard}>
                    <View style={styles.routineInfo}>
                      <View style={styles.routineTitleRow}>
                        <Text style={styles.routineTitle}>{routine.title}</Text>
                        <View style={styles.categoryPill}>
                          <Text style={styles.categoryPillText}>{routine.category}</Text>
                        </View>
                      </View>
                      <Text style={styles.routineDesc} numberOfLines={2}>
                        {routine.description}
                      </Text>
                      <Text style={styles.exerciseCountText}>
                        {routine.exerciseIds.length} exercises
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.startRoutineBtn}
                      onPress={() => {
                        setOpenedFolder(null);
                        onStartRoutine(routine);
                      }}
                      activeOpacity={0.75}
                    >
                      <MaterialCommunityIcons name="play" size={14} color={fColor} />
                      <Text style={[styles.startRoutineBtnText, { color: fColor }]}>START</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* 3-Dots Folder Context Bottom Sheet (Rename, Delete, Change Color) */}
      <BottomSheetModal
        visible={menuFolder !== null}
        onClose={() => setMenuFolder(null)}
        containerStyle={{ paddingHorizontal: 20, paddingTop: 4 }}
      >
        <View style={styles.menuHeader}>
          <View style={[styles.folderIconBox, { backgroundColor: (menuFolder?.color || colors.accent) + '1E' }]}>
            <MaterialCommunityIcons name="folder" size={18} color={menuFolder?.color || colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle} numberOfLines={1}>{menuFolder?.name}</Text>
            <Text style={styles.menuSubtitle}>Folder Options</Text>
          </View>
          <TouchableOpacity onPress={() => setMenuFolder(null)}>
            <MaterialCommunityIcons name="close" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.menuDivider} />

        {/* 1. Rename */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            if (menuFolder) {
              setRenameValue(menuFolder.name);
              setRenameModalFolder(menuFolder);
              setMenuFolder(null);
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemIconBox}>
            <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.textPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuItemLabel}>Rename Folder</Text>
            <Text style={styles.menuItemSub}>Change folder display title</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textDim} />
        </TouchableOpacity>

        {/* 2. Change Color */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            if (menuFolder) {
              setColorModalFolder(menuFolder);
              setMenuFolder(null);
            }
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.menuItemIconBox, { backgroundColor: (menuFolder?.color || colors.accent) + '22' }]}>
            <MaterialCommunityIcons name="palette-outline" size={18} color={menuFolder?.color || colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuItemLabel}>Change Color</Text>
            <Text style={styles.menuItemSub}>Pick signature palette hue</Text>
          </View>
          <View style={[styles.menuColorDot, { backgroundColor: menuFolder?.color || colors.accent }]} />
        </TouchableOpacity>

        {/* 3. Delete */}
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomWidth: 0 }]}
          onPress={() => {
            if (!menuFolder) return;
            const fNameToDelete = menuFolder.name;
            setMenuFolder(null);
            Alert.alert(
              'Delete Folder',
              `Are you sure you want to delete "${fNameToDelete}"? Routines will be reassigned.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    await deleteFolder(fNameToDelete);
                    if (openedFolder?.name === fNameToDelete) {
                      setOpenedFolder(null);
                    }
                  },
                },
              ]
            );
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.menuItemIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuItemLabel, { color: colors.danger }]}>Delete Folder</Text>
            <Text style={styles.menuItemSub}>Remove folder from logbook</Text>
          </View>
        </TouchableOpacity>
      </BottomSheetModal>

      {/* Rename Folder Bottom Sheet */}
      <BottomSheetModal
        visible={renameModalFolder !== null}
        onClose={() => setRenameModalFolder(null)}
        containerStyle={{ paddingHorizontal: 20, paddingTop: 4 }}
      >
        <Text style={styles.renameModalTitle}>Rename Folder</Text>
        <Text style={styles.renameModalSub}>
          Enter a new name for "{renameModalFolder?.name}"
        </Text>

        <TextInput
          style={styles.renameInput}
          value={renameValue}
          onChangeText={setRenameValue}
          placeholder="Folder Name"
          placeholderTextColor={colors.textDim}
          autoFocus
          selectTextOnFocus
        />

        <View style={styles.renameButtonsRow}>
          <TouchableOpacity
            style={styles.renameCancelBtn}
            onPress={() => setRenameModalFolder(null)}
            activeOpacity={0.7}
          >
            <Text style={styles.renameCancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.renameConfirmBtn,
              !renameValue.trim() && { opacity: 0.5 },
            ]}
            disabled={!renameValue.trim()}
            onPress={async () => {
              if (renameModalFolder && renameValue.trim()) {
                await renameFolder(renameModalFolder.name, renameValue.trim());
                if (openedFolder?.name === renameModalFolder.name) {
                  setOpenedFolder({ ...openedFolder, name: renameValue.trim() });
                }
                setRenameModalFolder(null);
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.renameConfirmBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetModal>

      {/* Folder Color Customization Bottom Sheet */}
      <BottomSheetModal
        visible={colorModalFolder !== null}
        onClose={() => setColorModalFolder(null)}
        containerStyle={{ paddingHorizontal: 20, paddingTop: 4 }}
      >
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
                  if (openedFolder?.name === colorModalFolder.name) {
                    setOpenedFolder({ ...openedFolder, color: c });
                  }
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
      </BottomSheetModal>
    </Animated.View>
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
      borderWidth: 1.5,
      borderColor: colors.surfaceBorder,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.08,
      shadowRadius: 10,
      elevation: 4,
      gap: 12,
    },
    avatarBox: {
      width: 52,
      height: 52,
      borderRadius: 18,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: colors.accent,
      elevation: 3,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
    },
    avatarImage: {
      width: 52,
      height: 52,
      borderRadius: 18,
    },
    avatarInitials: {
      fontSize: 18,
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
      fontSize: 17,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    focusBadge: {
      backgroundColor: colors.accentSubtle,
      borderWidth: 1,
      borderColor: colors.accent,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    focusBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.accent,
      fontFamily: 'monospace',
    },
    athleteMeta: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: 'monospace',
      marginTop: 4,
    },
    statMetricBox: {
      backgroundColor: isDark ? '#1F2A3C' : '#E7EEFF',
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.95)',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 18,
      alignItems: 'center',
    },
    statMetricRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statMetricNum: {
      fontSize: 13,
      fontWeight: '900',
      color: colors.accent,
      fontFamily: 'monospace',
    },
    statMetricLabel: {
      fontSize: 8,
      fontWeight: '900',
      color: colors.textDim,
      fontFamily: 'monospace',
      letterSpacing: 0.8,
      marginTop: 2,
    },
    streakBox: {
      backgroundColor: isDark ? '#1C1F2B' : '#F1F5F9',
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 18,
      alignItems: 'center',
      shadowColor: isDark ? '#000' : '#CBD5E1',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    streakRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    streakNum: {
      fontSize: 14,
      fontWeight: '900',
      color: colors.flame,
      fontFamily: 'monospace',
    },
    streakLabel: {
      fontSize: 8,
      fontWeight: '900',
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
      borderRadius: 9999,
      minHeight: 64,
      borderWidth: 2,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.30)' : 'rgba(255, 255, 255, 0.70)',
      paddingVertical: 14,
      paddingHorizontal: 20,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.35 : 0.40,
      shadowRadius: 16,
      elevation: 8,
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
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.28)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.45)',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.20,
      shadowRadius: 4,
      elevation: 3,
    },
    heroStartTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.6,
    },
    heroStartSub: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accentContrastText,
      opacity: 0.85,
      letterSpacing: 0.5,
      marginTop: 2,
    },
    walkingCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: colors.surfaceBorder,
      padding: 18,
      gap: 14,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.08,
      shadowRadius: 10,
      elevation: 4,
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
      width: 38,
      height: 38,
      borderRadius: 14,
      backgroundColor: isDark ? '#1F2232' : '#F1F5F9',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    walkingCardTitle: {
      fontSize: 14,
      fontWeight: '900',
      letterSpacing: 0.8,
      color: colors.textPrimary,
    },
    walkingCardSub: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textMuted,
      marginTop: 2,
    },
    logWalkBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accent,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : '#FFFFFF',
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
      backgroundColor: isDark ? '#040E1F' : '#E7EEFF',
      borderRadius: 18,
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(17, 28, 45, 0.08)',
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
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: colors.surfaceBorder,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.06,
      shadowRadius: 8,
      elevation: 3,
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
      borderRadius: 22,
      padding: 16,
      borderWidth: 1.5,
      borderColor: colors.surfaceBorder,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.06,
      shadowRadius: 8,
      elevation: 3,
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
    folderMenuBtn: {
      padding: 4,
      borderRadius: 8,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    // Folder Detail Screen Modal Styles
    folderDetailContainer: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    folderDetailHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceBorder,
      gap: 12,
    },
    folderDetailBackBtn: {
      padding: 6,
      borderRadius: 10,
      backgroundColor: colors.surfaceRaised,
    },
    folderDetailIconBox: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    folderDetailTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    folderDetailSubtitle: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: 'monospace',
      marginTop: 2,
    },
    folderDetailActionBtn: {
      padding: 6,
      borderRadius: 10,
      backgroundColor: colors.surfaceRaised,
    },
    folderDetailScroll: {
      flex: 1,
      backgroundColor: colors.background,
    },
    folderDetailScrollContent: {
      padding: 16,
      gap: 12,
      paddingBottom: 60,
    },
    emptyFolderDetailBox: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 32,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      marginTop: 40,
    },
    emptyFolderDetailTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: 12,
    },
    emptyFolderDetailSub: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 6,
      lineHeight: 18,
    },
    folderDetailManageBtn: {
      marginTop: 20,
      backgroundColor: colors.accent,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 12,
    },
    folderDetailManageBtnText: {
      fontSize: 11,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.5,
    },
    // 3-Dots Menu Popover Modal Styles
    menuBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
      padding: 16,
    },
    menuCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 10,
    },
    menuHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    menuTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    menuSubtitle: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    menuDivider: {
      height: 1,
      backgroundColor: colors.surfaceBorder,
      marginBottom: 6,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceBorder,
      gap: 14,
    },
    menuItemIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuItemLabel: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    menuItemSub: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    menuColorDot: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    // Rename Modal Styles
    renameModalCard: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    renameModalTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    renameModalSub: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
      marginBottom: 14,
    },
    renameInput: {
      backgroundColor: colors.surfaceRaised,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '700',
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      marginBottom: 16,
    },
    renameButtonsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    renameCancelBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.surfaceRaised,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    renameCancelBtnText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textMuted,
    },
    renameConfirmBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.accent,
      alignItems: 'center',
    },
    renameConfirmBtnText: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.accentContrastText,
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
