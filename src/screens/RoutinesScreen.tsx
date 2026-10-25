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
  Animated,
  TouchableWithoutFeedback,
  Image,
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
import { ExerciseSetConfigModal } from '../components/ExerciseSetConfigModal';
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
    renameFolder,
    deleteFolder,
    setFolderRoutines,
    seedDefaultRoutines,
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
  const [isManageFoldersModalOpen, setIsManageFoldersModalOpen] = useState(false);

  // Dedicated Folder Management Modals State
  const [manageFolderRoutinesTarget, setManageFolderRoutinesTarget] = useState<RoutineFolder | null>(null);
  const [folderAssignedRoutineIds, setFolderAssignedRoutineIds] = useState<string[]>([]);
  const [folderRoutineSearch, setFolderRoutineSearch] = useState('');
  const [renameFolderTarget, setRenameFolderTarget] = useState<RoutineFolder | null>(null);
  const [renameFolderInput, setRenameFolderInput] = useState('');
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<RoutineFolder | null>(null);

  // Routines Discovery, Search & UX State
  const [routineSearch, setRoutineSearch] = useState('');
  const [selectedSplit, setSelectedSplit] = useState<string>('All');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [routineSort, setRoutineSort] = useState<'recent' | 'name_asc' | 'exercises_desc'>('recent');
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');
  const [menuRoutine, setMenuRoutine] = useState<RoutineTemplate | null>(null);
  const [expandedRoutineIds, setExpandedRoutineIds] = useState<Record<string, boolean>>({});

  // Speed Dial FAB State & Animations
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
  const speedDialAnim = useRef(new Animated.Value(0)).current;

  const toggleSpeedDial = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const toValue = isSpeedDialOpen ? 0 : 1;
    setIsSpeedDialOpen(!isSpeedDialOpen);
    Animated.spring(speedDialAnim, {
      toValue,
      friction: 7,
      tension: 65,
      useNativeDriver: true,
    }).start();
  };

  const closeSpeedDial = () => {
    if (!isSpeedDialOpen) return;
    setIsSpeedDialOpen(false);
    Animated.timing(speedDialAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  };

  const fabRotation = speedDialAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });
  const backdropOpacity = speedDialAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.45],
  });
  const item1TranslateY = speedDialAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });
  const item1Scale = speedDialAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });
  const item1Opacity = speedDialAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.5, 1],
  });
  const item2TranslateY = speedDialAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });
  const item2Scale = speedDialAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });
  const item2Opacity = speedDialAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.5, 1],
  });
  const mainLabelScale = speedDialAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });
  const mainLabelOpacity = speedDialAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.6, 1],
  });

  const exerciseNameMap = useMemo(() => {
    const map = new Map<string, string>();
    EXERCISE_DATABASE.forEach((e) => map.set(e.id, e.name.toLowerCase()));
    return map;
  }, []);

  const SPLIT_TABS = ['All', 'Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Core', 'Cardio'];

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
  const [expandedPerSetIndex, setExpandedPerSetIndex] = useState<number | null>(null);
  const [configuringExerciseIndex, setConfiguringExerciseIndex] = useState<number | null>(null);
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

  const favoritesCount = useMemo(() => {
    return routines.filter((r) => !!r.isFavorite).length;
  }, [routines]);

  // Compute folder counts
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = { All: routines.length };
    folders.forEach((f) => {
      counts[f.name] = 0;
    });
    routines.forEach((r) => {
      if (r.folder && counts[r.folder] !== undefined) {
        counts[r.folder] = (counts[r.folder] || 0) + 1;
      }
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

  // Routines filtered by search, folder, split, favorites, and sorted
  const displayedRoutines = useMemo(() => {
    let list = [...routines];

    // 1. Folder filter
    if (selectedFolder !== 'All') {
      list = list.filter((r) => (r.folder || '') === selectedFolder);
    }

    // 2. Split / Category filter
    if (selectedSplit !== 'All') {
      list = list.filter((r) => r.category.toLowerCase() === selectedSplit.toLowerCase());
    }

    // 3. Favorites only filter
    if (favoritesOnly) {
      list = list.filter((r) => !!r.isFavorite);
    }

    // 4. Search query (searches title, description, category, folder, and exercise names inside routine)
    if (routineSearch.trim()) {
      const q = routineSearch.toLowerCase().trim();
      list = list.filter((r) => {
        if (r.title.toLowerCase().includes(q)) return true;
        if (r.description && r.description.toLowerCase().includes(q)) return true;
        if (r.category && r.category.toLowerCase().includes(q)) return true;
        if (r.folder && r.folder.toLowerCase().includes(q)) return true;
        const hasMatchingExercise = (r.exerciseIds || []).some((exId) => {
          const exName = exerciseNameMap.get(exId);
          return exName && exName.includes(q);
        });
        if (hasMatchingExercise) return true;
        return false;
      });
    }

    // 5. Sort: Pinned/Favorites always first, then by selected sort
    list.sort((a, b) => {
      const aFav = a.isFavorite ? 1 : 0;
      const bFav = b.isFavorite ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;

      if (routineSort === 'name_asc') {
        return a.title.localeCompare(b.title);
      }
      if (routineSort === 'exercises_desc') {
        return (b.exerciseIds?.length || 0) - (a.exerciseIds?.length || 0);
      }
      return 0;
    });

    return list;
  }, [routines, selectedFolder, selectedSplit, favoritesOnly, routineSearch, routineSort, exerciseNameMap]);

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

  const handleToggleFavorite = async (routine: RoutineTemplate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateRoutine({
      ...routine,
      isFavorite: !routine.isFavorite,
    });
  };

  const handleDuplicateRoutine = async (routine: RoutineTemplate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newTitle = `${routine.title} (Copy)`;
    await createRoutine(
      newTitle,
      routine.description || '',
      routine.category,
      [...routine.exerciseIds],
      routine.folder || 'General',
      routine.routineExercises
        ? JSON.parse(JSON.stringify(routine.routineExercises))
        : undefined
    );
  };

  const toggleExpandRoutine = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedRoutineIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
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
        next[index] = { ...next[index], targetReps: newReps, repRange: undefined };
      }
      return next;
    });
  };

  const handleUpdateBuilderExerciseRepRange = (index: number, range: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBuilderExercises((prev) => {
      const next = [...prev];
      if (next[index]) {
        const leadingNum = parseInt(range.split(/[^0-9]/)[0], 10);
        next[index] = {
          ...next[index],
          repRange: range,
          targetReps: !isNaN(leadingNum) && leadingNum > 0 ? leadingNum : next[index].targetReps,
        };
      }
      return next;
    });
  };

  const handleUpdateSetTargetReps = (exIndex: number, setNum: number, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBuilderExercises((prev) => {
      const next = [...prev];
      const ex = next[exIndex];
      if (!ex) return prev;
      const targetSets = ex.targetSets || 3;
      const currentTargets =
        ex.setTargets && ex.setTargets.length > 0
          ? [...ex.setTargets]
          : Array.from({ length: targetSets }, (_, i) => ({
              setNumber: i + 1,
              reps: ex.targetReps || 10,
              repRange: ex.repRange,
              weight: ex.defaultWeight || 0,
            }));

      const setIdx = currentTargets.findIndex((st) => st.setNumber === setNum);
      if (setIdx !== -1) {
        const currentReps = currentTargets[setIdx].reps || ex.targetReps || 10;
        const newReps = Math.max(1, Math.min(100, currentReps + delta));
        currentTargets[setIdx] = {
          ...currentTargets[setIdx],
          reps: newReps,
          repRange: undefined,
        };
      } else {
        currentTargets.push({
          setNumber: setNum,
          reps: Math.max(1, (ex.targetReps || 10) + delta),
          repRange: undefined,
          weight: ex.defaultWeight || 0,
        });
      }
      next[exIndex] = { ...ex, setTargets: currentTargets };
      return next;
    });
  };

  const handleUpdateSetTargetRepRange = (exIndex: number, setNum: number, range: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBuilderExercises((prev) => {
      const next = [...prev];
      const ex = next[exIndex];
      if (!ex) return prev;
      const targetSets = ex.targetSets || 3;
      const currentTargets =
        ex.setTargets && ex.setTargets.length > 0
          ? [...ex.setTargets]
          : Array.from({ length: targetSets }, (_, i) => ({
              setNumber: i + 1,
              reps: ex.targetReps || 10,
              repRange: ex.repRange,
              weight: ex.defaultWeight || 0,
            }));

      const setIdx = currentTargets.findIndex((st) => st.setNumber === setNum);
      const leadingNum = parseInt(range.split(/[^0-9]/)[0], 10);
      const parsedReps = !isNaN(leadingNum) && leadingNum > 0 ? leadingNum : (ex.targetReps || 10);
      if (setIdx !== -1) {
        currentTargets[setIdx] = {
          ...currentTargets[setIdx],
          repRange: range,
          reps: parsedReps,
        };
      } else {
        currentTargets.push({
          setNumber: setNum,
          reps: parsedReps,
          repRange: range,
          weight: ex.defaultWeight || 0,
        });
      }
      next[exIndex] = { ...ex, setTargets: currentTargets };
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

  const handleSaveExerciseConfig = (updated: RoutineExerciseConfig) => {
    if (configuringExerciseIndex === null) return;
    setBuilderExercises((prev) => {
      const next = [...prev];
      next[configuringExerciseIndex] = updated;
      return next;
    });
    setConfiguringExerciseIndex(null);
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

  const handleOpenManageFolderRoutines = (folder: RoutineFolder) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setManageFolderRoutinesTarget(folder);
    const existing = routines.filter((r) => r.folder === folder.name).map((r) => r.id);
    setFolderAssignedRoutineIds(existing);
    setFolderRoutineSearch('');
  };

  const handleToggleRoutineAssignment = (routineId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFolderAssignedRoutineIds((prev) =>
      prev.includes(routineId) ? prev.filter((id) => id !== routineId) : [...prev, routineId]
    );
  };

  const handleSaveManageFolderRoutines = async () => {
    if (!manageFolderRoutinesTarget) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setFolderRoutines(manageFolderRoutinesTarget.name, folderAssignedRoutineIds);
    setManageFolderRoutinesTarget(null);
  };

  const handleOpenDeleteFolder = (folder: RoutineFolder) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDeleteFolderTarget(folder);
  };

  const handleConfirmDeleteFolder = async (deleteContents: boolean) => {
    if (!deleteFolderTarget) return;
    Haptics.notificationAsync(
      deleteContents
        ? Haptics.NotificationFeedbackType.Warning
        : Haptics.NotificationFeedbackType.Success
    );
    const targetName = deleteFolderTarget.name;
    await deleteFolder(targetName, deleteContents);
    if (selectedFolder === targetName) {
      setSelectedFolder('All');
    }
    setDeleteFolderTarget(null);
  };

  const handleOpenRenameFolder = (folder: RoutineFolder) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRenameFolderTarget(folder);
    setRenameFolderInput(folder.name);
  };

  const handleConfirmRenameFolder = async () => {
    if (!renameFolderTarget || !renameFolderInput.trim()) return;
    const trimmed = renameFolderInput.trim();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const oldName = renameFolderTarget.name;
    await renameFolder(oldName, trimmed);
    if (selectedFolder === oldName) {
      setSelectedFolder(trimmed);
    }
    setRenameFolderTarget(null);
    setRenameFolderInput('');
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
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header Row: Title, Routine Count, Sort & View Mode Switches */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.pageTitle}>Workout Routines</Text>
              <Text style={styles.pageSubtitle}>
                {displayedRoutines.length} of {routines.length} routines
              </Text>
            </View>

            <View style={styles.headerControls}>
              {/* Sort Cycle Button */}
              <TouchableOpacity
                style={[styles.headerControlBtn, routineSort !== 'recent' && styles.headerControlBtnActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setRoutineSort((prev) =>
                    prev === 'recent' ? 'name_asc' : prev === 'name_asc' ? 'exercises_desc' : 'recent'
                  );
                }}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons
                  name={
                    routineSort === 'name_asc'
                      ? 'sort-alphabetical-ascending'
                      : routineSort === 'exercises_desc'
                      ? 'sort-numeric-descending'
                      : 'sort'
                  }
                  size={18}
                  color={routineSort !== 'recent' ? colors.accent : colors.textMuted}
                />
              </TouchableOpacity>

              {/* View Mode Toggle: Cards vs Compact List */}
              <View style={styles.viewToggleGroup}>
                <TouchableOpacity
                  style={[styles.viewToggleBtn, viewMode === 'cards' && styles.viewToggleBtnActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setViewMode('cards');
                  }}
                  activeOpacity={0.75}
                >
                  <MaterialCommunityIcons
                    name="view-agenda-outline"
                    size={16}
                    color={viewMode === 'cards' ? colors.accentContrastText : colors.textMuted}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.viewToggleBtn, viewMode === 'compact' && styles.viewToggleBtnActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setViewMode('compact');
                  }}
                  activeOpacity={0.75}
                >
                  <MaterialCommunityIcons
                    name="view-sequential-outline"
                    size={16}
                    color={viewMode === 'compact' ? colors.accentContrastText : colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Instant Routine Search Bar */}
          <View style={styles.routineSearchBar}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.textDim} />
            <TextInput
              style={styles.routineSearchInput}
              placeholder="Search by routine, split, or exercise..."
              placeholderTextColor={colors.textDim}
              value={routineSearch}
              onChangeText={setRoutineSearch}
              returnKeyType="search"
            />
            {routineSearch.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setRoutineSearch('');
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="close-circle" size={18} color={colors.textDim} />
              </TouchableOpacity>
            )}
          </View>

          {/* Split & Favorites Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.splitChipsScroll}
          >
            {/* Pinned / Favorites Filter */}
            <TouchableOpacity
              style={[styles.favoriteFilterChip, favoritesOnly && styles.favoriteFilterChipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFavoritesOnly(!favoritesOnly);
              }}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons
                name={favoritesOnly ? 'star' : 'star-outline'}
                size={14}
                color={favoritesOnly ? '#FFD700' : colors.textMuted}
              />
              <Text style={[styles.splitChipText, favoritesOnly && { color: '#FFD700', fontWeight: '800' }]}>
                Pinned ({favoritesCount})
              </Text>
            </TouchableOpacity>

            {SPLIT_TABS.map((split) => {
              const isActive = selectedSplit === split;
              return (
                <TouchableOpacity
                  key={split}
                  style={[styles.splitChip, isActive && styles.splitChipActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedSplit(split);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.splitChipText, isActive && styles.splitChipTextActive]}>
                    {split}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Folder Filter Bar */}
          <View style={styles.folderSection}>
            <View style={styles.folderSectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="folder-multiple-outline" size={15} color={colors.accent} />
                <Text style={styles.folderSectionTitle}>FOLDERS</Text>
              </View>
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
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedFolder('All');
                }}
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
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedFolder(f.name);
                    }}
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
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Main Routines List Content */}
          {displayedRoutines.length === 0 ? (
            <View style={styles.emptyFolderCard}>
              <View style={styles.emptyFolderIconCircle}>
                <MaterialCommunityIcons
                  name={routineSearch ? 'magnify-close' : 'folder-open-outline'}
                  size={36}
                  color={colors.accent}
                />
              </View>
              <Text style={styles.emptyFolderTitle}>
                {routineSearch ? 'No matching routines' : 'No routines in this section'}
              </Text>
              <Text style={styles.emptyFolderSub}>
                {routineSearch
                  ? `No routines found matching "${routineSearch}". Try another keyword or clear search.`
                  : selectedFolder !== 'All'
                  ? `"${selectedFolder}" is currently empty. Create a new routine or assign existing ones here.`
                  : 'Start building your training arsenal by creating your first workout routine.'}
              </Text>
              <View style={styles.emptyFolderButtonsContainer}>
                {routineSearch ? (
                  <TouchableOpacity
                    style={styles.emptyFolderPrimaryBtn}
                    onPress={() => setRoutineSearch('')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.emptyFolderPrimaryBtnText}>CLEAR SEARCH</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.emptyFolderPrimaryBtn}
                      onPress={async () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        await seedDefaultRoutines();
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        Alert.alert(
                          'PPL Split Loaded',
                          'Push Pull Legs workout split has been loaded and synced to your Firebase account!'
                        );
                      }}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={require('../../assets/icon.png')}
                        style={{ width: 16, height: 16, borderRadius: 4, marginRight: 6 }}
                        resizeMode="cover"
                      />
                      <Text style={styles.emptyFolderPrimaryBtnText}>LOAD PPL SPLIT</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.emptyFolderSecondaryBtn}
                      onPress={() => {
                        setBuilderFolder(selectedFolder !== 'All' ? selectedFolder : 'General');
                        setIsBuilderOpen(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="plus" size={16} color={colors.textPrimary} />
                      <Text style={styles.emptyFolderSecondaryBtnText}>CREATE CUSTOM ROUTINE</Text>
                    </TouchableOpacity>

                    {selectedFolder !== 'All' && routines.length > 0 && (
                      <TouchableOpacity
                        style={styles.emptyFolderSecondaryBtn}
                        onPress={() => {
                          const f = folders.find((item) => item.name === selectedFolder);
                          if (f) handleOpenManageFolderRoutines(f);
                        }}
                        activeOpacity={0.75}
                      >
                        <MaterialCommunityIcons name="playlist-plus" size={16} color={colors.textPrimary} />
                        <Text style={styles.emptyFolderSecondaryBtnText}>ADD EXISTING ROUTINES</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            </View>
          ) : viewMode === 'compact' ? (
            /* COMPACT LIST VIEW */
            displayedRoutines.map((routine) => {
              const folderColor = folderColorMap[routine.folder || 'General'] || colors.accent;
              const isFav = !!routine.isFavorite;
              return (
                <TouchableOpacity
                  key={routine.id}
                  style={styles.compactRoutineCard}
                  onPress={() => onStartRoutine(routine)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.compactFolderStrip, { backgroundColor: folderColor }]} />

                  <TouchableOpacity
                    style={styles.compactLeftBtn}
                    onPress={() => handleToggleFavorite(routine)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons
                      name={isFav ? 'star' : 'star-outline'}
                      size={18}
                      color={isFav ? '#FFD700' : colors.textDim}
                    />
                  </TouchableOpacity>

                  <View style={styles.compactContent}>
                    <Text style={styles.compactTitle} numberOfLines={1}>
                      {routine.title}
                    </Text>
                    <View style={styles.compactMetaRow}>
                      <Text style={[styles.compactFolderBadge, { color: folderColor }]}>
                        {routine.folder || 'General'}
                      </Text>
                      <Text style={styles.compactMetaText}>•</Text>
                      <Text style={styles.compactMetaText}>{routine.category}</Text>
                      <Text style={styles.compactMetaText}>•</Text>
                      <Text style={styles.compactMetaText}>
                        {routine.exerciseIds.length} ex
                      </Text>
                    </View>
                  </View>

                  <View style={styles.compactActions}>
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => setMenuRoutine(routine)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialCommunityIcons name="dots-vertical" size={18} color={colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.compactPlayBtn}
                      onPress={() => onStartRoutine(routine)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name="play"
                        size={16}
                        color={colors.accentContrastText}
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            /* DETAILED CARD VIEW */
            displayedRoutines.map((routine) => {
              const isFav = !!routine.isFavorite;
              const isExpanded = !!expandedRoutineIds[routine.id];
              const exCount = routine.exerciseIds.length;
              const displayedExIds = isExpanded ? routine.exerciseIds : routine.exerciseIds.slice(0, 4);
              const remainingCount = exCount - 4;
              const fColor = folderColorMap[routine.folder || 'General'] || colors.accent;

              return (
                <View key={routine.id} style={styles.routineCard}>
                  <View style={styles.routineCardHeader}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={styles.titleBadgeRow}>
                        <TouchableOpacity
                          onPress={() => handleToggleFavorite(routine)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          style={{ marginRight: 2 }}
                        >
                          <MaterialCommunityIcons
                            name={isFav ? 'star' : 'star-outline'}
                            size={18}
                            color={isFav ? '#FFD700' : colors.textDim}
                          />
                        </TouchableOpacity>

                        <Text style={styles.cardTitle}>{routine.title}</Text>

                        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          <TouchableOpacity
                            style={[
                              styles.folderBadge,
                              { borderColor: fColor + '55' },
                            ]}
                            onPress={() => setRoutineToMove(routine)}
                            activeOpacity={0.75}
                          >
                            <MaterialCommunityIcons
                              name="folder"
                              size={11}
                              color={fColor}
                            />
                            <Text
                              style={[
                                styles.folderBadgeText,
                                { color: fColor },
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
                      {routine.description ? (
                        <Text style={styles.cardDesc} numberOfLines={2}>
                          {routine.description}
                        </Text>
                      ) : null}
                    </View>

                    {/* 3-Dots Action Sheet Menu Button */}
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => setMenuRoutine(routine)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Routine options"
                    >
                      <MaterialCommunityIcons name="dots-vertical" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  {/* Exercise Chips with Smart Inline Expansion */}
                  <View style={styles.chipsRow}>
                    {displayedExIds.map((exId) => {
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

                    {remainingCount > 0 && !isExpanded && (
                      <TouchableOpacity
                        style={[styles.exerciseChip, { borderColor: colors.accent + '66' }]}
                        onPress={() => toggleExpandRoutine(routine.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.exerciseChipName, { color: colors.accent }]}>
                          +{remainingCount} more
                        </Text>
                        <MaterialCommunityIcons name="chevron-down" size={12} color={colors.accent} />
                      </TouchableOpacity>
                    )}

                    {isExpanded && remainingCount > 0 && (
                      <TouchableOpacity
                        style={[styles.exerciseChip, { borderColor: colors.textDim }]}
                        onPress={() => toggleExpandRoutine(routine.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.exerciseChipName, { color: colors.textDim }]}>
                          Collapse
                        </Text>
                        <MaterialCommunityIcons name="chevron-up" size={12} color={colors.textDim} />
                      </TouchableOpacity>
                    )}
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
              );
            })
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
          <View style={styles.levelFilterContainer}>
            <View style={styles.levelLabelBadge}>
              <Text style={styles.levelLabel}>LEVEL</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.levelScrollView}
              contentContainerStyle={styles.levelScrollContent}
            >
              {DIFFICULTY_LEVELS.map((lvl) => {
                const isSelected = activeLevel === lvl;
                return (
                  <TouchableOpacity
                    key={lvl}
                    style={[styles.levelChip, isSelected && styles.levelChipActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActiveLevel(lvl);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.levelText, isSelected && styles.levelTextActive]}
                      numberOfLines={1}
                    >
                      {lvl === 'All Levels' ? lvl : `• ${lvl}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
                <Image
                  source={require('../../assets/icon.png')}
                  style={{ width: 14, height: 14, borderRadius: 3, marginRight: 6 }}
                  resizeMode="cover"
                />
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
            contentContainerStyle={{ gap: 14, paddingBottom: keyboardHeight > 0 ? 80 : 96 }}
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
                const hasCustomSets = config.setTargets && config.setTargets.length > 0;
                const repDisplay = config.repRange
                  ? `RANGE ${config.repRange}`
                  : `${config.targetReps || 10} REPS`;
                const weightDisplay = config.weightMode === 'individual'
                  ? 'CUSTOM WEIGHTS'
                  : `${config.defaultWeight || 0} ${currentUnit.toUpperCase()}`;

                return (
                  <TouchableOpacity
                    key={`${config.exerciseId}-${index}`}
                    style={styles.builderExCard}
                    activeOpacity={0.85}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setConfiguringExerciseIndex(index);
                    }}
                  >
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
                          onPress={(e) => {
                            e.stopPropagation?.();
                            handleMoveBuilderExercise(index, 'up');
                          }}
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
                          onPress={(e) => {
                            e.stopPropagation?.();
                            handleMoveBuilderExercise(index, 'down');
                          }}
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
                          onPress={(e) => {
                            e.stopPropagation?.();
                            handleRemoveBuilderExercise(index);
                          }}
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

                    {/* Interactive Configuration Card Section */}
                    <View style={styles.builderSummarySection}>
                      <View style={styles.builderSummaryBadgesRow}>
                        <View style={styles.builderSummaryPill}>
                          <MaterialCommunityIcons name="layers-outline" size={13} color={colors.accent} />
                          <Text style={styles.builderSummaryPillText}>
                            {config.targetSets || 3} SETS
                          </Text>
                        </View>

                        <View style={[styles.builderSummaryPill, styles.builderSummaryPillAccent]}>
                          <MaterialCommunityIcons name="target" size={13} color={colors.accent} />
                          <Text style={[styles.builderSummaryPillText, { color: colors.accent, fontWeight: '800' }]}>
                            {hasCustomSets ? 'CUSTOM PER-SET' : repDisplay}
                          </Text>
                        </View>

                        <View style={styles.builderSummaryPill}>
                          <MaterialCommunityIcons name="weight" size={13} color={colors.textMuted} />
                          <Text style={styles.builderSummaryPillText}>
                            {weightDisplay}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.builderEditAffordance}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <MaterialCommunityIcons name="tune-vertical" size={13} color={colors.accent} />
                          <Text style={styles.builderEditAffordanceText}>TAP TO EDIT SETS & RANGES</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={16} color={colors.accent} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* Floating Save Button */}
          <View
            style={[
              styles.floatingSaveContainer,
              {
                bottom: keyboardHeight > 0 ? keyboardHeight + 12 : Math.max(16, (insets.bottom || 0) + 12),
              },
            ]}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              style={styles.floatingSaveBtn}
              onPress={handleSaveCustomRoutine}
              activeOpacity={0.85}
              accessibilityLabel={routineToEdit ? 'Save Changes' : 'Create Routine'}
            >
              <MaterialCommunityIcons
                name="check-bold"
                size={18}
                color={colors.accentContrastText}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.floatingSaveBtnText}>
                {routineToEdit ? 'SAVE CHANGES' : 'CREATE ROUTINE'}
              </Text>
            </TouchableOpacity>
          </View>

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
                  repRange: prescription?.repRange,
                  defaultWeight: prescription?.defaultWeightKg || 0,
                  weightUnit: (activeUser?.weightUnit || 'kg'),
                };
                setBuilderExercises((prev) => [...prev, newConfig]);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            selectedIds={selectedExIds}
          />

          {/* Dedicated Set & Range Configurator Screen/Modal */}
          <ExerciseSetConfigModal
            visible={configuringExerciseIndex !== null}
            exerciseConfig={
              configuringExerciseIndex !== null ? builderExercises[configuringExerciseIndex] : null
            }
            exerciseDefinition={
              configuringExerciseIndex !== null
                ? EXERCISE_DATABASE.find(
                    (e) => e.id === builderExercises[configuringExerciseIndex]?.exerciseId
                  )
                : null
            }
            onClose={() => setConfiguringExerciseIndex(null)}
            onSave={handleSaveExerciseConfig}
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
              style={[styles.modalConfirmBtn, { width: '100%', flex: 0, paddingVertical: 14 }]}
              onPress={() => setColorEditFolder(null)}
              activeOpacity={0.8}
            >
              <Text style={[styles.modalConfirmBtnText, { color: colors.accentContrastText || '#FFFFFF', fontSize: 13, fontWeight: '800' }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Dedicated Manage Folders Screen/Modal */}
      <Modal
        visible={isManageFoldersModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsManageFoldersModalOpen(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={[styles.manageFoldersHeader, { paddingTop: topInset + 12 }]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <MaterialCommunityIcons name="folder-cog-outline" size={20} color={colors.accent} />
                <Text style={styles.manageFoldersTitle}>Manage Folders</Text>
              </View>
              <Text style={styles.manageFoldersSub}>
                Organize, recolor, and assign routines to folders
              </Text>
            </View>
            <TouchableOpacity
              style={styles.builderCloseBtn}
              onPress={() => setIsManageFoldersModalOpen(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Close"
            >
              <MaterialCommunityIcons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6 }}>
            <TouchableOpacity
              style={styles.manageFoldersCreateBtn}
              onPress={() => {
                setNewFolderName('');
                setIsCreateFolderModalOpen(true);
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="folder-plus-outline" size={18} color={colors.accentContrastText} />
              <Text style={styles.manageFoldersCreateBtnText}>+ CREATE NEW FOLDER</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1, paddingHorizontal: 20 }}
            contentContainerStyle={{ gap: 12, paddingVertical: 10, paddingBottom: 50 }}
            showsVerticalScrollIndicator={false}
          >
            {folders.length === 0 ? (
              <View style={[styles.emptyFolderCard, { marginTop: 24 }]}>
                <MaterialCommunityIcons name="folder-outline" size={44} color={colors.textDim} />
                <Text style={styles.emptyFolderTitle}>No folders created yet</Text>
                <Text style={styles.emptyFolderSub}>
                  Create folders to organize your routines by split (e.g. Push Pull Legs), phase, or location.
                </Text>
              </View>
            ) : (
              folders.map((f) => {
                const count = folderCounts[f.name] || 0;
                return (
                  <View key={f.id || f.name} style={styles.manageFolderCard}>
                    <View style={styles.manageFolderCardTop}>
                      <TouchableOpacity
                        style={[styles.manageFolderColorDot, { backgroundColor: f.color }]}
                        onPress={() => setColorEditFolder(f)}
                        activeOpacity={0.7}
                        accessibilityLabel="Change Color"
                      >
                        <MaterialCommunityIcons name="palette-outline" size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.manageFolderCardName} numberOfLines={1}>
                          {f.name}
                        </Text>
                        <Text style={styles.manageFolderCardCount}>
                          {count} {count === 1 ? 'routine' : 'routines'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.manageFolderActionsRow}>
                      <TouchableOpacity
                        style={styles.manageFolderActionBtn}
                        onPress={() => handleOpenManageFolderRoutines(f)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="playlist-plus" size={16} color={colors.accent} />
                        <Text style={styles.manageFolderActionBtnText}>Routines</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.manageFolderActionBtn}
                        onPress={() => setColorEditFolder(f)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="palette-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.manageFolderActionBtnText, { color: colors.textSecondary }]}>Color</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.manageFolderActionBtn}
                        onPress={() => handleOpenRenameFolder(f)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.manageFolderActionBtnText, { color: colors.textSecondary }]}>Rename</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.manageFolderActionBtnDanger}
                        onPress={() => handleOpenDeleteFolder(f)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.danger} />
                        <Text style={[styles.manageFolderActionBtnText, { color: colors.danger }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Manage Folder Routines (Quick Add / Remove) Modal */}
      <Modal
        visible={manageFolderRoutinesTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setManageFolderRoutinesTarget(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.folderSelectModal, { maxHeight: '80%' }]}>
            <View style={styles.folderSelectHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <MaterialCommunityIcons name="folder-plus-outline" size={16} color={colors.accent} />
                  <Text style={styles.folderSelectTitle} numberOfLines={1}>
                    Manage Routines
                  </Text>
                </View>
                <Text style={styles.folderSelectSub} numberOfLines={1}>
                  Folder: "{manageFolderRoutinesTarget?.name}"
                </Text>
              </View>
              <TouchableOpacity onPress={() => setManageFolderRoutinesTarget(null)}>
                <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Search routines within modal */}
            <View style={styles.modalSearchBar}>
              <MaterialCommunityIcons name="magnify" size={16} color={colors.textDim} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search routines..."
                placeholderTextColor={colors.textDim}
                value={folderRoutineSearch}
                onChangeText={setFolderRoutineSearch}
              />
              {folderRoutineSearch ? (
                <TouchableOpacity onPress={() => setFolderRoutineSearch('')}>
                  <MaterialCommunityIcons name="close-circle" size={16} color={colors.textDim} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Routines checklist */}
            <ScrollView
              style={{ maxHeight: 320, marginVertical: 8 }}
              contentContainerStyle={{ gap: 8, paddingBottom: 10 }}
              showsVerticalScrollIndicator={false}
            >
              {routines.length === 0 ? (
                <Text style={{ textAlign: 'center', color: colors.textMuted, paddingVertical: 20 }}>
                  No routines created yet.
                </Text>
              ) : (
                routines
                  .filter((r) => {
                    if (!folderRoutineSearch.trim()) return true;
                    const q = folderRoutineSearch.toLowerCase().trim();
                    return (
                      r.title.toLowerCase().includes(q) ||
                      r.category.toLowerCase().includes(q)
                    );
                  })
                  .map((r) => {
                    const isChecked = folderAssignedRoutineIds.includes(r.id);
                    const isInOtherFolder = r.folder && r.folder !== manageFolderRoutinesTarget?.name;
                    return (
                      <TouchableOpacity
                        key={r.id}
                        style={[
                          styles.manageRoutineItem,
                          isChecked && styles.manageRoutineItemActive,
                        ]}
                        onPress={() => handleToggleRoutineAssignment(r.id)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons
                          name={isChecked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                          size={22}
                          color={isChecked ? colors.accent : colors.textDim}
                        />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text
                            style={[
                              styles.manageRoutineItemTitle,
                              isChecked && { color: colors.textPrimary, fontWeight: '800' },
                            ]}
                            numberOfLines={1}
                          >
                            {r.title}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <Text style={styles.manageRoutineItemMeta}>
                              {r.category} • {r.exerciseIds.length} exercises
                            </Text>
                            {isInOtherFolder && (
                              <Text style={styles.manageRoutineItemOtherFolder}>
                                Currently in "{r.folder}"
                              </Text>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
              )}
            </ScrollView>

            {/* Modal Bottom Buttons */}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setManageFolderRoutinesTarget(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleSaveManageFolderRoutines}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmBtnText}>
                  Save ({folderAssignedRoutineIds.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Delete Folder Modal with 2 Options (Contents vs Folder Only) */}
      <Modal
        visible={deleteFolderTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteFolderTarget(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.folderSelectModal, { maxWidth: 390 }]}>
            <View style={{ alignItems: 'center', marginBottom: 14 }}>
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: isDark ? 'rgba(255, 59, 48, 0.16)' : 'rgba(255, 59, 48, 0.1)',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 59, 48, 0.35)' : 'rgba(255, 59, 48, 0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <MaterialCommunityIcons name="folder-remove" size={26} color={colors.danger} />
              </View>
              <Text style={styles.deleteFolderModalTitle}>
                Delete "{deleteFolderTarget?.name}"?
              </Text>
              {(() => {
                const count = deleteFolderTarget ? (folderCounts[deleteFolderTarget.name] || 0) : 0;
                return (
                  <Text style={styles.deleteFolderModalSub}>
                    {count > 0
                      ? `This folder currently has ${count} routine${count !== 1 ? 's' : ''}. Choose what to do:`
                      : 'Are you sure you want to delete this empty folder?'}
                  </Text>
                );
              })()}
            </View>

            {(() => {
              const count = deleteFolderTarget ? (folderCounts[deleteFolderTarget.name] || 0) : 0;
              if (count === 0) {
                return (
                  <View style={styles.modalButtonsRow}>
                    <TouchableOpacity
                      style={styles.modalCancelBtn}
                      onPress={() => setDeleteFolderTarget(null)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.modalCancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalConfirmBtn, { backgroundColor: colors.danger }]}
                      onPress={() => handleConfirmDeleteFolder(false)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.modalConfirmBtnText, { color: '#FFFFFF' }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                );
              }

              return (
                <View style={{ gap: 10, marginBottom: 10 }}>
                  {/* Option 1: Delete Folder AND All Routines */}
                  <TouchableOpacity
                    style={styles.deleteFolderOptionDanger}
                    onPress={() => handleConfirmDeleteFolder(true)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.deleteFolderOptionIconWrap}>
                      <MaterialCommunityIcons name="trash-can" size={20} color={colors.danger} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.deleteFolderOptionDangerTitle}>
                        Delete Folder & All Routines
                      </Text>
                      <Text style={styles.deleteFolderOptionDangerSub}>
                        Permanently deletes the folder and all {count} routine{count !== 1 ? 's' : ''} inside it.
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Option 2: Delete Folder Only (Keep contents) */}
                  <TouchableOpacity
                    style={styles.deleteFolderOptionSafe}
                    onPress={() => handleConfirmDeleteFolder(false)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.deleteFolderOptionIconWrapSafe}>
                      <MaterialCommunityIcons name="folder-remove-outline" size={20} color={colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.deleteFolderOptionSafeTitle}>
                        Delete Folder Only (Keep Routines)
                      </Text>
                      <Text style={styles.deleteFolderOptionSafeSub}>
                        Deletes the folder. All {count} routine{count !== 1 ? 's' : ''} will be kept with no folder.
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalCancelBtn, { width: '100%', flex: 0, paddingVertical: 13, marginTop: 6 }]}
                    onPress={() => setDeleteFolderTarget(null)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalCancelBtnText, { color: colors.textPrimary, fontSize: 13, fontWeight: '800' }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* Rename Folder Modal */}
      <Modal
        visible={renameFolderTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameFolderTarget(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.folderSelectModal}>
            <View style={styles.folderSelectHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.folderSelectTitle}>Rename Folder</Text>
                <Text style={styles.folderSelectSub}>Enter a new name for this folder</Text>
              </View>
              <TouchableOpacity onPress={() => setRenameFolderTarget(null)}>
                <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { marginTop: 14 }]}
              placeholder="Folder Name (e.g., Push Pull Legs)"
              placeholderTextColor={colors.textDim}
              value={renameFolderInput}
              onChangeText={setRenameFolderInput}
              autoFocus
              maxLength={24}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRenameFolderTarget(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  !renameFolderInput.trim() && { opacity: 0.5 },
                ]}
                disabled={!renameFolderInput.trim()}
                onPress={handleConfirmRenameFolder}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
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

      {/* Routine Actions Sheet Modal */}
      <Modal
        visible={menuRoutine !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuRoutine(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setMenuRoutine(null)}
        >
          <View style={styles.actionSheetModal}>
            <View style={styles.actionSheetHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.actionSheetTitle} numberOfLines={1}>
                  {menuRoutine?.title}
                </Text>
                <Text style={styles.actionSheetSub}>
                  {menuRoutine?.folder || 'General'} • {menuRoutine?.category} • {menuRoutine?.exerciseIds.length} exercises
                </Text>
              </View>
              <TouchableOpacity onPress={() => setMenuRoutine(null)}>
                <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.actionSheetList}>
              <TouchableOpacity
                style={styles.actionSheetItem}
                onPress={() => {
                  if (menuRoutine) {
                    handleToggleFavorite(menuRoutine);
                    setMenuRoutine(null);
                  }
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={menuRoutine?.isFavorite ? 'star-off-outline' : 'star'}
                  size={20}
                  color={menuRoutine?.isFavorite ? colors.textDim : '#FFD700'}
                />
                <Text style={styles.actionSheetItemText}>
                  {menuRoutine?.isFavorite ? 'Unpin from Top' : 'Pin to Top (Favorite)'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionSheetItem}
                onPress={() => {
                  if (menuRoutine) {
                    const r = menuRoutine;
                    setMenuRoutine(null);
                    handleOpenEditRoutine(r);
                  }
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.accent} />
                <Text style={styles.actionSheetItemText}>Edit Routine</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionSheetItem}
                onPress={() => {
                  if (menuRoutine) {
                    const r = menuRoutine;
                    setMenuRoutine(null);
                    handleDuplicateRoutine(r);
                  }
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="content-copy" size={20} color={colors.accent} />
                <Text style={styles.actionSheetItemText}>Duplicate Routine</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionSheetItem}
                onPress={() => {
                  if (menuRoutine) {
                    const r = menuRoutine;
                    setMenuRoutine(null);
                    setRoutineToMove(r);
                  }
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="folder-move-outline" size={20} color={colors.accent} />
                <Text style={styles.actionSheetItemText}>Move to Folder...</Text>
              </TouchableOpacity>

              <View style={styles.actionSheetDivider} />

              <TouchableOpacity
                style={styles.actionSheetItem}
                onPress={() => {
                  if (menuRoutine) {
                    const r = menuRoutine;
                    setMenuRoutine(null);
                    handleDelete(r.id, r.title);
                  }
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.danger} />
                <Text style={[styles.actionSheetItemText, { color: colors.danger }]}>
                  Delete Routine
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Expandable Speed Dial FAB */}
      {activeSegment === 'routines' && (
        <>
          {/* Animated Backdrop when Speed Dial is open */}
          <Animated.View
            pointerEvents={isSpeedDialOpen ? 'auto' : 'none'}
            style={[
              styles.fabSpeedDialBackdrop,
              { opacity: backdropOpacity },
            ]}
          >
            <TouchableWithoutFeedback onPress={closeSpeedDial}>
              <View style={StyleSheet.absoluteFill} />
            </TouchableWithoutFeedback>
          </Animated.View>

          {/* Speed Dial Container */}
          <View
            style={[
              styles.fabSpeedDialContainer,
              { bottom: Math.max(94, (insets.bottom || 0) + 90) },
            ]}
            pointerEvents="box-none"
          >
            {/* Action 1: New Folder (top mini button) */}
            <Animated.View
              pointerEvents={isSpeedDialOpen ? 'auto' : 'none'}
              style={[
                styles.speedDialActionRow,
                {
                  opacity: item1Opacity,
                  transform: [{ translateY: item1TranslateY }, { scale: item1Scale }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.speedDialLabelPill}
                onPress={() => {
                  closeSpeedDial();
                  setNewFolderName('');
                  setIsCreateFolderModalOpen(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.speedDialLabelText}>New Folder</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.speedDialMiniBtn}
                onPress={() => {
                  closeSpeedDial();
                  setNewFolderName('');
                  setIsCreateFolderModalOpen(true);
                }}
                activeOpacity={0.8}
                accessibilityLabel="New Folder"
              >
                <MaterialCommunityIcons name="folder-plus-outline" size={20} color={colors.accent} />
              </TouchableOpacity>
            </Animated.View>

            {/* Action 2: Manage Folders (middle mini button) */}
            <Animated.View
              pointerEvents={isSpeedDialOpen ? 'auto' : 'none'}
              style={[
                styles.speedDialActionRow,
                {
                  opacity: item2Opacity,
                  transform: [{ translateY: item2TranslateY }, { scale: item2Scale }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.speedDialLabelPill}
                onPress={() => {
                  closeSpeedDial();
                  setIsManageFoldersModalOpen(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.speedDialLabelText}>Manage Folders</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.speedDialMiniBtn}
                onPress={() => {
                  closeSpeedDial();
                  setIsManageFoldersModalOpen(true);
                }}
                activeOpacity={0.8}
                accessibilityLabel="Manage Folders"
              >
                <MaterialCommunityIcons name="folder-cog-outline" size={20} color={colors.accent} />
              </TouchableOpacity>
            </Animated.View>

            {/* Main Action: Add New Routine (Big Button) */}
            <View style={styles.speedDialMainRow}>
              <Animated.View
                pointerEvents={isSpeedDialOpen ? 'auto' : 'none'}
                style={{
                  opacity: mainLabelOpacity,
                  transform: [{ scale: mainLabelScale }],
                }}
              >
                <TouchableOpacity
                  style={styles.speedDialLabelPill}
                  onPress={() => {
                    closeSpeedDial();
                    handleOpenCreateRoutine();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.speedDialLabelText}>Add New Routine</Text>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View
                style={{
                  transform: [{ rotate: fabRotation }],
                }}
              >
                <TouchableOpacity
                  style={styles.floatingActionBtn}
                  onPress={() => {
                    if (isSpeedDialOpen) {
                      closeSpeedDial();
                      handleOpenCreateRoutine();
                    } else {
                      toggleSpeedDial();
                    }
                  }}
                  activeOpacity={0.85}
                  accessibilityLabel={isSpeedDialOpen ? 'Add New Routine' : 'Open Routine Actions'}
                >
                  <MaterialCommunityIcons
                    name={isSpeedDialOpen ? 'plus' : 'pencil'}
                    size={26}
                    color={colors.accentContrastText}
                  />
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </>
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
      paddingBottom: 160,
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
    headerControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerControlBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerControlBtnActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSubtle,
    },
    viewToggleGroup: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceRaised,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      padding: 2,
    },
    viewToggleBtn: {
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 8,
    },
    viewToggleBtnActive: {
      backgroundColor: colors.accent,
    },
    routineSearchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      borderRadius: 14,
      paddingHorizontal: 12,
      height: 44,
      gap: 8,
    },
    routineSearchInput: {
      flex: 1,
      fontSize: 13,
      color: colors.textPrimary,
      padding: 0,
    },
    splitChipsScroll: {
      flexDirection: 'row',
      gap: 6,
      paddingVertical: 2,
    },
    splitChip: {
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 14,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    splitChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    splitChipText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
    },
    splitChipTextActive: {
      color: colors.accentContrastText,
      fontWeight: '800',
    },
    favoriteFilterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 14,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    favoriteFilterChipActive: {
      backgroundColor: colors.surface,
      borderColor: '#FFD700',
    },
    activeFilterPillRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceRaised,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    activeFilterPillText: {
      fontSize: 11,
      color: colors.textMuted,
      flex: 1,
    },
    clearFiltersBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    clearFiltersText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.accent,
    },
    compactRoutineCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      overflow: 'hidden',
      paddingRight: 10,
    },
    compactFolderStrip: {
      width: 4,
      alignSelf: 'stretch',
    },
    compactLeftBtn: {
      padding: 10,
    },
    compactContent: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 4,
      gap: 2,
    },
    compactTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    compactMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    compactMetaText: {
      fontSize: 11,
      color: colors.textMuted,
    },
    compactFolderBadge: {
      fontSize: 10,
      fontWeight: '700',
    },
    compactActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    compactPlayBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionSheetModal: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      padding: 20,
      width: '90%',
      maxWidth: 380,
      gap: 16,
    },
    actionSheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceBorder,
      paddingBottom: 12,
    },
    actionSheetTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    actionSheetSub: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    actionSheetList: {
      gap: 6,
    },
    actionSheetItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 11,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: colors.surfaceRaised,
    },
    actionSheetItemText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    actionSheetDivider: {
      height: 1,
      backgroundColor: colors.surfaceBorder,
      marginVertical: 4,
    },
    fabSpeedDialBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      zIndex: 90,
    },
    fabSpeedDialContainer: {
      position: 'absolute',
      right: 20,
      alignItems: 'flex-end',
      zIndex: 99,
    },
    speedDialActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginBottom: 12,
      gap: 10,
    },
    speedDialMainRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 10,
    },
    speedDialLabelPill: {
      backgroundColor: isDark ? '#1C1F2B' : '#FFFFFF',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.95)',
      shadowColor: isDark ? '#000' : '#475569',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.12,
      shadowRadius: 6,
      elevation: 4,
    },
    speedDialLabelText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 0.3,
    },
    speedDialMiniBtn: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: isDark ? '#1C1F2B' : '#FFFFFF',
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.95)',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: isDark ? '#000' : '#475569',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.12,
      shadowRadius: 6,
      elevation: 5,
    },
    floatingActionBtn: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 14,
      elevation: 10,
      borderWidth: 2,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : '#FFFFFF',
    },
    newRoutineBtn: {
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
    newRoutineBtnText: {
      fontSize: 11,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.5,
    },
    routineCard: {
      backgroundColor: isDark ? '#151722' : '#FFFFFF',
      borderRadius: 26,
      padding: 18,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.95)',
      gap: 12,
      shadowColor: isDark ? '#000000' : '#475569',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.35 : 0.10,
      shadowRadius: 10,
      elevation: 4,
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
    levelFilterContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 16,
      marginBottom: 10,
      height: 36,
      flexShrink: 0,
    },
    levelLabelBadge: {
      paddingRight: 8,
      justifyContent: 'center',
    },
    levelLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textDim,
      letterSpacing: 0.8,
    },
    levelScrollView: {
      flex: 1,
    },
    levelScrollContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingRight: 20,
    },
    levelChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 14,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      justifyContent: 'center',
      alignItems: 'center',
    },
    levelChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    levelText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      includeFontPadding: false,
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
    builderSummarySection: {
      backgroundColor: colors.surfaceRaised,
      borderRadius: 10,
      padding: 10,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      gap: 8,
    },
    builderSummaryBadgesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    builderSummaryPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors.surface,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    builderSummaryPillAccent: {
      backgroundColor: colors.accentSubtle,
      borderColor: colors.accent + '44',
    },
    builderSummaryPillText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      letterSpacing: 0.3,
    },
    builderEditAffordance: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: colors.surfaceBorder,
    },
    builderEditAffordanceText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.accent,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      letterSpacing: 0.5,
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
    builderQuickRangesRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 3,
      marginTop: 4,
    },
    builderQuickRangeChip: {
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    builderQuickRangeChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    builderQuickRangeChipText: {
      fontSize: 8,
      fontWeight: '700',
      color: colors.textMuted,
      fontFamily: 'monospace',
    },
    builderQuickRangeChipTextActive: {
      color: colors.accentContrastText,
      fontWeight: '900',
    },
    builderPerSetToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceRaised,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 8,
      marginTop: 8,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    builderPerSetToggleText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textMuted,
      fontFamily: 'monospace',
      letterSpacing: 0.3,
    },
    builderPerSetDrawer: {
      marginTop: 6,
      backgroundColor: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.03)',
      borderRadius: 10,
      padding: 8,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      gap: 6,
    },
    builderPerSetDrawerHeader: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.textDim,
      fontFamily: 'monospace',
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    builderPerSetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      gap: 6,
    },
    builderPerSetBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    builderPerSetBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.textMuted,
      fontFamily: 'monospace',
    },
    builderPerSetStepper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceRaised,
      borderRadius: 6,
      paddingHorizontal: 3,
      paddingVertical: 2,
      gap: 4,
    },
    builderPerSetStepBtn: {
      width: 18,
      height: 18,
      borderRadius: 4,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    builderPerSetStepVal: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: 'monospace',
      minWidth: 42,
      textAlign: 'center',
    },
    builderPerSetChips: {
      flexDirection: 'row',
      gap: 3,
    },
    builderPerSetChip: {
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    builderPerSetChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    builderPerSetChipText: {
      fontSize: 8,
      fontWeight: '700',
      color: colors.textMuted,
      fontFamily: 'monospace',
    },
    builderPerSetChipTextActive: {
      color: colors.accentContrastText,
      fontWeight: '900',
    },
    floatingSaveContainer: {
      position: 'absolute',
      left: 16,
      right: 16,
      zIndex: 50,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 8,
    },
    floatingSaveBtn: {
      flexDirection: 'row',
      backgroundColor: colors.accent,
      borderRadius: 16,
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.25)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 6,
    },
    floatingSaveBtnText: {
      fontSize: 14,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.8,
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
    emptyFolderIconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    emptyFolderTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: 8,
      textAlign: 'center',
    },
    emptyFolderSub: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 4,
      marginBottom: 16,
      lineHeight: 18,
      paddingHorizontal: 12,
    },
    emptyFolderButtonsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyFolderPrimaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.accent,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 3,
    },
    emptyFolderPrimaryBtnText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.accentContrastText,
      letterSpacing: 0.5,
    },
    emptyFolderSecondaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    emptyFolderSecondaryBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: 0.3,
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
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    modalConfirmBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.accent,
      alignItems: 'center',
    },
    modalConfirmBtnText: {
      fontSize: 13,
      fontWeight: '900',
      color: colors.accentContrastText || '#FFFFFF',
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
    // Folder Control Strip Styles
    folderControlStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceRaised,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginTop: 8,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    folderControlLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
      marginRight: 8,
    },
    folderColorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    folderControlName: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
      maxWidth: 130,
    },
    folderCountBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    folderCountText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textMuted,
    },
    folderControlActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    folderActionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.surface,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.accent + '44',
    },
    folderActionPillText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accent,
    },
    folderIconBtn: {
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    folderIconBtnDanger: {
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255, 59, 48, 0.12)' : 'rgba(255, 59, 48, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 59, 48, 0.3)' : 'rgba(255, 59, 48, 0.2)',
    },
    // Manage Routines Modal Styles
    modalSearchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.surfaceRaised,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      marginBottom: 4,
    },
    modalSearchInput: {
      flex: 1,
      fontSize: 12,
      color: colors.textPrimary,
      padding: 0,
    },
    manageRoutineItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      borderRadius: 12,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    manageRoutineItemActive: {
      borderColor: colors.accent,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
    },
    manageRoutineItemTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    manageRoutineItemMeta: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textMuted,
    },
    manageRoutineItemOtherFolder: {
      fontSize: 9,
      fontWeight: '700',
      color: colors.accent,
      backgroundColor: colors.surface,
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
    },
    // Delete Folder Modal Styles
    deleteFolderModalTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.textPrimary,
      textAlign: 'center',
      letterSpacing: 0.3,
    },
    deleteFolderModalSub: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 4,
      paddingHorizontal: 12,
    },
    deleteFolderOptionDanger: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 14,
      backgroundColor: isDark ? 'rgba(255, 59, 48, 0.08)' : 'rgba(255, 59, 48, 0.05)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 59, 48, 0.3)' : 'rgba(255, 59, 48, 0.2)',
    },
    deleteFolderOptionDangerTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.danger,
    },
    deleteFolderOptionDangerSub: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    deleteFolderOptionSafe: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 14,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    deleteFolderOptionSafeTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    deleteFolderOptionSafeSub: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    deleteFolderOptionIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? 'rgba(255, 59, 48, 0.16)' : 'rgba(255, 59, 48, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteFolderOptionIconWrapSafe: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    // Dedicated Manage Folders Screen Styles
    manageFoldersHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceBorder,
      backgroundColor: colors.background,
    },
    manageFoldersTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.textPrimary,
      letterSpacing: 0.3,
    },
    manageFoldersSub: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    manageFoldersCreateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.accent,
      paddingVertical: 12,
      borderRadius: 14,
    },
    manageFoldersCreateBtnText: {
      fontSize: 13,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.5,
    },
    manageFolderCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      gap: 12,
    },
    manageFolderCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    manageFolderColorDot: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    manageFolderCardName: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    manageFolderCardCount: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    manageFolderActionsRow: {
      flexDirection: 'row',
      gap: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.surfaceBorder,
    },
    manageFolderActionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    manageFolderActionBtnDanger: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(255, 59, 48, 0.12)' : 'rgba(255, 59, 48, 0.08)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 59, 48, 0.3)' : 'rgba(255, 59, 48, 0.2)',
    },
    manageFolderActionBtnText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accent,
    },
  });
