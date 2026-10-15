import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  SafeAreaView,
  FlatList,
  Platform,
  StatusBar as RNStatusBar,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';
import { EXERCISE_DATABASE } from '../lib/exercises';
import { PPL_PRESCRIPTIONS, FOLDER_COLOR_PALETTE } from '../lib/seedData';
import { ExerciseGuideModal } from '../components/ExerciseGuideModal';
import { ExercisePickerModal } from '../components/ExercisePickerModal';
import { WorkoutConfirmModal } from '../components/WorkoutConfirmModal';
import { ExerciseDefinition, RoutineTemplate, MuscleGroup, RoutineFolder, RoutineExerciseConfig } from '../types';

interface RoutinesScreenProps {
  onStartRoutine: (routine: RoutineTemplate) => void;
}

const CATEGORIES: ('All' | MuscleGroup)[] = [
  'All',
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Arms',
  'Core',
];

const DIFFICULTY_LEVELS = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

export const RoutinesScreen: React.FC<RoutinesScreenProps> = ({ onStartRoutine }) => {
  const {
    routines,
    deleteRoutine,
    createRoutine,
    updateRoutine,
    folders,
    updateRoutineFolder,
    createFolder,
    updateFolderColor,
    deleteFolder,
    currentUser,
    colors,
    isDark,
  } = useFitness();
  const activeUser = currentUser;
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 0
  );

  const [activeSegment, setActiveSegment] = useState<'routines' | 'library'>('routines');
  const [selectedGuideExercise, setSelectedGuideExercise] = useState<ExerciseDefinition | null>(null);

  // Folder filtering and management state
  const [selectedFolder, setSelectedFolder] = useState<string>('All');
  const [routineToMove, setRoutineToMove] = useState<RoutineTemplate | null>(null);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLOR_PALETTE[0]);
  const [colorEditFolder, setColorEditFolder] = useState<RoutineFolder | null>(null);

  // Library filters
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | MuscleGroup>('All');
  const [activeLevel, setActiveLevel] = useState<string>('All Levels');

  // Routine Builder modal
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [routineToEdit, setRoutineToEdit] = useState<RoutineTemplate | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Push');
  const [builderFolder, setBuilderFolder] = useState('General');
  const [selectedExIds, setSelectedExIds] = useState<string[]>([]);
  // Detailed exercise configuration per exercise in routine
  const [builderExercises, setBuilderExercises] = useState<RoutineExerciseConfig[]>([]);
  // String buffer for weight inputs to preserve decimals during typing
  const [builderWeightTexts, setBuilderWeightTexts] = useState<Record<number, string>>({});
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Custom Animated Confirmation Modal State for delete_routine & delete_folder
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    type: 'delete_routine' | 'delete_folder';
    id?: string;
    title: string;
  } | null>(null);

  const builderScrollRef = useRef<ScrollView>(null);

  // Compute folder counts
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = { All: routines.length };
    folders.forEach((f) => {
      counts[f.name] = 0;
    });
    routines.forEach((r) => {
      const f = r.folder || 'General';
      counts[f] = (counts[f] || 0) + 1;
    });
    return counts;
  }, [routines, folders]);

  const folderColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    folders.forEach((f) => {
      map[f.name] = f.color;
    });
    return map;
  }, [folders]);

  // Routines filtered by selected folder
  const displayedRoutines = useMemo(() => {
    if (selectedFolder === 'All') return routines;
    return routines.filter((r) => (r.folder || 'General') === selectedFolder);
  }, [routines, selectedFolder]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const filteredExercises = useMemo(() => {
    return EXERCISE_DATABASE.filter((ex) => {
      const matchCat = activeCategory === 'All' || ex.category === activeCategory;
      const matchSearch =
        ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.equipment.toLowerCase().includes(search.toLowerCase());
      const matchLevel =
        activeLevel === 'All Levels' ||
        (ex.difficulty && ex.difficulty.toLowerCase() === activeLevel.toLowerCase());
      return matchCat && matchSearch && matchLevel;
    });
  }, [search, activeCategory, activeLevel]);

  const handleDelete = (id: string, title: string) => {
    setConfirmModal({
      visible: true,
      type: 'delete_routine',
      id,
      title,
    });
  };

  const handleOpenEditRoutine = (routine: RoutineTemplate) => {
    setRoutineToEdit(routine);
    setNewTitle(routine.title);
    setNewDesc(routine.description);
    setNewCategory(routine.category);
    setBuilderFolder(routine.folder || 'General');
    setSelectedExIds([...routine.exerciseIds]);

    // Load existing exercise configs or generate sensible defaults
    const configs: RoutineExerciseConfig[] = routine.exerciseIds.map((exId) => {
      const existing = routine.routineExercises?.find((c) => c.exerciseId === exId);
      if (existing) return existing;
      const def = EXERCISE_DATABASE.find((e) => e.id === exId);
      const prescription = PPL_PRESCRIPTIONS[exId];
      return {
        exerciseId: exId,
        exerciseName: def?.name,
        targetSets: prescription?.sets || 3,
        targetReps: prescription?.targetReps || 10,
        defaultWeight: prescription?.defaultWeightKg || 0,
        weightUnit: (activeUser?.weightUnit || 'kg'),
      };
    });
    setBuilderExercises(configs);
    setBuilderWeightTexts({});
    setIsBuilderOpen(true);
  };

  const handleOpenCreateRoutine = () => {
    setRoutineToEdit(null);
    setNewTitle('');
    setNewDesc('');
    setNewCategory('Push');
    setBuilderFolder(selectedFolder !== 'All' ? selectedFolder : (folders[0]?.name || 'General'));
    setSelectedExIds([]);
    setBuilderExercises([]);
    setBuilderWeightTexts({});
    setIsBuilderOpen(true);
  };

  const handleRemoveBuilderExercise = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBuilderWeightTexts({});
    setBuilderExercises((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setSelectedExIds(next.map((c) => c.exerciseId));
      return next;
    });
  };

  const handleMoveBuilderExercise = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= builderExercises.length) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBuilderWeightTexts({});

    const nextConfigs = [...builderExercises];
    const [movedConfig] = nextConfigs.splice(index, 1);
    nextConfigs.splice(targetIndex, 0, movedConfig);
    setBuilderExercises(nextConfigs);
    setSelectedExIds(nextConfigs.map((c) => c.exerciseId));
  };

  const handleUpdateBuilderExerciseSets = (index: number, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBuilderExercises((prev) => {
      const next = [...prev];
      if (next[index]) {
        const currentSets = next[index].targetSets || 3;
        const newSets = Math.max(1, Math.min(20, currentSets + delta));
        next[index] = { ...next[index], targetSets: newSets };
      }
      return next;
    });
  };

  const handleUpdateBuilderExerciseReps = (index: number, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBuilderExercises((prev) => {
      const next = [...prev];
      if (next[index]) {
        const currentReps = next[index].targetReps || 10;
        const newReps = Math.max(1, Math.min(100, currentReps + delta));
        next[index] = { ...next[index], targetReps: newReps };
      }
      return next;
    });
  };

  const handleUpdateBuilderExerciseWeight = (index: number, weight: number) => {
    setBuilderExercises((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], defaultWeight: Math.max(0, weight) };
      }
      return next;
    });
  };

  const handleToggleBuilderExerciseUnit = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBuilderExercises((prev) => {
      const next = [...prev];
      if (next[index]) {
        const currentUnit = next[index].weightUnit || activeUser?.weightUnit || 'kg';
        const newUnit = currentUnit === 'kg' ? 'lbs' : 'kg';
        next[index] = { ...next[index], weightUnit: newUnit };
      }
      return next;
    });
  };

  const handleSaveCustomRoutine = async () => {
    const currentExercises = [...builderExercises];
    const currentIds = currentExercises.map((c) => c.exerciseId);
    if (!newTitle.trim() || currentIds.length === 0) {
      Alert.alert('Incomplete Routine', 'Please enter a routine title and add at least one exercise.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (routineToEdit) {
      await updateRoutine({
        ...routineToEdit,
        title: newTitle.trim(),
        description: newDesc.trim(),
        category: newCategory,
        folder: builderFolder,
        exerciseIds: currentIds,
        routineExercises: currentExercises,
      });
    } else {
      await createRoutine(
        newTitle.trim(),
        newDesc.trim(),
        newCategory,
        currentIds,
        builderFolder,
        currentExercises
      );
    }
    setIsBuilderOpen(false);
    setRoutineToEdit(null);
    setNewTitle('');
    setNewDesc('');
    setSelectedExIds([]);
    setBuilderExercises([]);
    setBuilderWeightTexts({});
  };

  const handleConfirmDelete = () => {
    if (!confirmModal) return;
    if (confirmModal.type === 'delete_routine' && confirmModal.id) {
      deleteRoutine(confirmModal.id);
    } else if (confirmModal.type === 'delete_folder' && confirmModal.title) {
      deleteFolder(confirmModal.title);
      setSelectedFolder('All');
    }
    setConfirmModal(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Exact Segmented Pill Switcher from Original */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'routines' && styles.segmentBtnActive]}
          onPress={() => setActiveSegment('routines')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="book-open-outline"
            size={16}
            color={activeSegment === 'routines' ? colors.accentContrastText : colors.textMuted}
          />
          <Text
            style={[styles.segmentText, activeSegment === 'routines' && styles.segmentTextActive]}
          >
            MY ROUTINES
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'library' && styles.segmentBtnActive]}
          onPress={() => setActiveSegment('library')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="dumbbell"
            size={16}
            color={activeSegment === 'library' ? colors.accentContrastText : colors.textMuted}
          />
          <Text
            style={[styles.segmentText, activeSegment === 'library' && styles.segmentTextActive]}
          >
            EXERCISE LIBRARY
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2. TAB: MY ROUTINES */}
      {activeSegment === 'routines' && (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.pageTitle}>Workout Templates</Text>
              <Text style={styles.pageSubtitle}>Save your favorite workout splits</Text>
            </View>
            <TouchableOpacity
              style={styles.newRoutineBtn}
              onPress={handleOpenCreateRoutine}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="plus" size={16} color={colors.accentContrastText} />
              <Text style={styles.newRoutineBtnText}>NEW ROUTINE</Text>
            </TouchableOpacity>
          </View>

          {/* Folder Filter & Management Bar */}
          <View style={styles.folderSection}>
            <View style={styles.folderSectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="folder-multiple-outline" size={15} color={colors.accent} />
                <Text style={styles.folderSectionTitle}>FOLDERS</Text>
              </View>
              <TouchableOpacity
                style={styles.addFolderHeaderBtn}
                onPress={() => {
                  setNewFolderName('');
                  setIsCreateFolderModalOpen(true);
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="folder-plus-outline" size={14} color={colors.accent} />
                <Text style={styles.addFolderHeaderBtnText}>+ NEW FOLDER</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.folderChipsScroll}
            >
              <TouchableOpacity
                style={[
                  styles.folderChip,
                  selectedFolder === 'All' && styles.folderChipActive,
                ]}
                onPress={() => setSelectedFolder('All')}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons
                  name="folder-multiple"
                  size={14}
                  color={selectedFolder === 'All' ? colors.accentContrastText : colors.textMuted}
                />
                <Text
                  style={[
                    styles.folderChipText,
                    selectedFolder === 'All' && styles.folderChipTextActive,
                  ]}
                >
                  All ({routines.length})
                </Text>
              </TouchableOpacity>

              {folders.map((f) => {
                const isActive = selectedFolder === f.name;
                const count = folderCounts[f.name] || 0;
                return (
                  <TouchableOpacity
                    key={f.id || f.name}
                    style={[
                      styles.folderChip,
                      isActive && { backgroundColor: f.color, borderColor: f.color },
                    ]}
                    onPress={() => setSelectedFolder(f.name)}
                    activeOpacity={0.75}
                  >
                    <MaterialCommunityIcons
                      name={isActive ? 'folder-open' : 'folder'}
                      size={14}
                      color={isActive ? '#FFFFFF' : f.color}
                    />
                    <Text
                      style={[
                        styles.folderChipText,
                        isActive && styles.folderChipTextActive,
                      ]}
                    >
                      {f.name} ({count})
                    </Text>
                    {isActive && (
                      <TouchableOpacity
                        onPress={() => setColorEditFolder(f)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={{ marginLeft: 3 }}
                      >
                        <MaterialCommunityIcons name="palette-outline" size={13} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {displayedRoutines.length === 0 ? (
            <View style={styles.emptyFolderCard}>
              <MaterialCommunityIcons name="folder-open-outline" size={36} color={colors.textDim} />
              <Text style={styles.emptyFolderTitle}>No routines in this folder</Text>
              <Text style={styles.emptyFolderSub}>
                Assign existing routines to "{selectedFolder}" or create a new routine inside it.
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <TouchableOpacity
                  style={styles.emptyFolderBtn}
                  onPress={() => {
                    setBuilderFolder(selectedFolder);
                    setIsBuilderOpen(true);
                  }}
                >
                  <Text style={styles.emptyFolderBtnText}>+ CREATE ROUTINE</Text>
                </TouchableOpacity>
                {selectedFolder !== 'All' && (
                  <TouchableOpacity
                    style={[styles.emptyFolderBtn, { borderColor: colors.danger, backgroundColor: 'transparent' }]}
                    onPress={() => {
                      setConfirmModal({
                        visible: true,
                        type: 'delete_folder',
                        title: selectedFolder,
                      });
                    }}
                  >
                    <Text style={[styles.emptyFolderBtnText, { color: colors.danger }]}>DELETE FOLDER</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            displayedRoutines.map((routine) => (
              <View key={routine.id} style={styles.routineCard}>
                <View style={styles.routineCardHeader}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.titleBadgeRow}>
                      <Text style={styles.cardTitle}>{routine.title}</Text>
                      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <TouchableOpacity
                          style={[
                            styles.folderBadge,
                            { borderColor: (folderColorMap[routine.folder || 'General'] || colors.accent) + '55' },
                          ]}
                          onPress={() => setRoutineToMove(routine)}
                          activeOpacity={0.75}
                        >
                          <MaterialCommunityIcons
                            name="folder"
                            size={11}
                            color={folderColorMap[routine.folder || 'General'] || colors.accent}
                          />
                          <Text
                            style={[
                              styles.folderBadgeText,
                              { color: folderColorMap[routine.folder || 'General'] || colors.accent },
                            ]}
                          >
                            {routine.folder || 'General'}
                          </Text>
                          <MaterialCommunityIcons name="chevron-down" size={11} color={colors.textDim} />
                        </TouchableOpacity>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>{routine.category}</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.cardDesc}>{routine.description}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => handleOpenEditRoutine(routine)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Edit routine"
                    >
                      <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.textDim} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => setRoutineToMove(routine)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Move to folder"
                    >
                      <MaterialCommunityIcons name="folder-move-outline" size={18} color={colors.textDim} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => handleDelete(routine.id, routine.title)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Delete routine"
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textDim} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Exact exercise pill chips with volt rep range */}
                <View style={styles.chipsRow}>
                  {routine.exerciseIds.map((exId) => {
                    const ex = EXERCISE_DATABASE.find((e) => e.id === exId);
                    const prescription = PPL_PRESCRIPTIONS[exId];
                    if (!ex) return null;

                    return (
                      <TouchableOpacity
                        key={exId}
                        style={styles.exerciseChip}
                        onPress={() => setSelectedGuideExercise(ex)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.exerciseChipName}>{ex.name}</Text>
                        {prescription && (
                          <Text style={styles.exerciseChipReps}>{prescription.repRange}</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Launch button */}
                <TouchableOpacity
                  style={styles.launchBtn}
                  onPress={() => onStartRoutine(routine)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="play" size={16} color="#FFFFFF" />
                  <Text style={styles.launchBtnText}>LAUNCH THIS ROUTINE</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* 3. TAB: EXERCISE LIBRARY */}
      {activeSegment === 'library' && (
        <View style={{ flex: 1 }}>
          {/* Search bar */}
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.textDim} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercise library..."
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

          {/* Category Filter Chips */}
          <View style={styles.chipScroll}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={CATEGORIES}
              keyExtractor={(item) => item}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
              renderItem={({ item }) => {
                const isSelected = activeCategory === item;
                return (
                  <TouchableOpacity
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => setActiveCategory(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {/* Level Filter Chips */}
          <View style={styles.levelRow}>
            <Text style={styles.levelLabel}>LEVEL:</Text>
            {DIFFICULTY_LEVELS.map((lvl) => {
              const isSelected = activeLevel === lvl;
              return (
                <TouchableOpacity
                  key={lvl}
                  style={[styles.levelChip, isSelected && styles.levelChipActive]}
                  onPress={() => setActiveLevel(lvl)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.levelText, isSelected && styles.levelTextActive]}>
                    {lvl === 'All Levels' ? lvl : `• ${lvl}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Exercise List */}
          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.exerciseCard}>
                <TouchableOpacity
                  style={styles.exerciseCardLeft}
                  onPress={() => setSelectedGuideExercise(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.titleWithBadge}>
                    <Text style={styles.exerciseCardName}>{item.name}</Text>
                    <View style={styles.loopBadge}>
                      <Text style={styles.loopBadgeText}>Loop & Guide</Text>
                    </View>
                  </View>

                  <View style={styles.exerciseMetaRow}>
                    <Text style={styles.exerciseMetaText}>{item.category}</Text>
                    <Text style={styles.exerciseMetaDot}>•</Text>
                    <Text style={styles.exerciseMetaText}>{item.equipment}</Text>
                    {item.difficulty && (
                      <View style={styles.diffPill}>
                        <Text style={styles.diffPillText}>• {item.difficulty.toUpperCase()}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Right Action Icons: Info & Play */}
                <View style={styles.exerciseCardRight}>
                  <TouchableOpacity
                    style={styles.infoCircleBtn}
                    onPress={() => setSelectedGuideExercise(item)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="information-variant" size={18} color={colors.textMuted} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.playCircleBtn}
                    onPress={() => {
                      onStartRoutine({
                        id: `single-${item.id}`,
                        userId: 'default',
                        title: `${item.name} Focus`,
                        description: 'Single exercise session',
                        category: item.category,
                        exerciseIds: [item.id],
                      });
                    }}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="play" size={18} color={colors.accentContrastText} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      )}

      {/* Guide Modal */}
      <ExerciseGuideModal
        exercise={selectedGuideExercise}
        visible={!!selectedGuideExercise}
        onClose={() => setSelectedGuideExercise(null)}
        onStartExercise={(ex) => {
          onStartRoutine({
            id: `single-${ex.id}`,
            userId: 'default',
            title: `${ex.name} Focus`,
            description: 'Single exercise session',
            category: ex.category,
            exerciseIds: [ex.id],
          });
        }}
      />

      {/* Routine Builder Modal */}
      <Modal
        visible={isBuilderOpen}
        animationType="slide"
        transparent={false}
        presentationStyle="fullScreen"
        onRequestClose={() => setIsBuilderOpen(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={[styles.builderModalHeader, { paddingTop: topInset + 10 }]}>
            <View>
              <View style={styles.builderHeaderBadge}>
                <MaterialCommunityIcons name="lightning-bolt" size={11} color={colors.accent} />
                <Text style={styles.builderHeaderBadgeText}>
                  {routineToEdit ? 'ROUTINE EDITOR' : 'ROUTINE ARCHITECT'}
                </Text>
              </View>
              <Text style={styles.builderModalTitle}>
                {routineToEdit ? 'Edit Routine' : 'Create New Routine'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.builderCloseBtn}
              onPress={() => {
                setIsBuilderOpen(false);
                setRoutineToEdit(null);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={builderScrollRef}
            style={[styles.builderContent, { marginBottom: keyboardHeight }]}
            contentContainerStyle={{ gap: 14, paddingBottom: keyboardHeight > 0 ? 36 : 28 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Routine Meta Info Card */}
            <View style={styles.builderCard}>
              <View style={styles.builderField}>
                <View style={styles.builderFieldLabelRow}>
                  <MaterialCommunityIcons name="format-title" size={13} color={colors.accent} />
                  <Text style={styles.inputLabel}>ROUTINE TITLE</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Upper Body Hypertrophy"
                  placeholderTextColor={colors.textDim}
                  value={newTitle}
                  onChangeText={setNewTitle}
                  onFocus={() => {
                    setTimeout(() => {
                      builderScrollRef.current?.scrollTo({ y: 0, animated: true });
                    }, 100);
                  }}
                />
              </View>

              <View style={styles.builderField}>
                <View style={styles.builderFieldLabelRow}>
                  <MaterialCommunityIcons name="text-short" size={13} color={colors.accent} />
                  <Text style={styles.inputLabel}>DESCRIPTION</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Chest, back, and arms focus"
                  placeholderTextColor={colors.textDim}
                  value={newDesc}
                  onChangeText={setNewDesc}
                  onFocus={() => {
                    setTimeout(() => {
                      builderScrollRef.current?.scrollTo({ y: 60, animated: true });
                    }, 100);
                  }}
                />
              </View>

              <View style={styles.builderField}>
                <View style={styles.builderFieldLabelRow}>
                  <MaterialCommunityIcons name="tag-outline" size={13} color={colors.accent} />
                  <Text style={styles.inputLabel}>CATEGORY</Text>
                </View>
                <View style={styles.categoryPickerRow}>
                  {['Push', 'Pull', 'Legs', 'Full Body', 'Indoor'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryChoice, newCategory === cat && styles.categoryChoiceActive]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setNewCategory(cat);
                      }}
                    >
                      <Text
                        style={[
                          styles.categoryChoiceText,
                          newCategory === cat && styles.categoryChoiceTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.builderField}>
                <View style={styles.builderFieldLabelRow}>
                  <MaterialCommunityIcons name="folder-outline" size={13} color={colors.accent} />
                  <Text style={styles.inputLabel}>ASSIGN TO FOLDER</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
                >
                  {folders.map((f) => {
                    const isSelected = builderFolder === f.name;
                    return (
                      <TouchableOpacity
                        key={f.id || f.name}
                        style={[
                          styles.folderChoiceChip,
                          isSelected && { backgroundColor: f.color, borderColor: f.color },
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setBuilderFolder(f.name);
                        }}
                      >
                        <MaterialCommunityIcons
                          name="folder"
                          size={13}
                          color={isSelected ? '#FFFFFF' : f.color}
                        />
                        <Text
                          style={[
                            styles.folderChoiceText,
                            isSelected && styles.folderChoiceTextActive,
                          ]}
                        >
                          {f.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            {/* Exercises Header */}
            <View style={styles.builderSectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="dumbbell" size={14} color={colors.accent} />
                <Text style={styles.inputLabel}>EXERCISES ({builderExercises.length})</Text>
              </View>
              <TouchableOpacity
                style={styles.addExBtn}
                onPress={() => setIsPickerOpen(true)}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons name="plus-circle" size={15} color={colors.accent} />
                <Text style={styles.addExBtnText}>ADD EXERCISES</Text>
              </TouchableOpacity>
            </View>

            {/* Exercise List or Empty State */}
            {builderExercises.length === 0 ? (
              <View style={styles.builderEmptyCard}>
                <View style={styles.builderEmptyIconCircle}>
                  <MaterialCommunityIcons name="dumbbell" size={26} color={colors.accent} />
                </View>
                <Text style={styles.builderEmptyTitle}>NO EXERCISES ADDED</Text>
                <Text style={styles.builderEmptySub}>
                  Tap "+ ADD EXERCISES" to add exercises and customize your sets, target reps, and starting weights.
                </Text>
              </View>
            ) : (
              builderExercises.map((config, index) => {
                const ex = EXERCISE_DATABASE.find((e) => e.id === config.exerciseId);
                const currentUnit = config.weightUnit || activeUser?.weightUnit || 'kg';
                return (
                  <View key={`${config.exerciseId}-${index}`} style={styles.builderExCard}>
                    {/* Header: Number, Name, Tag, Reorder Up/Down, Delete */}
                    <View style={styles.builderExHeader}>
                      <View style={styles.builderExTitleCol}>
                        <View style={styles.builderExNameRow}>
                          <View style={styles.builderExIndexBadge}>
                            <Text style={styles.builderExIndexText}>
                              {String(index + 1).padStart(2, '0')}
                            </Text>
                          </View>
                          <Text style={styles.builderExName} numberOfLines={1}>
                            {config.exerciseName || ex?.name || 'Exercise'}
                          </Text>
                        </View>
                        {ex?.category && (
                          <View style={styles.builderCategoryBadge}>
                            <Text style={styles.builderCategoryBadgeText}>
                              {ex.category.toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Snap Reordering & Delete Controls */}
                      <View style={styles.builderExActions}>
                        <TouchableOpacity
                          style={[
                            styles.builderReorderBtn,
                            index === 0 && styles.builderBtnDisabled,
                          ]}
                          onPress={() => handleMoveBuilderExercise(index, 'up')}
                          disabled={index === 0}
                          hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                          activeOpacity={0.7}
                        >
                          <MaterialCommunityIcons
                            name="chevron-up"
                            size={18}
                            color={index === 0 ? colors.textDim : colors.textPrimary}
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.builderReorderBtn,
                            index === builderExercises.length - 1 && styles.builderBtnDisabled,
                          ]}
                          onPress={() => handleMoveBuilderExercise(index, 'down')}
                          disabled={index === builderExercises.length - 1}
                          hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                          activeOpacity={0.7}
                        >
                          <MaterialCommunityIcons
                            name="chevron-down"
                            size={18}
                            color={index === builderExercises.length - 1 ? colors.textDim : colors.textPrimary}
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.builderDeleteBtn}
                          onPress={() => handleRemoveBuilderExercise(index)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          activeOpacity={0.7}
                        >
                          <MaterialCommunityIcons
                            name="trash-can-outline"
                            size={16}
                            color={colors.danger}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Exercise Config Controls: Sets, Reps, Weight + Unit */}
                    <View style={styles.builderConfigGrid}>
                      {/* Sets Stepper */}
                      <View style={styles.builderConfigBox}>
                        <Text style={styles.builderConfigLabel}>SETS</Text>
                        <View style={styles.builderStepper}>
                          <TouchableOpacity
                            style={styles.builderStepBtn}
                            onPress={() => handleUpdateBuilderExerciseSets(index, -1)}
                            activeOpacity={0.7}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <MaterialCommunityIcons name="minus" size={13} color={colors.textPrimary} />
                          </TouchableOpacity>
                          <Text style={styles.builderStepVal}>{config.targetSets || 3}</Text>
                          <TouchableOpacity
                            style={styles.builderStepBtn}
                            onPress={() => handleUpdateBuilderExerciseSets(index, 1)}
                            activeOpacity={0.7}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <MaterialCommunityIcons name="plus" size={13} color={colors.textPrimary} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Reps Stepper */}
                      <View style={styles.builderConfigBox}>
                        <Text style={styles.builderConfigLabel}>TARGET REPS</Text>
                        <View style={styles.builderStepper}>
                          <TouchableOpacity
                            style={styles.builderStepBtn}
                            onPress={() => handleUpdateBuilderExerciseReps(index, -1)}
                            activeOpacity={0.7}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <MaterialCommunityIcons name="minus" size={13} color={colors.textPrimary} />
                          </TouchableOpacity>
                          <Text style={styles.builderStepVal}>{config.targetReps || 10}</Text>
                          <TouchableOpacity
                            style={styles.builderStepBtn}
                            onPress={() => handleUpdateBuilderExerciseReps(index, 1)}
                            activeOpacity={0.7}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <MaterialCommunityIcons name="plus" size={13} color={colors.textPrimary} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Weight & Unit Toggle */}
                      <View style={styles.builderConfigBox}>
                        <View style={styles.builderWeightLabelRow}>
                          <Text style={styles.builderConfigLabel}>WEIGHT</Text>
                          <TouchableOpacity
                            style={styles.builderUnitTogglePill}
                            onPress={() => handleToggleBuilderExerciseUnit(index)}
                            activeOpacity={0.75}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Text style={styles.builderUnitToggleText}>{currentUnit.toUpperCase()}</Text>
                            <MaterialCommunityIcons name="swap-horizontal" size={10} color={colors.accent} />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.builderWeightInputWrap}>
                          <TextInput
                            style={styles.builderWeightInput}
                            keyboardType="decimal-pad"
                            placeholder="0"
                            placeholderTextColor={colors.textDim}
                            value={
                              builderWeightTexts[index] !== undefined
                                ? builderWeightTexts[index]
                                : (config.defaultWeight > 0 ? String(config.defaultWeight) : '')
                            }
                            onChangeText={(txt) => {
                              const clean = txt.replace(/[^0-9.]/g, '');
                              const parts = clean.split('.');
                              const sanitized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : clean;
                              setBuilderWeightTexts((prev) => ({ ...prev, [index]: sanitized }));
                              const num = parseFloat(sanitized);
                              handleUpdateBuilderExerciseWeight(index, isNaN(num) ? 0 : num);
                            }}
                            onBlur={() => {
                              setBuilderWeightTexts((prev) => {
                                const next = { ...prev };
                                delete next[index];
                                return next;
                              });
                            }}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })
            )}

            <TouchableOpacity
              style={styles.saveRoutineBtn}
              onPress={handleSaveCustomRoutine}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="check-bold"
                size={16}
                color={colors.accentContrastText}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.saveRoutineBtnText}>
                {routineToEdit ? 'SAVE CHANGES' : 'CREATE ROUTINE'}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <ExercisePickerModal
            visible={isPickerOpen}
            onClose={() => setIsPickerOpen(false)}
            onSelect={(ex) => {
              if (!selectedExIds.includes(ex.id)) {
                setSelectedExIds((prev) => [...prev, ex.id]);
                const prescription = PPL_PRESCRIPTIONS[ex.id];
                const newConfig: RoutineExerciseConfig = {
                  exerciseId: ex.id,
                  exerciseName: ex.name,
                  targetSets: prescription?.sets || 3,
                  targetReps: prescription?.targetReps || 10,
                  defaultWeight: prescription?.defaultWeightKg || 0,
                  weightUnit: (activeUser?.weightUnit || 'kg'),
                };
                setBuilderExercises((prev) => [...prev, newConfig]);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            selectedIds={selectedExIds}
          />
        </SafeAreaView>
      </Modal>

      {/* Move Routine to Folder Modal */}
      <Modal
        visible={!!routineToMove}
        transparent
        animationType="fade"
        onRequestClose={() => setRoutineToMove(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.folderSelectModal}>
            <View style={styles.folderSelectHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.folderSelectTitle}>Move to Folder</Text>
                <Text style={styles.folderSelectSub} numberOfLines={1}>
                  {routineToMove?.title}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setRoutineToMove(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 280, marginVertical: 8 }}>
              {folders.map((f) => {
                const isCurrent = (routineToMove?.folder || 'General') === f.name;
                return (
                  <TouchableOpacity
                    key={f.id || f.name}
                    style={[
                      styles.folderOptionItem,
                      isCurrent && { borderColor: f.color },
                    ]}
                    onPress={async () => {
                      if (routineToMove) {
                        await updateRoutineFolder(routineToMove.id, f.name);
                        setRoutineToMove(null);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <MaterialCommunityIcons
                        name={isCurrent ? 'folder-check' : 'folder'}
                        size={18}
                        color={f.color}
                      />
                      <Text
                        style={[
                          styles.folderOptionText,
                          isCurrent && { color: f.color, fontWeight: '800' },
                        ]}
                      >
                        {f.name}
                      </Text>
                    </View>
                    {isCurrent && (
                      <MaterialCommunityIcons name="check" size={18} color={f.color} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalAddFolderBtn}
              onPress={() => {
                setNewFolderName('');
                setNewFolderColor(FOLDER_COLOR_PALETTE[0]);
                setIsCreateFolderModalOpen(true);
              }}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons name="folder-plus-outline" size={16} color={colors.accent} />
              <Text style={styles.modalAddFolderBtnText}>Create New Folder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create New Folder Modal */}
      <Modal
        visible={isCreateFolderModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCreateFolderModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.folderSelectModal}>
            <Text style={styles.folderSelectTitle}>Create Routine Folder</Text>
            <Text style={styles.folderSelectSub}>
              Enter a name and pick a color for your workout templates.
            </Text>
            <TextInput
              style={[styles.input, { marginTop: 14 }]}
              placeholder="e.g. Travel, Hypertrophy, Upper/Lower"
              placeholderTextColor={colors.textDim}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
            />

            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textMuted, marginTop: 14, marginBottom: 8, letterSpacing: 0.5 }}>
              CHOOSE FOLDER COLOR
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {FOLDER_COLOR_PALETTE.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorCircleOption,
                    { backgroundColor: c, width: 34, height: 34, borderRadius: 17 },
                    newFolderColor === c && styles.colorCircleActive,
                  ]}
                  onPress={() => setNewFolderColor(c)}
                  activeOpacity={0.8}
                >
                  {newFolderColor === c && <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsCreateFolderModalOpen(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  !newFolderName.trim() && { opacity: 0.5 },
                ]}
                disabled={!newFolderName.trim()}
                onPress={async () => {
                  const name = newFolderName.trim();
                  if (!name) return;
                  await createFolder(name, newFolderColor);
                  setIsCreateFolderModalOpen(false);
                  setSelectedFolder(name);
                  if (routineToMove) {
                    await updateRoutineFolder(routineToMove.id, name);
                    setRoutineToMove(null);
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmBtnText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Folder Color Modal */}
      <Modal
        visible={colorEditFolder !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setColorEditFolder(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.folderSelectModal}>
            <View style={styles.folderSelectHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.folderSelectTitle}>Folder Color</Text>
                <Text style={styles.folderSelectSub}>
                  Change signature color for "{colorEditFolder?.name}"
                </Text>
              </View>
              <TouchableOpacity onPress={() => setColorEditFolder(null)}>
                <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginVertical: 14 }}>
              {FOLDER_COLOR_PALETTE.map((c) => {
                const isSelected = colorEditFolder?.color?.toLowerCase() === c.toLowerCase();
                return (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorCircleOption,
                      { backgroundColor: c, width: 40, height: 40, borderRadius: 20 },
                      isSelected && styles.colorCircleActive,
                    ]}
                    onPress={async () => {
                      if (!colorEditFolder) return;
                      await updateFolderColor(colorEditFolder.name, c);
                      setColorEditFolder({ ...colorEditFolder, color: c });
                    }}
                    activeOpacity={0.8}
                  >
                    {isSelected && <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={() => setColorEditFolder(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalConfirmBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      {confirmModal && (
        <WorkoutConfirmModal
          visible={confirmModal.visible}
          type={confirmModal.type}
          exerciseName={confirmModal.title}
          onClose={() => setConfirmModal(null)}
          onConfirm={handleConfirmDelete}
        />
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
    segmentContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceRaised,
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
      padding: 4,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      gap: 4,
    },
    segmentBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 12,
      gap: 6,
    },
    segmentBtnActive: {
      backgroundColor: colors.accent,
    },
    segmentText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 0.8,
    },
    segmentTextActive: {
      color: colors.accentContrastText,
    },
    content: {
      padding: 16,
      gap: 16,
      paddingBottom: 110,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    pageTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    pageSubtitle: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    newRoutineBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accent,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      gap: 4,
    },
    newRoutineBtnText: {
      fontSize: 11,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.5,
    },
    routineCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      gap: 12,
    },
    routineCardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 10,
    },
    titleBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      flexShrink: 1,
    },
    categoryBadge: {
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      flexShrink: 0,
      alignSelf: 'center',
    },
    categoryBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.accent,
      fontFamily: 'monospace',
    },
    cardDesc: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
    },
    deleteBtn: {
      padding: 4,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    exerciseChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      gap: 6,
    },
    exerciseChipName: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    exerciseChipReps: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.accent,
      fontFamily: 'monospace',
    },
    launchBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingVertical: 12,
      borderRadius: 14,
      gap: 6,
      marginTop: 4,
    },
    launchBtnText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 0.8,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginHorizontal: 16,
      marginTop: 4,
      marginBottom: 8,
      gap: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: colors.textPrimary,
    },
    chipScroll: {
      marginBottom: 8,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    chipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    chipText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
    },
    chipTextActive: {
      color: colors.accentContrastText,
      fontWeight: '800',
    },
    levelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 10,
      gap: 6,
    },
    levelLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textDim,
      fontFamily: 'monospace',
      letterSpacing: 0.8,
    },
    levelChip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    levelChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    levelText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textMuted,
      fontFamily: 'monospace',
    },
    levelTextActive: {
      color: colors.accentContrastText,
      fontWeight: '800',
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 110,
      gap: 10,
    },
    exerciseCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    exerciseCardLeft: {
      flex: 1,
      paddingRight: 10,
    },
    titleWithBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    exerciseCardName: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    loopBadge: {
      backgroundColor: colors.accentSubtle,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    loopBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.accent,
      fontFamily: 'monospace',
    },
    exerciseMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },
    exerciseMetaText: {
      fontSize: 11,
      color: colors.textMuted,
    },
    exerciseMetaDot: {
      fontSize: 10,
      color: colors.textDim,
    },
    diffPill: {
      backgroundColor: colors.warningBg,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    diffPillText: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.warning,
      fontFamily: 'monospace',
    },
    exerciseCardRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    infoCircleBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playCircleBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalSafeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    // Routine Architect / Builder Modal Styles
    builderModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceBorder,
      backgroundColor: colors.background,
    },
    builderHeaderBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 2,
    },
    builderHeaderBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.accent,
      fontFamily: 'monospace',
      letterSpacing: 0.8,
    },
    builderModalTitle: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.textPrimary,
      letterSpacing: 0.3,
    },
    builderCloseBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    builderContent: {
      padding: 16,
    },
    builderCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      padding: 16,
      gap: 14,
    },
    builderField: {
      gap: 6,
    },
    builderFieldLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    inputLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textMuted,
      fontFamily: 'monospace',
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 13,
      color: colors.textPrimary,
    },
    categoryPickerRow: {
      flexDirection: 'row',
      gap: 8,
    },
    categoryChoice: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      alignItems: 'center',
    },
    categoryChoiceActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    categoryChoiceText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
    },
    categoryChoiceTextActive: {
      color: colors.accentContrastText,
      fontWeight: '800',
    },
    folderChoiceChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 10,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    folderChoiceText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
    },
    folderChoiceTextActive: {
      color: '#FFFFFF',
      fontWeight: '800',
    },
    builderSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
      marginBottom: 2,
    },
    addExBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceRaised,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      gap: 5,
    },
    addExBtnText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accent,
      letterSpacing: 0.5,
    },
    builderEmptyCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      borderStyle: 'dashed',
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    builderEmptyIconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.accentSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    builderEmptyTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: 'monospace',
      letterSpacing: 0.8,
      marginBottom: 6,
    },
    builderEmptySub: {
      fontSize: 11,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 16,
      maxWidth: 260,
    },
    builderExCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      padding: 14,
      marginBottom: 10,
    },
    builderExHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceBorder,
      marginBottom: 10,
    },
    builderExTitleCol: {
      flex: 1,
      marginRight: 10,
    },
    builderExNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    builderExIndexBadge: {
      backgroundColor: colors.surfaceRaised,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    builderExIndexText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.accent,
      fontFamily: 'monospace',
    },
    builderExName: {
      flex: 1,
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    builderCategoryBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surfaceRaised,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginTop: 4,
      marginLeft: 28,
    },
    builderCategoryBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.textDim,
      fontFamily: 'monospace',
      letterSpacing: 0.5,
    },
    builderExActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    builderReorderBtn: {
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    builderDeleteBtn: {
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.25)',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 4,
    },
    builderBtnDisabled: {
      opacity: 0.3,
    },
    builderConfigGrid: {
      flexDirection: 'row',
      gap: 8,
    },
    builderConfigBox: {
      flex: 1,
      backgroundColor: colors.surfaceRaised,
      borderRadius: 10,
      padding: 8,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    builderConfigLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.textDim,
      fontFamily: 'monospace',
      letterSpacing: 0.5,
      marginBottom: 6,
      textAlign: 'center',
    },
    builderWeightLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    builderStepper: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingHorizontal: 4,
      paddingVertical: 3,
    },
    builderStepBtn: {
      width: 22,
      height: 22,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceRaised,
    },
    builderStepVal: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: 'monospace',
      textAlign: 'center',
    },
    builderUnitTogglePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: colors.surface,
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    builderUnitToggleText: {
      fontSize: 8,
      fontWeight: '900',
      color: colors.accent,
      fontFamily: 'monospace',
    },
    builderWeightInputWrap: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingHorizontal: 8,
      height: 28,
      justifyContent: 'center',
    },
    builderWeightInput: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: 'monospace',
      textAlign: 'center',
      padding: 0,
    },
    saveRoutineBtn: {
      flexDirection: 'row',
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    saveRoutineBtnText: {
      fontSize: 13,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.8,
    },
    // Folder Section Styles
    folderSection: {
      marginTop: 4,
      marginBottom: 4,
    },
    folderSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    folderSectionTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textMuted,
      fontFamily: 'monospace',
      letterSpacing: 0.8,
    },
    addFolderHeaderBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 2,
      paddingHorizontal: 6,
    },
    addFolderHeaderBtnText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accent,
      letterSpacing: 0.5,
    },
    folderChipsScroll: {
      flexDirection: 'row',
      gap: 8,
      paddingBottom: 4,
    },
    folderChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      gap: 6,
    },
    folderChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    folderChipText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
    },
    folderChipTextActive: {
      color: colors.accentContrastText,
      fontWeight: '800',
    },
    folderBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingHorizontal: 8,
      paddingVertical: 2.5,
      borderRadius: 6,
      gap: 4,
    },
    folderBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.accent,
      fontFamily: 'monospace',
    },
    actionIconBtn: {
      padding: 6,
      borderRadius: 8,
      backgroundColor: colors.surfaceRaised,
    },
    emptyFolderCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 28,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      marginTop: 8,
    },
    emptyFolderTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: 12,
    },
    emptyFolderSub: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 4,
      marginBottom: 14,
    },
    emptyFolderBtn: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.accent,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    emptyFolderBtnText: {
      fontSize: 11,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.5,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    folderSelectModal: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    folderSelectHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    folderSelectTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    folderSelectSub: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    folderOptionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      marginBottom: 8,
    },
    folderOptionItemActive: {
      borderColor: colors.accent,
      backgroundColor: colors.surfaceRaised,
    },
    folderOptionText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    folderOptionTextActive: {
      color: colors.accent,
      fontWeight: '800',
    },
    modalAddFolderBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      marginTop: 8,
      borderStyle: 'dashed',
    },
    modalAddFolderBtnText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.accent,
    },
    modalButtonsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 18,
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
    colorCircleOption: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    colorCircleActive: {
      borderWidth: 2.5,
      borderColor: '#FFFFFF',
      elevation: 4,
    },
  });
