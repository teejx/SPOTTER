import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';
import { EXERCISE_DATABASE } from '../lib/exercises';
import { ExerciseGuideModal } from '../components/ExerciseGuideModal';
import { ExerciseDefinition, MuscleGroup } from '../types';

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

export const CatalogScreen: React.FC<{ onStartExercise?: (ex: ExerciseDefinition) => void }> = ({
  onStartExercise,
}) => {
  const { colors, isDark } = useFitness();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | MuscleGroup>('All');
  const [activeLevel, setActiveLevel] = useState<string>('All Levels');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDefinition | null>(null);

  const filtered = useMemo(() => {
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Exercise Library</Text>
        <Text style={styles.subtitle}>
          {EXERCISE_DATABASE.length} movements with offline motion loops & video tutorials
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textDim} />
        <TextInput
          style={styles.searchInput}
          placeholder="Filter movements or equipment..."
          placeholderTextColor={colors.textDim}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <MaterialCommunityIcons name="close-circle" size={16} color={colors.textDim} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category Horizontal Filter */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={CATEGORIES}
        keyExtractor={(item) => item}
        style={styles.chipScroll}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        renderItem={({ item }) => {
          const isActive = activeCategory === item;
          return (
            <TouchableOpacity
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => setActiveCategory(item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Difficulty Sub-Filter */}
      <View style={styles.levelRow}>
        <Text style={styles.levelLabel}>LEVEL:</Text>
        {DIFFICULTY_LEVELS.map((level) => {
          const isLvlActive = activeLevel === level;
          return (
            <TouchableOpacity
              key={level}
              style={[styles.levelChip, isLvlActive && styles.levelChipActive]}
              onPress={() => setActiveLevel(level)}
              activeOpacity={0.7}
            >
              <Text style={[styles.levelText, isLvlActive && styles.levelTextActive]}>
                {level}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Exercise List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.exerciseCard}
            onPress={() => setSelectedExercise(item)}
            activeOpacity={0.7}
          >
            <View style={styles.exerciseCardLeft}>
              <View style={styles.titleWithBadge}>
                <Text style={styles.exerciseCardName}>{item.name}</Text>
                {item.exerciseDbGifUrl ? (
                  <View style={styles.loopBadge}>
                    <Text style={styles.loopBadgeText}>ANIMATED</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.exerciseMetaRow}>
                <Text style={styles.exerciseMetaText}>{item.category}</Text>
                <Text style={styles.exerciseMetaDot}>•</Text>
                <Text style={styles.exerciseMetaText}>{item.equipment}</Text>
                {item.difficulty && (
                  <>
                    <Text style={styles.exerciseMetaDot}>•</Text>
                    <View style={styles.diffPill}>
                      <Text style={styles.diffPillText}>{item.difficulty}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            <View style={styles.exerciseCardRight}>
              <TouchableOpacity
                style={styles.infoCircleBtn}
                onPress={() => setSelectedExercise(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="information-variant" size={16} color={colors.textMuted} />
              </TouchableOpacity>
              {onStartExercise && (
                <TouchableOpacity
                  style={styles.playCircleBtn}
                  onPress={() => onStartExercise(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons name="play" size={14} color={colors.accentContrastText} />
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      <ExerciseGuideModal
        exercise={selectedExercise}
        visible={!!selectedExercise}
        onClose={() => setSelectedExercise(null)}
        onStartExercise={onStartExercise}
      />
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
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 8,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#12141C' : '#FFFFFF',
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginHorizontal: 16,
      marginTop: 4,
      marginBottom: 10,
      gap: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    chipScroll: {
      marginBottom: 8,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: isDark ? '#1C1F2B' : '#FFFFFF',
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.95)',
    },
    chipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    chipText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textMuted,
    },
    chipTextActive: {
      color: colors.accentContrastText,
      fontWeight: '900',
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
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 14,
      backgroundColor: isDark ? '#14161F' : '#F1F5F9',
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    },
    levelChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    levelText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textMuted,
      fontFamily: 'monospace',
    },
    levelTextActive: {
      color: colors.accentContrastText,
      fontWeight: '900',
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 40,
      gap: 10,
    },
    exerciseCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? '#151722' : '#FFFFFF',
      padding: 16,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.95)',
      shadowColor: isDark ? '#000000' : '#475569',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.10,
      shadowRadius: 6,
      elevation: 3,
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
      color: colors.text,
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
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    diffPillText: {
      fontSize: 9,
      fontWeight: '800',
      color: '#F59E0B',
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
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.inputBorder,
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
  });
