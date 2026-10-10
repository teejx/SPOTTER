import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Keyboard,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';

interface LogWalkModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LogWalkModal: React.FC<LogWalkModalProps> = ({ visible, onClose }) => {
  const { logWalk, activeUser, colors, isDark } = useFitness();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const scrollRef = useRef<ScrollView>(null);
  const activeFieldRef = useRef<'title' | 'grid' | 'notes' | null>(null);

  const [title, setTitle] = useState('Outdoor Walk');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [steps, setSteps] = useState('3500');
  const [distanceKm, setDistanceKm] = useState('2.5');
  const [caloriesBurned, setCaloriesBurned] = useState('140');
  const [notes, setNotes] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(() => {
          if (activeFieldRef.current === 'notes') {
            scrollRef.current?.scrollToEnd({ animated: true });
          } else if (activeFieldRef.current === 'grid') {
            scrollRef.current?.scrollTo({ y: 100, animated: true });
          }
        }, 100);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        activeFieldRef.current = null;
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Auto-calculate estimate helper when steps change
  const handleEstimate = () => {
    const s = parseInt(steps, 10) || 0;
    const mins = parseInt(durationMinutes, 10) || 30;
    const weight = activeUser?.bodyWeight || 70;

    // Standard walking step length approx 0.762 meters (0.000762 km/step)
    const estDistance = s > 0 ? (s * 0.000762).toFixed(2) : ((mins * 5.0) / 60).toFixed(2);
    // Walking MET approx 3.5: Calories = MET * 3.5 * weightKg / 200 * durationMinutes
    const estCal = Math.round((3.5 * 3.5 * weight / 200) * mins);

    setDistanceKm(estDistance);
    setCaloriesBurned(estCal.toString());
  };

