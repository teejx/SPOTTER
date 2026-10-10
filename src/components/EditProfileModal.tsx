import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';
import { DiceBearAvatarStyle, UserProfile } from '../types';
import {
  AVATAR_ROSTER,
  AVATAR_BG_COLORS,
  AvatarRosterItem,
  getDiceBearAvatarUrl,
} from '../lib/dicebear';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ visible, onClose }) => {
  const { activeUser, updateProfile, colors, isDark } = useFitness();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [name, setName] = useState(activeUser?.name || 'Guest Athlete');
  const [bodyWeight, setBodyWeight] = useState(String(activeUser?.bodyWeight || 75));
  const [goal, setGoal] = useState(activeUser?.trainingGoal || 'Strength');
  const [selectedStyle, setSelectedStyle] = useState<DiceBearAvatarStyle>(
    activeUser?.avatarStyle || 'miniavs'
  );
  const [avatarSeed, setAvatarSeed] = useState(activeUser?.avatarSeed || 'Titan');
  const [avatarBg, setAvatarBg] = useState(activeUser?.avatarBg || '#12141F');
  const [rosterFilter, setRosterFilter] = useState<'all' | DiceBearAvatarStyle>('all');

  useEffect(() => {
    if (activeUser && visible) {
      setName(activeUser.name || 'Guest Athlete');
      setBodyWeight(String(activeUser.bodyWeight || 75));
      setGoal(activeUser.trainingGoal || 'Strength');
      setSelectedStyle(activeUser.avatarStyle || 'miniavs');
      setAvatarSeed(activeUser.avatarSeed || 'Titan');
      setAvatarBg(activeUser.avatarBg || '#12141F');
    }
  }, [activeUser, visible]);

  if (!activeUser) return null;

  const handleToggleWeightUnit = () => {
    const nextUnit = activeUser.weightUnit === 'kg' ? 'lbs' : 'kg';
    const currentWeightNum = parseFloat(bodyWeight) || activeUser.bodyWeight;
    const nextWeight =
      nextUnit === 'lbs'
        ? Math.round(currentWeightNum * 2.20462 * 10) / 10
        : Math.round((currentWeightNum / 2.20462) * 10) / 10;

    setBodyWeight(String(nextWeight));
  };

  const handleSelectCharacter = (item: AvatarRosterItem) => {
    setSelectedStyle(item.style);
    setAvatarSeed(item.seed);
  };

  const handleSave = async () => {
    const numWeight = parseFloat(bodyWeight) || activeUser.bodyWeight;
    const finalSeed = avatarSeed.trim() || 'Titan';
    const finalAvatarUrl = getDiceBearAvatarUrl(selectedStyle, finalSeed);

    await updateProfile({
      ...activeUser,
      name: name.trim() || activeUser.name,
      bodyWeight: numWeight,
      trainingGoal: goal as any,
      avatarStyle: selectedStyle,
      avatarSeed: finalSeed,
      avatarBg: avatarBg,
      avatarUrl: finalAvatarUrl,
    });

    onClose();
  };

  const goals = ['Strength', 'Hypertrophy', 'Endurance', 'Functional', 'General Fitness'];
  const previewAvatarUrl = getDiceBearAvatarUrl(selectedStyle, avatarSeed);

  const filteredRoster =
    rosterFilter === 'all'
      ? AVATAR_ROSTER
      : AVATAR_ROSTER.filter((c) => c.style === rosterFilter);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          {/* Modal Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerActionBtn}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerTitleBox}>
              <Text style={styles.headerTitle}>EDIT PROFILE & AVATAR</Text>
              <Text style={styles.headerSubtitle}>Customize your athlete persona</Text>
            </View>
            <TouchableOpacity onPress={handleSave} style={styles.saveHeaderBtn}>
              <Text style={styles.saveHeaderBtnText}>SAVE</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Live Character Preview Card */}
            <View style={styles.previewCard}>
              <View style={[styles.previewAvatarCircle, { backgroundColor: avatarBg }]}>
                <Image
                  source={{ uri: previewAvatarUrl }}
                  style={styles.previewAvatarImg}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.previewMeta}>
                <Text style={styles.previewMetaTitle}>{avatarSeed}</Text>
                <Text style={styles.previewMetaSeed}>
                  Style: {selectedStyle.toUpperCase()}
                </Text>
                <View style={styles.previewBgBadge}>
                  <View style={[styles.tinyColorDot, { backgroundColor: avatarBg }]} />
                  <Text style={styles.previewBgText}>
                    {AVATAR_BG_COLORS.find((b) => b.hex === avatarBg)?.label || 'Custom Background'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Background Color Swatches */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>AVATAR BACKGROUND COLOR</Text>
              <Text style={styles.sectionSubtitle}>
                Choose a backdrop color for your character icon
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.bgColorsRow}
              >
                {AVATAR_BG_COLORS.map((bg) => {
                  const isBgSelected = avatarBg === bg.hex;
                  return (
                    <TouchableOpacity
                      key={bg.id}
                      style={[
                        styles.bgColorBtn,
                        { backgroundColor: bg.hex },
                        isBgSelected && styles.bgColorBtnSelected,
                      ]}
                      onPress={() => setAvatarBg(bg.hex)}
                      activeOpacity={0.7}
                    >
                      {isBgSelected && (
                        <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Game Character Roster */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>CHARACTER ROSTER (32 GAME ICONS)</Text>
              <Text style={styles.sectionSubtitle}>
                Select an icon from Miniavs, Dylan, Big Smile & Line Face
              </Text>

              {/* Roster Filter Tabs */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rosterFilterRow}
              >
                {(
                  [
                    { key: 'all', label: 'All (32)' },
                    { key: 'miniavs', label: 'Miniavs (8)' },
                    { key: 'dylan', label: 'Dylan (8)' },
                    { key: 'big-smile', label: 'Big Smile (8)' },
                    { key: 'line-face', label: 'Line Face (8)' },
                  ] as const
                ).map((tab) => {
                  const isTabActive = rosterFilter === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      style={[styles.rosterTab, isTabActive && styles.rosterTabActive]}
                      onPress={() => setRosterFilter(tab.key)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.rosterTabText,
                          isTabActive && styles.rosterTabTextActive,
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Character Grid */}
              <View style={styles.rosterGrid}>
                {filteredRoster.map((char) => {
                  const isCharSelected =
                    selectedStyle === char.style && avatarSeed === char.seed;
                  const thumbUrl = getDiceBearAvatarUrl(char.style, char.seed);
                  return (
                    <TouchableOpacity
                      key={char.id}
                      style={[
                        styles.rosterCard,
                        isCharSelected && styles.rosterCardSelected,
                      ]}
                      onPress={() => handleSelectCharacter(char)}
                      activeOpacity={0.75}
                    >
                      <View
                        style={[
                          styles.rosterAvatarCircle,
                          { backgroundColor: isCharSelected ? avatarBg : colors.surfaceRaised },
                        ]}
                      >
                        <Image
                          source={{ uri: thumbUrl }}
                          style={styles.rosterThumb}
                          resizeMode="cover"
                        />
                      </View>
                      <Text
                        style={[
                          styles.rosterName,
                          isCharSelected && { color: colors.accent },
                        ]}
                        numberOfLines={1}
                      >
                        {char.name}
                      </Text>
                      <Text style={styles.rosterTag} numberOfLines={1}>
                        {char.tag}
                      </Text>
                      {isCharSelected && (
                        <View style={styles.rosterSelectedBadge}>
                          <MaterialCommunityIcons name="check" size={10} color={colors.accentContrastText} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Profile Fields Section */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>ATHLETE PREFERENCES</Text>

              {/* Display Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ATHLETE DISPLAY NAME</Text>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Alex River"
                  placeholderTextColor={colors.textDim}
                />
              </View>

              {/* Training Focus Grid */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>TRAINING FOCUS</Text>
                <View style={styles.goalGrid}>
                  {goals.map((g) => {
                    const isSelected = goal === g;
                    return (
                      <TouchableOpacity
                        key={g}
                        style={[styles.goalBtn, isSelected && styles.goalBtnActive]}
                        onPress={() => setGoal(g as any)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.goalBtnText, isSelected && styles.goalBtnTextActive]}>
                          {g}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Weight Unit & Body Weight */}
              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>Weight Unit</Text>
                  <Text style={styles.settingSub}>Switch between Metric & Imperial</Text>
                </View>
                <TouchableOpacity
                  style={styles.unitToggleBtn}
                  onPress={handleToggleWeightUnit}
                  activeOpacity={0.7}
                >
                  <Text style={styles.unitToggleText}>{activeUser.weightUnit.toUpperCase()}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>Body Weight</Text>
                  <Text style={styles.settingSub}>Used for strength and tonnage tracking</Text>
                </View>
                <View style={styles.weightInputRow}>
                  <TextInput
                    style={styles.weightInput}
                    keyboardType="decimal-pad"
                    value={bodyWeight}
                    onChangeText={setBodyWeight}
                    placeholder="75"
                    placeholderTextColor={colors.textDim}
                  />
                  <Text style={styles.weightUnitSuffix}>{activeUser.weightUnit}</Text>
                </View>
              </View>
            </View>

            {/* Bottom Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
                <MaterialCommunityIcons name="check" size={16} color={colors.accentContrastText} />
                <Text style={styles.saveBtnText}>SAVE PROFILE</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    keyboardContainer: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceBorder,
      backgroundColor: colors.surface,
    },
    headerActionBtn: {
      padding: 6,
    },
    headerTitleBox: {
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 14,
      fontWeight: '900',
      letterSpacing: 1,
      color: colors.textPrimary,
    },
    headerSubtitle: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    saveHeaderBtn: {
      backgroundColor: colors.accent,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    saveHeaderBtnText: {
      fontSize: 11,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.8,
    },
    scrollContent: {
      padding: 16,
      gap: 16,
      paddingBottom: 40,
    },
    previewCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    previewAvatarCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.surfaceBorder,
    },
    previewAvatarImg: {
      width: 72,
      height: 72,
    },
    previewMeta: {
      flex: 1,
      gap: 4,
    },
    previewMetaTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    previewMetaSeed: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.accent,
      letterSpacing: 0.8,
    },
    previewBgBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.surfaceRaised,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      alignSelf: 'flex-start',
      marginTop: 2,
    },
    tinyColorDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    previewBgText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textMuted,
    },
    sectionCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      gap: 12,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 1,
      color: colors.accent,
    },
    sectionSubtitle: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: -8,
      marginBottom: 4,
    },
    bgColorsRow: {
      flexDirection: 'row',
      gap: 10,
      paddingVertical: 4,
    },
    bgColorBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    bgColorBtnSelected: {
      borderColor: colors.accent,
      transform: [{ scale: 1.1 }],
    },
    rosterFilterRow: {
      flexDirection: 'row',
      gap: 8,
      paddingVertical: 4,
    },
    rosterTab: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    rosterTabActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    rosterTabText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
    },
    rosterTabTextActive: {
      color: colors.accentContrastText,
    },
    rosterGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    rosterCard: {
      width: '23%',
      backgroundColor: colors.surfaceRaised,
      borderRadius: 14,
      padding: 6,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      position: 'relative',
    },
    rosterCardSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSubtle,
    },
    rosterAvatarCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      marginBottom: 4,
    },
    rosterThumb: {
      width: 44,
      height: 44,
    },
    rosterName: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    rosterTag: {
      fontSize: 8,
      color: colors.textMuted,
      textAlign: 'center',
    },
    rosterSelectedBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    inputGroup: {
      gap: 6,
    },
    inputLabel: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: colors.textMuted,
    },
    textInput: {
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    goalGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    goalBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    goalBtnActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    goalBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
    },
    goalBtnTextActive: {
      color: colors.accentContrastText,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
      borderTopWidth: 1,
      borderTopColor: colors.surfaceBorder,
    },
    settingLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    settingSub: {
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 2,
    },
    unitToggleBtn: {
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
    },
    unitToggleText: {
      fontSize: 11,
      fontWeight: '900',
      color: colors.accent,
    },
    weightInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      borderRadius: 10,
      paddingHorizontal: 10,
      gap: 4,
    },
    weightInput: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      paddingVertical: 6,
      width: 50,
      textAlign: 'right',
    },
    weightUnitSuffix: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
    },
    actionRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    cancelBtn: {
      flex: 1,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelBtnText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 0.8,
    },
    saveBtn: {
      flex: 2,
      flexDirection: 'row',
      backgroundColor: colors.accent,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    saveBtnText: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.8,
    },
  });
