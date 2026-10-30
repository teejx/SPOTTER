import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Platform,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';
import { useScreenBottomPadding } from '../hooks/useScreenBottomPadding';
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
  const bottomPadding = useScreenBottomPadding(32);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | MuscleGroup>('All');
  const [activeLevel, setActiveLevel] = useState<string>('All Levels');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDefinition | null>(null);

  // Category Color & Icon Mapping for Vibrant UI
  const getCategoryMeta = (cat: string) => {
    switch (cat) {
      case 'Chest':
        return { color: colors.rose, bg: colors.roseSubtle, icon: 'shield-outline' as const };
      case 'Back':
        return { color: colors.violet, bg: colors.violetSubtle, icon: 'human-handsdown' as const };
      case 'Legs':
        return { color: colors.teal, bg: colors.tealSubtle, icon: 'run' as const };
      case 'Shoulders':
        return { color: colors.sky, bg: colors.skySubtle, icon: 'arm-flex' as const };
      case 'Arms':
        return { color: colors.amber, bg: colors.amberSubtle, icon: 'dumbbell' as const };
      case 'Core':
        return { color: colors.lime, bg: colors.limeSubtle, icon: 'fire' as const };
      default:
        return { color: colors.accent, bg: colors.accentSubtle, icon: 'weight-lifter' as const };
    }
  };

  const getDifficultyColor = (diff?: string) => {
    switch (diff?.toLowerCase()) {
      case 'beginner':
        return { color: colors.mint, bg: colors.mintSubtle };
      case 'intermediate':
        return { color: colors.amber, bg: colors.amberSubtle };
      case 'advanced':
        return { color: colors.rose, bg: colors.roseSubtle };
      default:
        return { color: colors.accent, bg: colors.accentSubtle };
    }
  };

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
      {/* Header Bento Title */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Movement Library</Text>
            <Text style={styles.subtitle}>
              Form guides, video tutorials & motion loops
            </Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filtered.length} MOVES</Text>
          </View>
        </View>
      </View>

      {/* Clay Search Bar */}
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
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSearch('');
            }}
          >
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.textDim} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category Horizontal Filter Pills */}
      <View style={{ marginBottom: 6 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoryScrollContent}
          renderItem={({ item }) => {
            const isActive = activeCategory === item;
            const meta = getCategoryMeta(item);
            return (
              <TouchableOpacity
                style={[
                  styles.chip,
                  isActive && { backgroundColor: meta.color, borderColor: meta.color },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveCategory(item);
                }}
                activeOpacity={0.75}
              >
                {item !== 'All' && (
                  <MaterialCommunityIcons
                    name={meta.icon}
                    size={13}
                    color={isActive ? '#FFFFFF' : meta.color}
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Difficulty Sub-Filter Pills */}
      <View style={styles.levelRow}>
        <Text style={styles.levelLabel}>DIFFICULTY:</Text>
        {DIFFICULTY_LEVELS.map((level) => {
          const isLvlActive = activeLevel === level;
          return (
            <TouchableOpacity
              key={level}
              style={[styles.levelChip, isLvlActive && styles.levelChipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveLevel(level);
              }}
              activeOpacity={0.75}
            >
              <Text style={[styles.levelText, isLvlActive && styles.levelTextActive]}>
                {level}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Exercise Bento Cards List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        renderItem={({ item }) => {
          const meta = getCategoryMeta(item.category);
          const diffMeta = getDifficultyColor(item.difficulty);

          return (
            <TouchableOpacity
              style={styles.exerciseCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedExercise(item);
              }}
              activeOpacity={0.8}
            >
              {/* Category Icon Badge */}
              <View style={[styles.exerciseIconBadge, { backgroundColor: meta.bg }]}>
                <MaterialCommunityIcons name={meta.icon} size={20} color={meta.color} />
              </View>

              {/* Center Content */}
              <View style={styles.exerciseCardLeft}>
                <View style={styles.titleWithBadge}>
                  <Text style={styles.exerciseCardName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.exerciseDbGifUrl ? (
                    <View style={styles.loopBadge}>
                      <Text style={styles.loopBadgeText}>ANIMATED</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.exerciseMetaRow}>
                  <View style={[styles.categoryTagPill, { backgroundColor: meta.bg }]}>
                    <Text style={[styles.categoryTagText, { color: meta.color }]}>
                      {item.category}
                    </Text>
                  </View>
                  <Text style={styles.equipmentText}>{item.equipment}</Text>
                  {item.difficulty && (
                    <View style={[styles.diffPill, { backgroundColor: diffMeta.bg }]}>
                      <Text style={[styles.diffPillText, { color: diffMeta.color }]}>
                        {item.difficulty}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Right Action Buttons */}
              <View style={styles.exerciseCardRight}>
                <TouchableOpacity
                  style={styles.infoCircleBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedExercise(item);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons name="information-variant" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                {onStartExercise && (
                  <TouchableOpacity
                    style={styles.playCircleBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      onStartExercise(item);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons name="play" size={15} color={colors.accentContrastText} />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="magnify-remove-outline" size={44} color={colors.textDim} />
            <Text style={styles.emptyTitle}>No matching movements</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search query or filters.</Text>
          </View>
        }
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
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 6,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: 22,
      fontWeight: '900',
      color: colors.textPrimary,
      letterSpacing: -0.4,
    },
    subtitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
      marginTop: 2,
    },
    countBadge: {
      backgroundColor: colors.accentSubtle,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    countBadgeText: {
      fontSize: 10,
      fontWeight: '900',
      color: colors.accent,
      letterSpacing: 0.8,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1.5,
      borderColor: colors.surfaceBorder,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 10,
      gap: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    categoryScrollContent: {
      paddingHorizontal: 16,
      gap: 8,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.surfaceBorder,
    },
    chipText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textSecondary,
    },
    chipTextActive: {
      color: '#FFFFFF',
      fontWeight: '900',
    },
    levelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 12,
      gap: 6,
      flexWrap: 'wrap',
    },
    levelLabel: {
      fontSize: 10,
      fontWeight: '900',
      color: colors.textDim,
      letterSpacing: 0.8,
    },
    levelChip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
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
      fontWeight: '800',
      color: colors.textMuted,
    },
    levelTextActive: {
      color: '#FFFFFF',
      fontWeight: '900',
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 80,
      gap: 10,
    },
    exerciseCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 14,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: colors.surfaceBorder,
      elevation: 2,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.05,
      shadowRadius: 6,
      gap: 12,
    },
    exerciseIconBadge: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    exerciseCardLeft: {
      flex: 1,
    },
    titleWithBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    exerciseCardName: {
      fontSize: 14,
      fontWeight: '900',
      color: colors.textPrimary,
      flexShrink: 1,
    },
    loopBadge: {
      backgroundColor: colors.mintSubtle,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    loopBadgeText: {
      fontSize: 9,
      fontWeight: '900',
      color: colors.mint,
      letterSpacing: 0.5,
    },
    exerciseMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 6,
      flexWrap: 'wrap',
    },
    categoryTagPill: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
    },
    categoryTagText: {
      fontSize: 10,
      fontWeight: '800',
    },
    equipmentText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textMuted,
    },
    diffPill: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    diffPillText: {
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 0.3,
    },
    exerciseCardRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
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
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: 12,
    },
    emptySubtitle: {
      fontSize: 12,
      color: colors.textDim,
      marginTop: 4,
    },
  });