  const handleSave = async () => {
    const parsedDuration = parseInt(durationMinutes, 10) || 0;
    const parsedSteps = parseInt(steps, 10) || 0;
    const parsedDistance = parseFloat(distanceKm) || 0;
    const parsedCalories = parseInt(caloriesBurned, 10) || 0;

    await logWalk({
      title: title.trim() || 'Outdoor Walk',
      date: new Date().toISOString(),
      durationMinutes: parsedDuration,
      steps: parsedSteps,
      distanceKm: parsedDistance,
      caloriesBurned: parsedCalories,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheetContainer, { marginBottom: keyboardHeight }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBadge}>
                <MaterialCommunityIcons name="walk" size={20} color={colors.accent} />
              </View>
              <View>
                <Text style={styles.headerTitle}>LOG WALKING ACTIVITY</Text>
                <Text style={styles.headerSubtitle}>Manual Step & Distance Tracking</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.scrollArea}
            contentContainerStyle={{ paddingBottom: keyboardHeight > 0 ? 32 : 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>ACTIVITY TITLE</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                onFocus={() => {
                  activeFieldRef.current = 'title';
                  setTimeout(() => {
                    scrollRef.current?.scrollTo({ y: 0, animated: true });
                  }, 100);
                }}
                onBlur={() => {
                  if (activeFieldRef.current === 'title') activeFieldRef.current = null;
                }}
                placeholder="e.g. Morning Brisk Walk"
                placeholderTextColor={colors.textDim}
              />
            </View>

            {/* Grid 2-column: Duration & Steps */}
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>DURATION (MIN)</Text>
                <View style={styles.inputWithIcon}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color={colors.accent} />
                  <TextInput
                    style={styles.iconTextInput}
                    keyboardType="numeric"
                    value={durationMinutes}
                    onChangeText={setDurationMinutes}
                    onFocus={() => {
                      activeFieldRef.current = 'grid';
                      setTimeout(() => {
                        scrollRef.current?.scrollTo({ y: 80, animated: true });
                      }, 100);
                    }}
                    onBlur={() => {
                      if (activeFieldRef.current === 'grid') activeFieldRef.current = null;
                    }}
                    placeholder="30"
                    placeholderTextColor={colors.textDim}
                  />
                </View>
              </View>

              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>STEP COUNT</Text>
                <View style={styles.inputWithIcon}>
                  <MaterialCommunityIcons name="shoe-print" size={16} color={colors.azure} />
                  <TextInput
                    style={styles.iconTextInput}
                    keyboardType="numeric"
                    value={steps}
                    onChangeText={setSteps}
                    onFocus={() => {
                      activeFieldRef.current = 'grid';
                      setTimeout(() => {
                        scrollRef.current?.scrollTo({ y: 80, animated: true });
                      }, 100);
                    }}
                    onBlur={() => {
                      if (activeFieldRef.current === 'grid') activeFieldRef.current = null;
                    }}
                    placeholder="3500"
                    placeholderTextColor={colors.textDim}
                  />
                </View>
              </View>
            </View>

            {/* Grid 2-column: Distance & Calories */}
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>DISTANCE (KM)</Text>
                <View style={styles.inputWithIcon}>
                  <MaterialCommunityIcons name="map-marker-distance" size={16} color={colors.flame} />
                  <TextInput
                    style={styles.iconTextInput}
                    keyboardType="decimal-pad"
                    value={distanceKm}
                    onChangeText={setDistanceKm}
                    onFocus={() => {
                      activeFieldRef.current = 'grid';
                      setTimeout(() => {
                        scrollRef.current?.scrollTo({ y: 120, animated: true });
                      }, 100);
                    }}
                    onBlur={() => {
                      if (activeFieldRef.current === 'grid') activeFieldRef.current = null;
                    }}
                    placeholder="2.5"
                    placeholderTextColor={colors.textDim}
                  />
                </View>
              </View>

              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>EST. KCAL</Text>
                <View style={styles.inputWithIcon}>
                  <MaterialCommunityIcons name="fire" size={16} color={colors.danger} />
                  <TextInput
                    style={styles.iconTextInput}
                    keyboardType="numeric"
                    value={caloriesBurned}
                    onChangeText={setCaloriesBurned}
                    onFocus={() => {
                      activeFieldRef.current = 'grid';
                      setTimeout(() => {
                        scrollRef.current?.scrollTo({ y: 120, animated: true });
                      }, 100);
                    }}
                    onBlur={() => {
                      if (activeFieldRef.current === 'grid') activeFieldRef.current = null;
                    }}
                    placeholder="140"
                    placeholderTextColor={colors.textDim}
                  />
                </View>
              </View>
            </View>

            {/* Auto-calculate helper button */}
            <TouchableOpacity
              style={styles.estimateButton}
              onPress={handleEstimate}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="auto-fix" size={16} color={colors.accent} />
              <Text style={styles.estimateButtonText}>
                Auto-Estimate Distance & Calories from Steps/Time
              </Text>
            </TouchableOpacity>

            {/* Notes */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>NOTES / ROUTE (OPTIONAL)</Text>
              <TextInput
                style={[styles.textInput, styles.notesInput]}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
                onFocus={() => {
                  activeFieldRef.current = 'notes';
                  setTimeout(() => {
                    scrollRef.current?.scrollToEnd({ animated: true });
                  }, 100);
                }}
                onBlur={() => {
                  if (activeFieldRef.current === 'notes') activeFieldRef.current = null;
                }}
                placeholder="Weather, incline, terrain, or how you felt..."
                placeholderTextColor={colors.textDim}
              />
            </View>

            {/* Action buttons */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="check" size={20} color={colors.accentContrastText} />
              <Text style={styles.saveButtonText}>SAVE WALKING ACTIVITY</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.65)',
      justifyContent: 'flex-end',
    },
    sheetContainer: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: colors.surfaceBorder,
      maxHeight: '90%',
      paddingBottom: 24,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 18,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceBorder,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconBadge: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: colors.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    headerTitle: {
      fontSize: 15,
      fontWeight: '900',
      color: colors.textPrimary,
      letterSpacing: 0.8,
    },
    headerSubtitle: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollArea: {
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    fieldGroup: {
      marginBottom: 16,
    },
    fieldLabel: {
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1,
      color: colors.textMuted,
      marginBottom: 6,
    },
    textInput: {
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    notesInput: {
      minHeight: 70,
      textAlignVertical: 'top',
    },
    gridRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    gridCol: {
      flex: 1,
    },
    inputWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      borderRadius: 12,
      paddingHorizontal: 12,
      gap: 8,
    },
    iconTextInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 14,
      color: colors.textPrimary,
      fontWeight: '700',
    },
    estimateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      marginBottom: 16,
    },
    estimateButtonText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent,
      paddingVertical: 15,
      borderRadius: 14,
      gap: 8,
      marginTop: 8,
    },
    saveButtonText: {
      fontSize: 13,
      fontWeight: '900',
      letterSpacing: 1,
      color: colors.accentContrastText,
    },
    cancelButton: {
      alignItems: 'center',
      paddingVertical: 12,
      marginTop: 6,
      marginBottom: 16,
    },
    cancelButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textMuted,
    },
  });
