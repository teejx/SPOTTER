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
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';
import { EXERCISE_DATABASE } from '../lib/exercises';
import { PPL_PRESCRIPTIONS, FOLDER_COLOR_PALETTE } from '../lib/seedData';
import { ExerciseGuideModal } from '../components/ExerciseGuideModal';
import { ExercisePickerModal } from '../components/ExercisePickerModal';
import { ExerciseDefinition, RoutineTemplate, MuscleGroup, RoutineFolder } from '../types';

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
    folders,
    updateRoutineFolder,
    createFolder,
    updateFolderColor,
    deleteFolder,
    colors,
    isDark,
  } = useFitness();
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
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Push');
  const [builderFolder, setBuilderFolder] = useState('General');
  const [selectedExIds, setSelectedExIds] = useState<string[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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
    Alert.alert('Delete Routine', `Are you sure you want to delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteRoutine(id),
      },
    ]);
  };

  const handleSaveCustomRoutine = async () => {
    if (!newTitle.trim() || selectedExIds.length === 0) {
      Alert.alert('Incomplete Routine', 'Please enter a routine title and add at least one exercise.');
      return;
    }
    await createRoutine(newTitle.trim(), newDesc.trim(), newCategory, selectedExIds, builderFolder);
    setIsBuilderOpen(false);
    setNewTitle('');
    setNewDesc('');
    setSelectedExIds([]);
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
              onPress={() => {
                setBuilderFolder(selectedFolder !== 'All' ? selectedFolder : 'Indoor Workouts');
                setIsBuilderOpen(true);
              }}
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
                {selectedFolder !== 'All' && selectedFolder !== 'Indoor Workouts' && selectedFolder !== 'Outdoor Workouts' && (
                  <TouchableOpacity
                    style={[styles.emptyFolderBtn, { borderColor: colors.danger, backgroundColor: 'transparent' }]}
                    onPress={() => {
                      Alert.alert('Delete Folder', `Are you sure you want to delete folder "${selectedFolder}"? Routines will be reassigned.`, [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => {
                            deleteFolder(selectedFolder);
                            setSelectedFolder('All');
                          },
                        },
                      ]);
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
                      onPress={() => setRoutineToMove(routine)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialCommunityIcons name="folder-move-outline" size={18} color={colors.textDim} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => handleDelete(routine.id, routine.title)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
          <View style={[styles.modalHeader, { paddingTop: topInset + 10 }]}>
            <Text style={styles.modalTitle}>Create New Routine</Text>
            <TouchableOpacity onPress={() => setIsBuilderOpen(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={builderScrollRef}
            style={[styles.builderContent, { marginBottom: keyboardHeight }]}
            contentContainerStyle={{ gap: 14, paddingBottom: keyboardHeight > 0 ? 32 : 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <View>
              <Text style={styles.inputLabel}>Routine Title</Text>
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

            <View>
              <Text style={styles.inputLabel}>Description</Text>
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

            <View>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryPickerRow}>
                {['Push', 'Pull', 'Legs', 'Full Body', 'Indoor'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChoice, newCategory === cat && styles.categoryChoiceActive]}
                    onPress={() => setNewCategory(cat)}
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

            <View>
              <Text style={styles.inputLabel}>Folder</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
              >
                {folders.map((f) => (
                  <TouchableOpacity
                    key={f.id || f.name}
                    style={[
                      styles.categoryChoice,
                      builderFolder === f.name && { backgroundColor: f.color, borderColor: f.color },
                    ]}
                    onPress={() => setBuilderFolder(f.name)}
                  >
                    <MaterialCommunityIcons
                      name="folder-outline"
                      size={13}
                      color={builderFolder === f.name ? '#FFFFFF' : f.color}
                    />
                    <Text
                      style={[
                        styles.categoryChoiceText,
                        builderFolder === f.name && styles.categoryChoiceTextActive,
                      ]}
                    >
                      {f.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.builderSectionHeader}>
              <Text style={styles.inputLabel}>Exercises ({selectedExIds.length})</Text>
              <TouchableOpacity
                style={styles.addExBtn}
                onPress={() => setIsPickerOpen(true)}
              >
                <MaterialCommunityIcons name="plus" size={16} color={colors.accent} />
                <Text style={styles.addExBtnText}>Add Exercises</Text>
              </TouchableOpacity>
            </View>

            {selectedExIds.map((id, index) => {
              const ex = EXERCISE_DATABASE.find((e) => e.id === id);
              if (!ex) return null;
              return (
                <View key={id} style={styles.selectedExRow}>
                  <Text style={styles.exIndexText}>{index + 1}</Text>
                  <Text style={styles.selectedExName}>{ex.name}</Text>
                  <TouchableOpacity
                    onPress={() => setSelectedExIds((prev) => prev.filter((i) => i !== id))}
                  >
                    <MaterialCommunityIcons name="close-circle" size={20} color={colors.textDim} />
                  </TouchableOpacity>
                </View>
              );
            })}

            <TouchableOpacity
              style={styles.saveRoutineBtn}
              onPress={handleSaveCustomRoutine}
              activeOpacity={0.8}
            >
              <Text style={styles.saveRoutineBtnText}>Save Routine</Text>
            </TouchableOpacity>
          </ScrollView>

          <ExercisePickerModal
            visible={isPickerOpen}
            onClose={() => setIsPickerOpen(false)}
            onSelect={(ex) => {
              if (!selectedExIds.includes(ex.id)) {
                setSelectedExIds((prev) => [...prev, ex.id]);
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
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceBorder,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    builderContent: {
      padding: 20,
    },
    inputLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textMuted,
      fontFamily: 'monospace',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    input: {
      backgroundColor: colors.surface,
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
      backgroundColor: colors.surface,
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
    builderSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 6,
    },
    addExBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    addExBtnText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.accent,
    },
    selectedExRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      gap: 10,
    },
    exIndexText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accent,
      fontFamily: 'monospace',
    },
    selectedExName: {
      flex: 1,
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    saveRoutineBtn: {
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 10,
    },
    saveRoutineBtnText: {
      fontSize: 13,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.5,
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
