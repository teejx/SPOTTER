import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { EXERCISE_DATABASE } from '../lib/exercises';
import { ExerciseDefinition, MuscleGroup } from '../types';

interface ExercisePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: ExerciseDefinition) => void;
  selectedIds?: string[];
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
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | MuscleGroup>('All');

  const filtered = EXERCISE_DATABASE.filter((ex) => {
    const matchCat = activeCategory === 'All' || ex.category === activeCategory;
    const matchSearch =
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.equipment.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Add Exercise</Text>
            <Text style={styles.headerSubtitle}>Choose from {EXERCISE_DATABASE.length} movements</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color={Colors.textDim} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises or equipment..."
            placeholderTextColor={Colors.textDim}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textDim} />
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
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isAlreadyAdded = selectedIds.includes(item.id);
            return (
              <TouchableOpacity
                style={[styles.exerciseCard, isAlreadyAdded && styles.exerciseCardSelected]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <View style={styles.exerciseCardLeft}>
                  <View style={styles.exerciseCardIcon}>
                    <MaterialCommunityIcons name="dumbbell" size={20} color={Colors.volt} />
                  </View>
                  <View>
                    <Text style={styles.exerciseName}>{item.name}</Text>
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

                <MaterialCommunityIcons
                  name={isAlreadyAdded ? 'check-circle' : 'plus-circle-outline'}
                  size={24}
                  color={isAlreadyAdded ? Colors.volt : Colors.textMuted}
                />
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
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
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignSelf: 'center',
  },
  categoryChipActive: {
    backgroundColor: Colors.volt,
    borderColor: Colors.volt,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  categoryChipTextActive: {
    color: '#000000',
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
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  exerciseCardSelected: {
    borderColor: Colors.volt,
    backgroundColor: Colors.voltSubtle,
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
    backgroundColor: Colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  exerciseBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  badgeText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  badgeDot: {
    fontSize: 10,
    color: Colors.textDim,
  },
});
