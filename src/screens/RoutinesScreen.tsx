import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';
import { EXERCISE_DATABASE } from '../lib/exercises';
import { PPL_PRESCRIPTIONS } from '../lib/seedData';
import { ExerciseGuideModal } from '../components/ExerciseGuideModal';
import { ExercisePickerModal } from '../components/ExercisePickerModal';
import { ExerciseDefinition, RoutineTemplate, MuscleGroup } from '../types';

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
  const { routines, deleteRoutine, createRoutine, colors, isDark } = useFitness();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [activeSegment, setActiveSegment] = useState<'routines' | 'library'>('routines');
  const [selectedGuideExercise, setSelectedGuideExercise] = useState<ExerciseDefinition | null>(null);

  // Library filters
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | MuscleGroup>('All');
  const [activeLevel, setActiveLevel] = useState<string>('All Levels');

  // Routine Builder modal
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Push');
  const [selectedExIds, setSelectedExIds] = useState<string[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

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
    await createRoutine(newTitle.trim(), newDesc.trim(), newCategory, selectedExIds);
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
              onPress={() => setIsBuilderOpen(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="plus" size={16} color={colors.accentContrastText} />
              <Text style={styles.newRoutineBtnText}>NEW ROUTINE</Text>
            </TouchableOpacity>
          </View>

          {routines.map((routine) => (
            <View key={routine.id} style={styles.routineCard}>
              <View style={styles.routineCardHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleBadgeRow}>
                    <Text style={styles.cardTitle}>{routine.title}</Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{routine.category}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardDesc}>{routine.description}</Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(routine.id, routine.title)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textDim} />
                </TouchableOpacity>
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
          ))}
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
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Routine</Text>
            <TouchableOpacity onPress={() => setIsBuilderOpen(false)}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.builderContent} contentContainerStyle={{ gap: 14 }}>
            <View>
              <Text style={styles.inputLabel}>Routine Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Upper Body Hypertrophy"
                placeholderTextColor={colors.textDim}
                value={newTitle}
                onChangeText={setNewTitle}
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
              />
            </View>

            <View>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryPickerRow}>
                {['Push', 'Pull', 'Legs', 'Full Body'].map((cat) => (
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
    },
    titleBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    categoryBadge: {
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
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
  });
