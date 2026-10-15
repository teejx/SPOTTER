import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';
import { EXERCISE_DATABASE } from '../lib/exercises';
import { ExerciseDefinition, MuscleGroup } from '../types';

import * as Haptics from 'expo-haptics';

interface ExercisePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: ExerciseDefinition) => void;
  selectedIds?: string[];
  multiSelect?: boolean;
  onConfirmMultiSelect?: (exercises: ExerciseDefinition[]) => void;
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

export const ExercisePickerModal: React.FC<ExercisePickerModalProps> = ({
  visible,
  onClose,
  onSelect,
  selectedIds = [],
  multiSelect = true,
  onConfirmMultiSelect,
}) => {
  const { colors, isDark } = useFitness();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | MuscleGroup>('All');
  // Internal selection state tracking newly selected exercises in multiSelect mode
  const [pendingSelectedIds, setPendingSelectedIds] = useState<string[]>([]);

  // Reset or sync pending selection whenever modal opens or selectedIds change
  React.useEffect(() => {
    if (visible) {
      setPendingSelectedIds(selectedIds);
      setSearch('');
    }
  }, [visible, selectedIds]);

  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 0
  );

  const filtered = EXERCISE_DATABASE.filter((ex) => {
    const matchCat = activeCategory === 'All' || ex.category === activeCategory;
    const matchSearch =
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.equipment.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleToggleExercise = (exercise: ExerciseDefinition) => {
    if (!multiSelect) {
      onSelect(exercise);
      onClose();
      return;
    }

    const isSelected = pendingSelectedIds.includes(exercise.id);
    if (isSelected) {
      // Toggle off / deselect
      setPendingSelectedIds((prev) => prev.filter((id) => id !== exercise.id));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      // Toggle on / select
      setPendingSelectedIds((prev) => [...prev, exercise.id]);
      onSelect(exercise);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleDone = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (onConfirmMultiSelect) {
      const selectedExercises = EXERCISE_DATABASE.filter((e) =>
        pendingSelectedIds.includes(e.id)
      );
      onConfirmMultiSelect(selectedExercises);
    }
    onClose();
  };

  const selectedCount = pendingSelectedIds.length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, { paddingTop: topInset + 10 }]}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.headerTitle}>Add Exercise</Text>
              {multiSelect && selectedCount > 0 && (
                <View style={styles.headerCountBadge}>
                  <Text style={styles.headerCountBadgeText}>{selectedCount} selected</Text>
                </View>
              )}
            </View>
            <Text style={styles.headerSubtitle}>
              {multiSelect
                ? 'Select exercises then tap Done to add all'
                : `Choose from ${EXERCISE_DATABASE.length} movements`}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Close"
          >
            <MaterialCommunityIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textDim} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises or equipment..."
            placeholderTextColor={colors.textDim}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.textDim} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Categories Chips */}
        <View style={styles.categoryRow}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CATEGORIES}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.categoryList}
            renderItem={({ item }) => {
              const isSelected = activeCategory === item;
              return (
                <TouchableOpacity
                  style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                  onPress={() => setActiveCategory(item)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Exercises List */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            multiSelect && { paddingBottom: 100 }
          ]}
          renderItem={({ item }) => {
            const isAlreadyAdded = pendingSelectedIds.includes(item.id);
            return (
              <TouchableOpacity
                style={[styles.exerciseCard, isAlreadyAdded && styles.exerciseCardSelected]}
                onPress={() => handleToggleExercise(item)}
                activeOpacity={0.7}
              >
                <View style={styles.exerciseCardLeft}>
                  <View style={[styles.exerciseCardIcon, isAlreadyAdded && styles.exerciseCardIconSelected]}>
                    <MaterialCommunityIcons
                      name="dumbbell"
                      size={20}
                      color={isAlreadyAdded ? colors.accentContrastText : colors.accent}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.exerciseName, isAlreadyAdded && styles.exerciseNameSelected]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <View style={styles.exerciseBadgeRow}>
                      <Text style={styles.badgeText}>{item.category}</Text>
                      <Text style={styles.badgeDot}>•</Text>
                      <Text style={styles.badgeText}>{item.equipment}</Text>
                      {item.difficulty && (
                        <>
                          <Text style={styles.badgeDot}>•</Text>
                          <Text style={styles.badgeText}>{item.difficulty}</Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>

                <View style={[styles.checkCircleBox, isAlreadyAdded && styles.checkCircleBoxActive]}>
                  <MaterialCommunityIcons
                    name={isAlreadyAdded ? 'check' : 'plus'}
                    size={16}
                    color={isAlreadyAdded ? colors.accentContrastText : colors.textMuted}
                  />
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {/* Floating Bottom Action Bar in MultiSelect Mode */}
        {multiSelect && selectedCount > 0 && (
          <View style={[styles.bottomBarContainer, { paddingBottom: Math.max(16, insets.bottom + 8) }]}>
            <TouchableOpacity
              style={styles.bottomDoneBtnActive}
              onPress={handleDone}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="check"
                size={20}
                color={colors.accentContrastText}
              />
              <Text style={styles.bottomDoneBtnText}>
                ADD {selectedCount} EXERCISE{selectedCount !== 1 ? 'S' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
      backgroundColor: colors.background,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.3,
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    closeBtn: {
      padding: 6,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBg,
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
    },
    categoryRow: {
      height: 44,
    },
    categoryList: {
      paddingHorizontal: 16,
      gap: 8,
    },
    categoryChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      alignSelf: 'center',
    },
    categoryChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    categoryChipText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
    },
    categoryChipTextActive: {
      color: colors.accentContrastText,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 40,
      gap: 8,
    },
    exerciseCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.cardBg,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    exerciseCardSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSubtle,
    },
    exerciseCardLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    exerciseCardIcon: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    exerciseName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    exerciseNameSelected: {
      color: colors.textPrimary,
      fontWeight: '800',
    },
    exerciseCardIconSelected: {
      backgroundColor: colors.accent,
    },
    exerciseBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    badgeText: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: 'monospace',
    },
    badgeDot: {
      fontSize: 10,
      color: colors.textDim,
    },
    headerCountBadge: {
      backgroundColor: colors.accentSubtle,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    headerCountBadgeText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accent,
    },
    doneHeaderBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.accent,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
    },
    doneHeaderBtnText: {
      fontSize: 11,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.5,
    },
    checkCircleBox: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
      borderWidth: 1.5,
      borderColor: colors.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkCircleBoxActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    bottomBarContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: Platform.OS === 'ios' ? 24 : 16,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 8,
    },
    bottomDoneBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 14,
    },
    bottomDoneBtnActive: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: colors.accent,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 6,
    },
    bottomDoneBtnText: {
      fontSize: 14,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.5,
    },
  });
