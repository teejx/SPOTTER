import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';
import { ExerciseDefinition, RoutineExerciseConfig, RoutineExerciseSetTarget, WeightUnit } from '../types';
import { getClayCardStyle, getClayPillStyle, getClayInputStyle } from '../theme/clay';

interface ExerciseSetConfigModalProps {
  visible: boolean;
  exerciseConfig: RoutineExerciseConfig | null;
  exerciseDefinition?: ExerciseDefinition | null;
  onClose: () => void;
  onSave: (updated: RoutineExerciseConfig) => void;
}

export const ExerciseSetConfigModal: React.FC<ExerciseSetConfigModalProps> = ({
  visible,
  exerciseConfig,
  exerciseDefinition,
  onClose,
  onSave,
}) => {
  const { colors, isDark, currentUser } = useFitness();
  const activeUser = currentUser;
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 0
  );

  // Configuration State
  const [targetSets, setTargetSets] = useState(3);
  const [repsMode, setRepsMode] = useState<'flat' | 'range'>('range');
  const [weightMode, setWeightMode] = useState<'uniform' | 'individual'>('uniform');
  const [defaultWeight, setDefaultWeight] = useState(0);
  const [weightText, setWeightText] = useState('0');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');

  // Master Rep Targets
  const [masterFlatReps, setMasterFlatReps] = useState(10);
  const [masterMinReps, setMasterMinReps] = useState(6);
  const [masterMaxReps, setMasterMaxReps] = useState(10);

  // Per-set individual targets
  const [setTargets, setSetTargets] = useState<RoutineExerciseSetTarget[]>([]);
  // String buffer for set weights
  const [setWeightTexts, setSetWeightTexts] = useState<Record<number, string>>({});

  // Initialize state when modal opens
  useEffect(() => {
    if (visible && exerciseConfig) {
      const setsCount = Math.max(1, exerciseConfig.targetSets || 3);
      setTargetSets(setsCount);

      // Determine initial reps mode
      const hasRange = !!exerciseConfig.repRange || (exerciseConfig.minReps !== undefined && exerciseConfig.maxReps !== undefined);
      const mode = exerciseConfig.repsMode || (hasRange ? 'range' : 'flat');
      setRepsMode(mode);

      // Parse existing range if present (e.g. "6–10" or "8-12")
      let minR = exerciseConfig.minReps || 6;
      let maxR = exerciseConfig.maxReps || 10;
      if (exerciseConfig.repRange) {
        const parts = exerciseConfig.repRange.replace(/[^0-9–-]/g, '').split(/[–-]/);
        if (parts.length >= 2) {
          const pMin = parseInt(parts[0], 10);
          const pMax = parseInt(parts[1], 10);
          if (!isNaN(pMin) && pMin > 0) minR = pMin;
          if (!isNaN(pMax) && pMax >= minR) maxR = pMax;
        }
      }
      setMasterMinReps(minR);
      setMasterMaxReps(maxR);
      setMasterFlatReps(exerciseConfig.targetReps || 10);

      const dWeight = exerciseConfig.defaultWeight || 0;
      setDefaultWeight(dWeight);
      setWeightText(dWeight > 0 ? String(dWeight) : '0');
      setWeightUnit(exerciseConfig.weightUnit || activeUser?.weightUnit || 'kg');
      setWeightMode(exerciseConfig.weightMode || 'uniform');

      // Initialize individual set rows
      const existingSets = exerciseConfig.setTargets || [];
      const initializedSets: RoutineExerciseSetTarget[] = Array.from({ length: setsCount }, (_, i) => {
        const existing = existingSets.find((st) => st.setNumber === i + 1);
        if (existing) {
          return {
            setNumber: i + 1,
            repsMode: existing.repsMode || mode,
            reps: existing.reps || exerciseConfig.targetReps || 10,
            minReps: existing.minReps || minR,
            maxReps: existing.maxReps || maxR,
            repRange: existing.repRange || `${minR}–${maxR}`,
            weight: existing.weight !== undefined ? existing.weight : dWeight,
          };
        }
        return {
          setNumber: i + 1,
          repsMode: mode,
          reps: exerciseConfig.targetReps || 10,
          minReps: minR,
          maxReps: maxR,
          repRange: `${minR}–${maxR}`,
          weight: dWeight,
        };
      });
      setSetTargets(initializedSets);

      const initWeightTexts: Record<number, string> = {};
      initializedSets.forEach((st) => {
        initWeightTexts[st.setNumber] = st.weight !== undefined && st.weight > 0 ? String(st.weight) : '0';
      });
      setSetWeightTexts(initWeightTexts);
    }
  }, [visible, exerciseConfig]);

  if (!visible || !exerciseConfig) return null;

  // Handle set count changes
  const handleUpdateSetsCount = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newCount = Math.max(1, Math.min(20, targetSets + delta));
    setTargetSets(newCount);

    setSetTargets((prev) => {
      if (newCount > prev.length) {
        // Add new sets copying master values
        const toAdd = Array.from({ length: newCount - prev.length }, (_, idx) => {
          const setNum = prev.length + idx + 1;
          return {
            setNumber: setNum,
            repsMode,
            reps: masterFlatReps,
            minReps: masterMinReps,
            maxReps: masterMaxReps,
            repRange: `${masterMinReps}–${masterMaxReps}`,
            weight: defaultWeight,
          };
        });
        return [...prev, ...toAdd];
      } else {
        return prev.slice(0, newCount);
      }
    });
  };

  // Toggle unit
  const handleToggleUnit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextUnit: WeightUnit = weightUnit === 'kg' ? 'lbs' : 'kg';
    setWeightUnit(nextUnit);
  };

  // Apply quick range presets to master and all sets
  const handleApplyQuickRange = (min: number, max: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMasterMinReps(min);
    setMasterMaxReps(max);
    setRepsMode('range');

    setSetTargets((prev) =>
      prev.map((s) => ({
        ...s,
        repsMode: 'range',
        minReps: min,
        maxReps: max,
        repRange: `${min}–${max}`,
      }))
    );
  };

  // Apply quick flat reps
  const handleApplyQuickFlat = (reps: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMasterFlatReps(reps);
    setRepsMode('flat');

    setSetTargets((prev) =>
      prev.map((s) => ({
        ...s,
        repsMode: 'flat',
        reps,
      }))
    );
  };

  // Switch Reps Mode (Flat vs Range)
  const handleSwitchRepsMode = (mode: 'flat' | 'range') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRepsMode(mode);
    setSetTargets((prev) =>
      prev.map((s) => ({
        ...s,
        repsMode: mode,
      }))
    );
  };

  // Switch Weight Mode (Uniform vs Individual)
  const handleSwitchWeightMode = (mode: 'uniform' | 'individual') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWeightMode(mode);
    if (mode === 'uniform') {
      // Sync all sets to master weight
      setSetTargets((prev) =>
        prev.map((s) => ({
          ...s,
          weight: defaultWeight,
        }))
      );
      setSetWeightTexts((prev) => {
        const next: Record<number, string> = {};
        setTargets.forEach((st) => {
          next[st.setNumber] = String(defaultWeight);
        });
        return next;
      });
    }
  };

  // Update a single set's reps (flat mode)
  const handleUpdateSetReps = (setNum: number, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSetTargets((prev) =>
      prev.map((s) => {
        if (s.setNumber !== setNum) return s;
        const current = s.reps || masterFlatReps;
        const nextVal = Math.max(1, Math.min(100, current + delta));
        return { ...s, reps: nextVal };
      })
    );
  };

  // Update a single set's min or max reps (range mode)
  const handleUpdateSetRange = (setNum: number, field: 'min' | 'max', delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSetTargets((prev) =>
      prev.map((s) => {
        if (s.setNumber !== setNum) return s;
        let min = s.minReps !== undefined ? s.minReps : masterMinReps;
        let max = s.maxReps !== undefined ? s.maxReps : masterMaxReps;

        if (field === 'min') {
          min = Math.max(1, Math.min(max, min + delta));
        } else {
          max = Math.max(min, Math.min(100, max + delta));
        }
        return {
          ...s,
          minReps: min,
          maxReps: max,
          repRange: `${min}–${max}`,
        };
      })
    );
  };

  // Set-specific typed min/max inputs
  const handleSetRangeInput = (setNum: number, field: 'min' | 'max', text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    const num = parseInt(clean, 10);
    setSetTargets((prev) =>
      prev.map((s) => {
        if (s.setNumber !== setNum) return s;
        let min = s.minReps !== undefined ? s.minReps : masterMinReps;
        let max = s.maxReps !== undefined ? s.maxReps : masterMaxReps;
        if (field === 'min') {
          min = isNaN(num) ? 1 : num;
        } else {
          max = isNaN(num) ? min : num;
        }
        return {
          ...s,
          minReps: min,
          maxReps: max,
          repRange: `${min}–${max}`,
        };
      })
    );
  };

  // Update individual set weight
  const handleSetWeightChange = (setNum: number, txt: string) => {
    const clean = txt.replace(/[^0-9.]/g, '');
    const parts = clean.split('.');
    const sanitized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : clean;
    setSetWeightTexts((prev) => ({ ...prev, [setNum]: sanitized }));
    const parsed = parseFloat(sanitized);
    setSetTargets((prev) =>
      prev.map((s) => (s.setNumber === setNum ? { ...s, weight: isNaN(parsed) ? 0 : parsed } : s))
    );
  };

  // Save and apply changes
  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Compute effective representative repRange and targetReps
    const repRangeString =
      repsMode === 'range' ? `${masterMinReps}–${masterMaxReps}` : undefined;
    const finalTargetReps = repsMode === 'flat' ? masterFlatReps : masterMinReps;

    const updatedConfig: RoutineExerciseConfig = {
      ...exerciseConfig,
      targetSets,
      repsMode,
      targetReps: finalTargetReps,
      minReps: repsMode === 'range' ? masterMinReps : undefined,
      maxReps: repsMode === 'range' ? masterMaxReps : undefined,
      repRange: repRangeString,
      weightMode,
      defaultWeight,
      weightUnit,
      setTargets,
    };

    onSave(updatedConfig);
    onClose();
  };

  const exerciseName = exerciseConfig.exerciseName || exerciseDefinition?.name || 'Exercise';
  const category = exerciseDefinition?.category || 'Strength';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* Top Header */}
          <View style={[styles.header, { paddingTop: topInset + 8 }]}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MaterialCommunityIcons name="chevron-down" size={28} color={colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.headerTitleCol}>
              <Text style={styles.headerEyebrow}>SET CONFIGURATOR</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {exerciseName}
              </Text>
            </View>

            <TouchableOpacity style={styles.headerSavePill} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.headerSavePillText}>APPLY</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Exercise Hero Card */}
            <View style={styles.exerciseHeroCard}>
              <View style={styles.heroLeft}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{category.toUpperCase()}</Text>
                </View>
                <Text style={styles.heroExerciseName}>{exerciseName}</Text>
                <Text style={styles.heroSubtitle}>
                  {targetSets} Sets • {repsMode === 'range' ? `${masterMinReps}–${masterMaxReps} Reps` : `${masterFlatReps} Reps`} • {defaultWeight} {weightUnit.toUpperCase()}
                </Text>
              </View>

              {exerciseDefinition?.exerciseDbGifUrl ? (
                <View style={styles.heroThumbnailBox}>
                  <Image
                    source={{ uri: exerciseDefinition.exerciseDbGifUrl }}
                    style={styles.heroThumbnail}
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <View style={styles.heroIconBox}>
                  <MaterialCommunityIcons name="dumbbell" size={28} color={colors.accent} />
                </View>
              )}
            </View>

            {/* Quick Presets / Global Target Controls */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <MaterialCommunityIcons name="tune" size={16} color={colors.accent} />
                <Text style={styles.sectionTitle}>ROUTINE TARGETS</Text>
              </View>

              {/* Total Sets Counter (Big Touch Targets) */}
              <View style={styles.settingRow}>
                <View>
                  <Text style={styles.settingLabel}>NUMBER OF SETS</Text>
                  <Text style={styles.settingSub}>Total working sets for this exercise</Text>
                </View>

                <View style={styles.largeStepper}>
                  <TouchableOpacity
                    style={styles.largeStepBtn}
                    onPress={() => handleUpdateSetsCount(-1)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="minus" size={20} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={styles.largeStepVal}>{targetSets}</Text>
                  <TouchableOpacity
                    style={styles.largeStepBtn}
                    onPress={() => handleUpdateSetsCount(1)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="plus" size={20} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Reps Format Toggle: Flat vs Range */}
              <View style={styles.toggleSegmentContainer}>
                <Text style={styles.settingLabel}>REPS FORMAT</Text>
                <View style={styles.segmentedControl}>
                  <TouchableOpacity
                    style={[
                      styles.segmentBtn,
                      repsMode === 'flat' && styles.segmentBtnActive,
                    ]}
                    onPress={() => handleSwitchRepsMode('flat')}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name="numeric"
                      size={16}
                      color={repsMode === 'flat' ? colors.accentContrastText : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.segmentBtnText,
                        repsMode === 'flat' && styles.segmentBtnTextActive,
                      ]}
                    >
                      FLAT REPS
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.segmentBtn,
                      repsMode === 'range' && styles.segmentBtnActive,
                    ]}
                    onPress={() => handleSwitchRepsMode('range')}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name="arrow-expand-horizontal"
                      size={16}
                      color={repsMode === 'range' ? colors.accentContrastText : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.segmentBtnText,
                        repsMode === 'range' && styles.segmentBtnTextActive,
                      ]}
                    >
                      RANGE REPS (MIN – MAX)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Master Rep Target Controls */}
              {repsMode === 'range' ? (
                <View style={styles.masterRangeContainer}>
                  <Text style={styles.fieldSectionLabel}>DEFAULT TARGET RANGE</Text>
                  <View style={styles.rangeSplitRow}>
                    {/* Min Reps Field */}
                    <View style={styles.rangeFieldBox}>
                      <Text style={styles.rangeFieldTag}>MIN REPS</Text>
                      <View style={styles.rangeInputWrapper}>
                        <TouchableOpacity
                          style={styles.miniStepBtn}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            const nextMin = Math.max(1, masterMinReps - 1);
                            setMasterMinReps(nextMin);
                            setSetTargets((prev) =>
                              prev.map((s) => ({ ...s, minReps: nextMin, repRange: `${nextMin}–${masterMaxReps}` }))
                            );
                          }}
                        >
                          <MaterialCommunityIcons name="minus" size={14} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <TextInput
                          style={styles.rangeInputText}
                          keyboardType="number-pad"
                          value={String(masterMinReps)}
                          onChangeText={(txt) => {
                            const n = parseInt(txt.replace(/[^0-9]/g, ''), 10);
                            const val = isNaN(n) ? 1 : n;
                            setMasterMinReps(val);
                            setSetTargets((prev) =>
                              prev.map((s) => ({ ...s, minReps: val, repRange: `${val}–${masterMaxReps}` }))
                            );
                          }}
                        />
                        <TouchableOpacity
                          style={styles.miniStepBtn}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            const nextMin = Math.min(masterMaxReps, masterMinReps + 1);
                            setMasterMinReps(nextMin);
                            setSetTargets((prev) =>
                              prev.map((s) => ({ ...s, minReps: nextMin, repRange: `${nextMin}–${masterMaxReps}` }))
                            );
                          }}
                        >
                          <MaterialCommunityIcons name="plus" size={14} color={colors.textPrimary} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Range Divider Dash */}
                    <View style={styles.rangeDividerBadge}>
                      <Text style={styles.rangeDividerText}>—</Text>
                    </View>

                    {/* Max Reps Field */}
                    <View style={styles.rangeFieldBox}>
                      <Text style={styles.rangeFieldTag}>MAX REPS</Text>
                      <View style={styles.rangeInputWrapper}>
                        <TouchableOpacity
                          style={styles.miniStepBtn}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            const nextMax = Math.max(masterMinReps, masterMaxReps - 1);
                            setMasterMaxReps(nextMax);
                            setSetTargets((prev) =>
                              prev.map((s) => ({ ...s, maxReps: nextMax, repRange: `${masterMinReps}–${nextMax}` }))
                            );
                          }}
                        >
                          <MaterialCommunityIcons name="minus" size={14} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <TextInput
                          style={styles.rangeInputText}
                          keyboardType="number-pad"
                          value={String(masterMaxReps)}
                          onChangeText={(txt) => {
                            const n = parseInt(txt.replace(/[^0-9]/g, ''), 10);
                            const val = isNaN(n) ? masterMinReps : n;
                            setMasterMaxReps(val);
                            setSetTargets((prev) =>
                              prev.map((s) => ({ ...s, maxReps: val, repRange: `${masterMinReps}–${val}` }))
                            );
                          }}
                        />
                        <TouchableOpacity
                          style={styles.miniStepBtn}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            const nextMax = Math.min(100, masterMaxReps + 1);
                            setMasterMaxReps(nextMax);
                            setSetTargets((prev) =>
                              prev.map((s) => ({ ...s, maxReps: nextMax, repRange: `${masterMinReps}–${nextMax}` }))
                            );
                          }}
                        >
                          <MaterialCommunityIcons name="plus" size={14} color={colors.textPrimary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Range Quick Preset Chips */}
                  <View style={styles.quickPresetRow}>
                    {[
                      { min: 6, max: 10, label: '6–10' },
                      { min: 8, max: 12, label: '8–12' },
                      { min: 10, max: 15, label: '10–15' },
                      { min: 12, max: 20, label: '12–20' },
                    ].map((preset) => {
                      const isSelected = masterMinReps === preset.min && masterMaxReps === preset.max;
                      return (
                        <TouchableOpacity
                          key={preset.label}
                          style={[styles.presetChip, isSelected && styles.presetChipActive]}
                          onPress={() => handleApplyQuickRange(preset.min, preset.max)}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.presetChipText,
                              isSelected && styles.presetChipTextActive,
                            ]}
                          >
                            {preset.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <View style={styles.masterFlatContainer}>
                  <Text style={styles.fieldSectionLabel}>DEFAULT TARGET REPS</Text>
                  <View style={styles.flatInputRow}>
                    <TouchableOpacity
                      style={styles.largeStepBtn}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        const next = Math.max(1, masterFlatReps - 1);
                        setMasterFlatReps(next);
                        setSetTargets((prev) => prev.map((s) => ({ ...s, reps: next })));
                      }}
                    >
                      <MaterialCommunityIcons name="minus" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.flatInputText}
                      keyboardType="number-pad"
                      value={String(masterFlatReps)}
                      onChangeText={(txt) => {
                        const n = parseInt(txt.replace(/[^0-9]/g, ''), 10);
                        const val = isNaN(n) ? 1 : n;
                        setMasterFlatReps(val);
                        setSetTargets((prev) => prev.map((s) => ({ ...s, reps: val })));
                      }}
                    />
                    <TouchableOpacity
                      style={styles.largeStepBtn}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        const next = Math.min(100, masterFlatReps + 1);
                        setMasterFlatReps(next);
                        setSetTargets((prev) => prev.map((s) => ({ ...s, reps: next })));
                      }}
                    >
                      <MaterialCommunityIcons name="plus" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  {/* Flat Presets */}
                  <View style={styles.quickPresetRow}>
                    {[5, 8, 10, 12, 15].map((repVal) => {
                      const isSelected = masterFlatReps === repVal;
                      return (
                        <TouchableOpacity
                          key={repVal}
                          style={[styles.presetChip, isSelected && styles.presetChipActive]}
                          onPress={() => handleApplyQuickFlat(repVal)}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.presetChipText,
                              isSelected && styles.presetChipTextActive,
                            ]}
                          >
                            {repVal} Reps
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Weight Strategy Toggle & Master Weight Input */}
              <View style={styles.weightSectionDivider} />

              <View style={styles.toggleSegmentContainer}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.settingLabel}>WEIGHT DISTRIBUTION</Text>
                  <TouchableOpacity
                    style={styles.unitToggleBtn}
                    onPress={handleToggleUnit}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.unitToggleText}>{weightUnit.toUpperCase()}</Text>
                    <MaterialCommunityIcons name="swap-horizontal" size={12} color={colors.accent} />
                  </TouchableOpacity>
                </View>

                <View style={styles.segmentedControl}>
                  <TouchableOpacity
                    style={[
                      styles.segmentBtn,
                      weightMode === 'uniform' && styles.segmentBtnActive,
                    ]}
                    onPress={() => handleSwitchWeightMode('uniform')}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name="equal"
                      size={15}
                      color={weightMode === 'uniform' ? colors.accentContrastText : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.segmentBtnText,
                        weightMode === 'uniform' && styles.segmentBtnTextActive,
                      ]}
                    >
                      SAME FOR ALL SETS
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.segmentBtn,
                      weightMode === 'individual' && styles.segmentBtnActive,
                    ]}
                    onPress={() => handleSwitchWeightMode('individual')}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name="layers-outline"
                      size={15}
                      color={weightMode === 'individual' ? colors.accentContrastText : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.segmentBtnText,
                        weightMode === 'individual' && styles.segmentBtnTextActive,
                      ]}
                    >
                      CUSTOM PER SET
                    </Text>
                  </TouchableOpacity>
                </View>

                {weightMode === 'uniform' && (
                  <View style={styles.uniformWeightInputRow}>
                    <Text style={styles.uniformWeightPrompt}>SET WEIGHT FOR ALL SETS:</Text>
                    <View style={styles.uniformWeightBox}>
                      <TextInput
                        style={styles.uniformWeightTextInput}
                        keyboardType="decimal-pad"
                        value={weightText}
                        onChangeText={(txt) => {
                          const clean = txt.replace(/[^0-9.]/g, '');
                          const parts = clean.split('.');
                          const sanitized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : clean;
                          setWeightText(sanitized);
                          const parsed = parseFloat(sanitized);
                          const val = isNaN(parsed) ? 0 : parsed;
                          setDefaultWeight(val);
                          setSetTargets((prev) => prev.map((s) => ({ ...s, weight: val })));
                        }}
                        placeholder="0"
                        placeholderTextColor={colors.textDim}
                      />
                      <Text style={styles.uniformWeightUnitTag}>{weightUnit.toUpperCase()}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Individual Sets Section */}
            <View style={styles.individualSetsHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="format-list-numbered" size={16} color={colors.accent} />
                <Text style={styles.individualSectionTitle}>
                  CUSTOMIZE INDIVIDUAL SETS ({setTargets.length})
                </Text>
              </View>
              <Text style={styles.individualSectionSubtitle}>
                {repsMode === 'range' ? 'Fine-tune rep ranges & weights' : 'Fine-tune reps & weights'}
              </Text>
            </View>

            {/* Set Rows Cards */}
            {setTargets.map((set, idx) => {
              const setNum = set.setNumber;
              const isRange = repsMode === 'range';
              const setMin = set.minReps !== undefined ? set.minReps : masterMinReps;
              const setMax = set.maxReps !== undefined ? set.maxReps : masterMaxReps;
              const setReps = set.reps !== undefined ? set.reps : masterFlatReps;
              const setWeightVal =
                weightMode === 'uniform'
                  ? defaultWeight
                  : set.weight !== undefined
                  ? set.weight
                  : defaultWeight;

              return (
                <View key={`set-card-${setNum}`} style={styles.setCard}>
                  {/* Set Card Header */}
                  <View style={styles.setCardHeader}>
                    <View style={styles.setBadge}>
                      <Text style={styles.setBadgeText}>SET {String(setNum).padStart(2, '0')}</Text>
                    </View>
                    <Text style={styles.setCardSummary}>
                      {isRange ? `Target: ${setMin}–${setMax} Reps` : `Target: ${setReps} Reps`}
                      {weightMode === 'uniform' ? ` • ${defaultWeight} ${weightUnit}` : ''}
                    </Text>
                  </View>

                  {/* Set Body: Range split (field) - (field) or Single flat input */}
                  <View style={styles.setCardBody}>
                    {isRange ? (
                      <View style={styles.setRangeSplitRow}>
                        {/* Min Reps Field */}
                        <View style={styles.setSplitCol}>
                          <Text style={styles.setSplitTag}>MIN REPS</Text>
                          <View style={styles.setSplitInputBox}>
                            <TouchableOpacity
                              style={styles.setSplitStepBtn}
                              onPress={() => handleUpdateSetRange(setNum, 'min', -1)}
                              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            >
                              <MaterialCommunityIcons name="minus" size={16} color={colors.textPrimary} />
                            </TouchableOpacity>
                            <TextInput
                              style={styles.setSplitInput}
                              keyboardType="number-pad"
                              value={String(setMin)}
                              onChangeText={(txt) => handleSetRangeInput(setNum, 'min', txt)}
                            />
                            <TouchableOpacity
                              style={styles.setSplitStepBtn}
                              onPress={() => handleUpdateSetRange(setNum, 'min', 1)}
                              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            >
                              <MaterialCommunityIcons name="plus" size={16} color={colors.textPrimary} />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Visual Range Divider Dash */}
                        <View style={styles.setSplitDashBox}>
                          <Text style={styles.setSplitDashText}>—</Text>
                        </View>

                        {/* Max Reps Field */}
                        <View style={styles.setSplitCol}>
                          <Text style={styles.setSplitTag}>MAX REPS</Text>
                          <View style={styles.setSplitInputBox}>
                            <TouchableOpacity
                              style={styles.setSplitStepBtn}
                              onPress={() => handleUpdateSetRange(setNum, 'max', -1)}
                              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            >
                              <MaterialCommunityIcons name="minus" size={16} color={colors.textPrimary} />
                            </TouchableOpacity>
                            <TextInput
                              style={styles.setSplitInput}
                              keyboardType="number-pad"
                              value={String(setMax)}
                              onChangeText={(txt) => handleSetRangeInput(setNum, 'max', txt)}
                            />
                            <TouchableOpacity
                              style={styles.setSplitStepBtn}
                              onPress={() => handleUpdateSetRange(setNum, 'max', 1)}
                              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            >
                              <MaterialCommunityIcons name="plus" size={16} color={colors.textPrimary} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.setFlatRow}>
                        <Text style={styles.setSplitTag}>TARGET REPS</Text>
                        <View style={styles.setFlatStepper}>
                          <TouchableOpacity
                            style={styles.setSplitStepBtn}
                            onPress={() => handleUpdateSetReps(setNum, -1)}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <MaterialCommunityIcons name="minus" size={16} color={colors.textPrimary} />
                          </TouchableOpacity>
                          <Text style={styles.setFlatValText}>{setReps}</Text>
                          <TouchableOpacity
                            style={styles.setSplitStepBtn}
                            onPress={() => handleUpdateSetReps(setNum, 1)}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <MaterialCommunityIcons name="plus" size={16} color={colors.textPrimary} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {/* Weight Input (Visible if individual weight mode) */}
                    {weightMode === 'individual' && (
                      <View style={styles.setIndividualWeightRow}>
                        <Text style={styles.setSplitTag}>SET WEIGHT ({weightUnit.toUpperCase()})</Text>
                        <View style={styles.setWeightInputBox}>
                          <TextInput
                            style={styles.setWeightTextInput}
                            keyboardType="decimal-pad"
                            value={
                              setWeightTexts[setNum] !== undefined
                                ? setWeightTexts[setNum]
                                : (setWeightVal > 0 ? String(setWeightVal) : '')
                            }
                            onChangeText={(txt) => handleSetWeightChange(setNum, txt)}
                            placeholder="0"
                            placeholderTextColor={colors.textDim}
                          />
                          <Text style={styles.setWeightUnitSuffix}>{weightUnit.toUpperCase()}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Floating Bottom Apply CTA */}
          <View
            style={[
              styles.bottomCtaContainer,
              { paddingBottom: Math.max(16, insets.bottom || 0) },
            ]}
          >
            <TouchableOpacity style={styles.applyBtn} onPress={handleSave} activeOpacity={0.85}>
              <MaterialCommunityIcons name="check-bold" size={18} color={colors.accentContrastText} />
              <Text style={styles.applyBtnText}>APPLY SETS & TARGETS</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
      backgroundColor: colors.surface,
    },
    closeBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: colors.surfaceRaised,
    },
    headerTitleCol: {
      flex: 1,
      marginHorizontal: 12,
    },
    headerEyebrow: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.accent,
      fontFamily: 'monospace',
      letterSpacing: 0.8,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.textPrimary,
      marginTop: 2,
    },
    headerSavePill: {
      backgroundColor: colors.accent,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
    },
    headerSavePillText: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.accentContrastText,
      fontFamily: 'monospace',
      letterSpacing: 0.5,
    },
    container: {
      flex: 1,
    },
    content: {
      padding: 16,
      paddingBottom: 120,
      gap: 16,
    },
    exerciseHeroCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceRaised,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    heroLeft: {
      flex: 1,
      paddingRight: 12,
    },
    categoryBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.accentSubtle,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      marginBottom: 6,
    },
    categoryBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.accent,
      fontFamily: 'monospace',
      letterSpacing: 0.5,
    },
    heroExerciseName: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    heroSubtitle: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: 'monospace',
      fontWeight: '600',
      marginTop: 4,
    },
    heroThumbnailBox: {
      width: 68,
      height: 68,
      borderRadius: 14,
      overflow: 'hidden',
      backgroundColor: '#000',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    heroThumbnail: {
      width: '100%',
      height: '100%',
    },
    heroIconBox: {
      width: 68,
      height: 68,
      borderRadius: 14,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    sectionCard: {
      ...getClayCardStyle(isDark, colors.surface, 22),
      padding: 16,
      borderColor: colors.surfaceBorder,
      gap: 14,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceBorder,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: 'monospace',
      letterSpacing: 0.6,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    settingLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: 'monospace',
      letterSpacing: 0.5,
    },
    settingSub: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    largeStepper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceRaised,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingHorizontal: 6,
      paddingVertical: 4,
      gap: 8,
    },
    largeStepBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    largeStepVal: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.textPrimary,
      fontFamily: 'monospace',
      minWidth: 32,
      textAlign: 'center',
    },
    toggleSegmentContainer: {
      gap: 8,
    },
    segmentedControl: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceRaised,
      borderRadius: 16,
      padding: 4,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
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
      ...getClayPillStyle(colors.accent, 12),
    },
    segmentBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      fontFamily: 'monospace',
      letterSpacing: 0.3,
    },
    segmentBtnTextActive: {
      color: colors.accentContrastText,
      fontWeight: '900',
    },
    fieldSectionLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textMuted,
      fontFamily: 'monospace',
      letterSpacing: 0.5,
      marginTop: 4,
    },
    masterRangeContainer: {
      gap: 8,
      backgroundColor: colors.surfaceRaised,
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    rangeSplitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    rangeFieldBox: {
      flex: 1,
      gap: 4,
    },
    rangeFieldTag: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.textDim,
      fontFamily: 'monospace',
      textAlign: 'center',
    },
    rangeInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingHorizontal: 4,
      paddingVertical: 3,
    },
    miniStepBtn: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: colors.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rangeInputText: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.textPrimary,
      fontFamily: 'monospace',
      textAlign: 'center',
      minWidth: 36,
      padding: 0,
    },
    rangeDividerBadge: {
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 14,
    },
    rangeDividerText: {
      fontSize: 22,
      fontWeight: '900',
      color: colors.accent,
      fontFamily: 'monospace',
    },
    quickPresetRow: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 6,
    },
    presetChip: {
      flex: 1,
      paddingVertical: 7,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    presetChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    presetChipText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      fontFamily: 'monospace',
    },
    presetChipTextActive: {
      color: colors.accentContrastText,
      fontWeight: '900',
    },
    masterFlatContainer: {
      gap: 8,
      backgroundColor: colors.surfaceRaised,
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    flatInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
    flatInputText: {
      fontSize: 26,
      fontWeight: '900',
      color: colors.textPrimary,
      fontFamily: 'monospace',
      textAlign: 'center',
      minWidth: 60,
    },
    weightSectionDivider: {
      height: 1,
      backgroundColor: colors.surfaceBorder,
      marginVertical: 4,
    },
    unitToggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accentSubtle,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      gap: 4,
    },
    unitToggleText: {
      fontSize: 10,
      fontWeight: '900',
      color: colors.accent,
      fontFamily: 'monospace',
    },
    uniformWeightInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceRaised,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginTop: 4,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    uniformWeightPrompt: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textMuted,
      fontFamily: 'monospace',
    },
    uniformWeightBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingHorizontal: 10,
      paddingVertical: 4,
      gap: 4,
    },
    uniformWeightTextInput: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.textPrimary,
      fontFamily: 'monospace',
      minWidth: 46,
      textAlign: 'right',
      padding: 0,
    },
    uniformWeightUnitTag: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accent,
      fontFamily: 'monospace',
    },
    individualSetsHeaderRow: {
      marginTop: 8,
      marginBottom: 2,
    },
    individualSectionTitle: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.textPrimary,
      fontFamily: 'monospace',
      letterSpacing: 0.6,
    },
    individualSectionSubtitle: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    setCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      gap: 10,
    },
    setCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceBorder,
    },
    setBadge: {
      backgroundColor: colors.surfaceRaised,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    setBadgeText: {
      fontSize: 11,
      fontWeight: '900',
      color: colors.accent,
      fontFamily: 'monospace',
    },
    setCardSummary: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      fontFamily: 'monospace',
    },
    setCardBody: {
      gap: 10,
    },
    setRangeSplitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    setSplitCol: {
      flex: 1,
      gap: 4,
    },
    setSplitTag: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.textDim,
      fontFamily: 'monospace',
      marginBottom: 2,
    },
    setSplitInputBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceRaised,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingHorizontal: 4,
      paddingVertical: 4,
    },
    setSplitStepBtn: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    setSplitInput: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.textPrimary,
      fontFamily: 'monospace',
      textAlign: 'center',
      minWidth: 36,
      padding: 0,
    },
    setSplitDashBox: {
      paddingHorizontal: 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
    },
    setSplitDashText: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.accent,
      fontFamily: 'monospace',
    },
    setFlatRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    setFlatStepper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceRaised,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingHorizontal: 4,
      paddingVertical: 4,
      gap: 12,
    },
    setFlatValText: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.textPrimary,
      fontFamily: 'monospace',
      minWidth: 36,
      textAlign: 'center',
    },
    setIndividualWeightRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.surfaceBorder,
    },
    setWeightInputBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceRaised,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingHorizontal: 10,
      paddingVertical: 4,
      gap: 4,
    },
    setWeightTextInput: {
      fontSize: 15,
      fontWeight: '900',
      color: colors.textPrimary,
      fontFamily: 'monospace',
      minWidth: 50,
      textAlign: 'right',
      padding: 0,
    },
    setWeightUnitSuffix: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.accent,
      fontFamily: 'monospace',
    },
    bottomCtaContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      paddingTop: 12,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
    },
    applyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      ...getClayPillStyle(colors.accent, 18),
      paddingVertical: 14,
      gap: 8,
    },
    applyBtnText: {
      fontSize: 14,
      fontWeight: '900',
      color: colors.accentContrastText,
      fontFamily: 'monospace',
      letterSpacing: 0.5,
    },
  });
