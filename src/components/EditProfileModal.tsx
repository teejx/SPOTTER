import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Platform,
  StatusBar as RNStatusBar,
  Keyboard,
  UIManager,
  LayoutAnimation,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { BottomSheetModal } from './BottomSheetModal';
import { getClayCardStyle, getClayPillStyle, getClayInputStyle } from '../theme/clay';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ visible, onClose }) => {
  const { activeUser, updateProfile, colors, isDark } = useFitness();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 0
  );

  const scrollRef = useRef<ScrollView>(null);
  const activeFieldRef = useRef<'name' | 'bodyWeight' | null>(null);
  const preferencesYRef = useRef<number>(0);

  const [name, setName] = useState(activeUser?.name || 'Guest Athlete');
  const [bodyWeight, setBodyWeight] = useState(String(activeUser?.bodyWeight || 75));
  const [goal, setGoal] = useState(activeUser?.trainingGoal || 'Strength');
  const [selectedStyle, setSelectedStyle] = useState<DiceBearAvatarStyle>(
    activeUser?.avatarStyle || 'miniavs'
  );
  const [avatarSeed, setAvatarSeed] = useState(activeUser?.avatarSeed || 'Titan');
  const [avatarOptions, setAvatarOptions] = useState<Record<string, any> | undefined>(
    activeUser?.avatarOptions
  );
  const [avatarBg, setAvatarBg] = useState(activeUser?.avatarBg || '#12141F');
  const [rosterFilter, setRosterFilter] = useState<'all' | DiceBearAvatarStyle>('all');
  const [isRosterExpanded, setIsRosterExpanded] = useState<boolean>(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const toggleRoster = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsRosterExpanded((prev) => !prev);
  };

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(() => {
          if (activeFieldRef.current === 'bodyWeight') {
            scrollRef.current?.scrollToEnd({ animated: true });
          } else if (activeFieldRef.current === 'name') {
            const targetY = Math.max(0, preferencesYRef.current - 12);
            scrollRef.current?.scrollTo({ y: targetY, animated: true });
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

  useEffect(() => {
    if (activeUser && visible) {
      setName(activeUser.name || 'Guest Athlete');
      setBodyWeight(String(activeUser.bodyWeight || 75));
      setGoal(activeUser.trainingGoal || 'Strength');
      setSelectedStyle(activeUser.avatarStyle || 'miniavs');
      setAvatarSeed(activeUser.avatarSeed || 'Titan');
      setAvatarOptions(activeUser.avatarOptions);
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
    setAvatarOptions(item.options);
  };

  const handleSave = async () => {
    const numWeight = parseFloat(bodyWeight) || activeUser.bodyWeight;
    const finalSeed = avatarSeed.trim() || 'Titan';
    const finalAvatarUrl = getDiceBearAvatarUrl(selectedStyle, finalSeed, 'png', avatarOptions);

    await updateProfile({
      ...activeUser,
      name: name.trim() || activeUser.name,
      bodyWeight: numWeight,
      trainingGoal: goal as any,
      avatarStyle: selectedStyle,
      avatarSeed: finalSeed,
      avatarOptions: avatarOptions,
      avatarBg: avatarBg,
      avatarUrl: finalAvatarUrl,
    });

    onClose();
  };

  const goals = ['Strength', 'Hypertrophy', 'Endurance', 'Functional', 'General Fitness'];
  const previewAvatarUrl = getDiceBearAvatarUrl(selectedStyle, avatarSeed, 'png', avatarOptions);

  const currentRosterItem =
    AVATAR_ROSTER.find(
      (c) =>
        c.style === selectedStyle &&
        c.seed === avatarSeed &&
        JSON.stringify(c.options || {}) === JSON.stringify(avatarOptions || {})
    ) || AVATAR_ROSTER.find((c) => c.style === selectedStyle && c.seed === avatarSeed);

  const filteredRoster =
    rosterFilter === 'all'
      ? AVATAR_ROSTER
      : AVATAR_ROSTER.filter((c) => c.style === rosterFilter);

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      height="92%"
      title="Edit Profile & Avatar"
      subtitle="Customize your athlete persona"
      icon="account-circle"
      iconColor={colors.accent}
      headerRight={
        <TouchableOpacity
          onPress={handleSave}
          style={styles.saveHeaderBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.saveHeaderBtnText}>SAVE</Text>
        </TouchableOpacity>
      }
    >
      <View style={[styles.keyboardContainer, { marginBottom: keyboardHeight }]}>

          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: keyboardHeight > 0 ? 32 : 24 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Unified Avatar & Character Card */}
            <View style={styles.avatarCard}>
              <TouchableOpacity
                style={styles.avatarCardHeader}
                onPress={toggleRoster}
                activeOpacity={0.7}
              >
                <View style={[styles.avatarCircle, { backgroundColor: avatarBg }]}>
                  <Image
                    source={{ uri: previewAvatarUrl }}
                    style={styles.avatarImg}
                    resizeMode="cover"
                  />
                </View>

                <View style={styles.avatarInfoBox}>
                  <View style={styles.avatarTitleRow}>
                    <Text style={styles.avatarSeedName} numberOfLines={1}>
                      {currentRosterItem?.name || avatarSeed}
                    </Text>
                    <View style={styles.styleBadge}>
                      <Text style={styles.styleBadgeText}>{selectedStyle.replace('-', ' ').toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={styles.avatarMetaRow}>
                    <View style={[styles.tinyColorDot, { backgroundColor: avatarBg }]} />
                    <Text style={styles.avatarColorText} numberOfLines={1}>
                      {AVATAR_BG_COLORS.find((b) => b.hex === avatarBg)?.label || 'Custom'}
                    </Text>
                    <Text style={styles.avatarDotSeparator}>•</Text>
                    <Text style={styles.avatarCountText}>{AVATAR_ROSTER.length} Icons</Text>
                  </View>
                </View>

                <View style={[styles.changeIconPill, isRosterExpanded && styles.changeIconPillActive]}>
                  <Text style={[styles.changeIconPillText, isRosterExpanded && styles.changeIconPillTextActive]}>
                    {isRosterExpanded ? 'HIDE' : 'CHANGE'}
                  </Text>
                  <MaterialCommunityIcons
                    name={isRosterExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={isRosterExpanded ? colors.accentContrastText : colors.accent}
                  />
                </View>
              </TouchableOpacity>

              {/* Expandable Section: Color Swatches & 32 Game Icons */}
              {isRosterExpanded && (
                <View style={styles.rosterExpandContainer}>
                  <View style={styles.cardDivider} />

                  {/* 1. Backdrop Color Picker */}
                  <View style={styles.rosterSubSection}>
                    <Text style={styles.rosterSubTitle}>AVATAR BACKDROP COLOR</Text>
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

                  {/* 2. Character Roster Header & Tabs */}
                  <View style={styles.rosterSubSection}>
                    <View style={styles.rosterSubHeader}>
                      <Text style={styles.rosterSubTitle}>GAME CHARACTER ICONS ({AVATAR_ROSTER.length})</Text>
                      <Text style={styles.rosterSubHint}>Tap icon to select</Text>
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.rosterFilterRow}
                    >
                      {(
                        [
                          { key: 'all', label: `All (${AVATAR_ROSTER.length})` },
                          { key: 'miniavs', label: 'Miniavs' },
                          { key: 'dylan', label: 'Dylan' },
                          { key: 'big-smile', label: 'Big Smile' },
                          { key: 'big-ears', label: 'Big Ears' },
                          { key: 'line-face', label: 'Line Face' },
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
                  </View>

                  {/* 3. Character Grid */}
                  <View style={styles.rosterGrid}>
                    {filteredRoster.map((char) => {
                      const isCharSelected =
                        selectedStyle === char.style &&
                        avatarSeed === char.seed &&
                        (char.options
                          ? JSON.stringify(char.options) === JSON.stringify(avatarOptions || {})
                          : !avatarOptions || Object.keys(avatarOptions).length === 0);
                      const thumbUrl = getDiceBearAvatarUrl(char.style, char.seed, 'png', char.options);
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

                  {/* 4. Bottom Collapse Action Bar */}
                  <TouchableOpacity
                    style={styles.doneChoosingBtn}
                    onPress={toggleRoster}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.doneChoosingBtnText}>Done Selecting Avatar</Text>
                    <MaterialCommunityIcons name="chevron-up" size={16} color={colors.accent} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Profile Fields Section */}
            <View
              style={styles.sectionCard}
              onLayout={(event) => {
                preferencesYRef.current = event.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.sectionTitle}>ATHLETE PREFERENCES</Text>

              {/* Display Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ATHLETE DISPLAY NAME</Text>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  onFocus={() => {
                    activeFieldRef.current = 'name';
                    setTimeout(() => {
                      const targetY = Math.max(0, preferencesYRef.current - 12);
                      scrollRef.current?.scrollTo({ y: targetY, animated: true });
                    }, 50);
                  }}
                  onBlur={() => {
                    if (activeFieldRef.current === 'name') activeFieldRef.current = null;
                  }}
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
                    onFocus={() => {
                      activeFieldRef.current = 'bodyWeight';
                      setTimeout(() => {
                        scrollRef.current?.scrollToEnd({ animated: true });
                      }, 80);
                    }}
                    onBlur={() => {
                      if (activeFieldRef.current === 'bodyWeight') activeFieldRef.current = null;
                    }}
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
        </View>
    </BottomSheetModal>
  );
};

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    sheetOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'flex-end',
    },
    sheetContainer: {
      height: '92%',
      backgroundColor: colors.surface,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      borderWidth: 1.5,
      borderBottomWidth: 0,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.95)',
      overflow: 'hidden',
    },
    sheetHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.20)' : 'rgba(0, 0, 0, 0.15)',
      alignSelf: 'center',
      marginTop: 10,
      marginBottom: 2,
    },
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
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceBorder,
      backgroundColor: colors.surface,
    },
    headerActionBtn: {
      padding: 8,
      borderRadius: 12,
      backgroundColor: colors.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
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
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
    },
    saveHeaderBtnText: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.8,
    },
    scrollContent: {
      padding: 16,
      gap: 16,
    },
    avatarCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    avatarCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    avatarCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.surfaceBorder,
    },
    avatarImg: {
      width: 60,
      height: 60,
    },
    avatarInfoBox: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    avatarTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    avatarSeedName: {
      fontSize: 17,
      fontWeight: '900',
      color: colors.textPrimary,
      flexShrink: 1,
    },
    styleBadge: {
      backgroundColor: colors.surfaceRaised,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    styleBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.accent,
      letterSpacing: 0.5,
    },
    avatarMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    tinyColorDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    avatarColorText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textMuted,
      flexShrink: 1,
    },
    avatarDotSeparator: {
      fontSize: 10,
      color: colors.textDim,
    },
    avatarCountText: {
      fontSize: 11,
      color: colors.textDim,
      fontFamily: 'monospace',
    },
    changeIconPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.surfaceRaised,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    changeIconPillActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    changeIconPillText: {
      fontSize: 10,
      fontWeight: '900',
      color: colors.accent,
      letterSpacing: 0.6,
    },
    changeIconPillTextActive: {
      color: colors.accentContrastText,
    },
    rosterExpandContainer: {
      marginTop: 14,
      gap: 14,
    },
    cardDivider: {
      height: 1,
      backgroundColor: colors.surfaceBorder,
    },
    rosterSubSection: {
      gap: 8,
    },
    rosterSubHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rosterSubTitle: {
      fontSize: 10,
      fontWeight: '900',
      color: colors.textDim,
      letterSpacing: 0.8,
    },
    rosterSubHint: {
      fontSize: 10,
      color: colors.textDim,
    },
    doneChoosingBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingVertical: 10,
      borderRadius: 12,
      gap: 6,
      marginTop: 4,
    },
    doneChoosingBtnText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accent,
      letterSpacing: 0.5,
    },
    sectionCard: {
      ...getClayCardStyle(isDark, colors.surface, 24),
      padding: 16,
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
      ...getClayInputStyle(isDark, colors.surfaceRaised, 16),
      borderColor: colors.surfaceBorder,
      paddingHorizontal: 14,
      paddingVertical: 12,
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
      ...getClayCardStyle(isDark, colors.surfaceRaised, 18),
      borderColor: colors.surfaceBorder,
      paddingVertical: 14,
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
      ...getClayPillStyle(colors.accent, 18),
      paddingVertical: 14,
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
