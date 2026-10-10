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
import { Colors } from '../theme/colors';
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
        <MaterialCommunityIcons name="magnify" size={20} color={Colors.textDim} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercise library..."
          placeholderTextColor={Colors.textDim}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textDim} />
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
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.exerciseCard}>
            <TouchableOpacity
              style={styles.exerciseCardLeft}
              onPress={() => setSelectedExercise(item)}
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
                onPress={() => setSelectedExercise(item)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="information-variant" size={18} color={Colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.playCircleBtn}
                onPress={() => {
                  if (onStartExercise) onStartExercise(item);
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="play" size={18} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
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
    color: '#FFFFFF',
  },
  chipScroll: {
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  chipActive: {
    backgroundColor: Colors.volt,
    borderColor: Colors.volt,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  chipTextActive: {
    color: '#000000',
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
    color: Colors.textDim,
    fontFamily: 'monospace',
    letterSpacing: 0.8,
  },
  levelChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  levelChipActive: {
    backgroundColor: Colors.volt,
    borderColor: Colors.volt,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  levelTextActive: {
    color: '#000000',
    fontWeight: '800',
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
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
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
    color: '#FFFFFF',
  },
  loopBadge: {
    backgroundColor: 'rgba(212, 255, 0, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  loopBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.volt,
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
    color: Colors.textMuted,
  },
  exerciseMetaDot: {
    fontSize: 10,
    color: Colors.textDim,
  },
  diffPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
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
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.volt,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
