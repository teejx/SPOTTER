import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFitness } from '../context/FitnessContext';
import { ThemeColors, THEME_LIST, THEME_METADATA } from '../theme/colors';
import { ColorMode, ThemeId } from '../types';
import { SignOutConfirmModal } from './SignOutConfirmModal';
import { APP_VERSION } from '../utils/changelog';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenChangelog: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  onOpenChangelog,
}) => {
  const {
    activeUser,
    logout,
    themeId,
    setThemeId,
    colorMode,
    setColorMode,
    resolvedMode,
    isDark,
    colors,
    isSyncing,
    lastSyncedAt,
    syncNow,
    setWeightUnit,
  } = useFitness();

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [showSignOutModal, setShowSignOutModal] = useState(false);

  if (!visible || !activeUser) return null;

  const activeThemeMeta = THEME_METADATA[themeId] || THEME_METADATA.crimson;

  const modes: { key: ColorMode; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
    { key: 'system', label: 'System', icon: 'cellphone-cog' },
    { key: 'dark', label: 'Dark', icon: 'weather-night' },
    { key: 'light', label: 'Light', icon: 'white-balance-sunny' },
  ];

  const handleSelectMode = (m: ColorMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setColorMode(m);
  };

  const handleSelectTheme = (tid: ThemeId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setThemeId(tid);
  };

  const handleSelectUnit = (u: 'kg' | 'lbs') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWeightUnit(u);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Top Bar */}
          <View style={styles.headerBar}>
            <View style={styles.headerTitleRow}>
              <View style={styles.settingsIconBox}>
                <MaterialCommunityIcons name="cog" size={20} color={colors.accent} />
              </View>
              <Text style={styles.headerTitle}>APP SETTINGS</Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MaterialCommunityIcons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. APPEARANCE & THEMES */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderLeft}>
                  <MaterialCommunityIcons
                    name="palette-swatch-outline"
                    size={18}
                    color={colors.accent}
                  />
                  <Text style={styles.cardHeaderTitle}>APPEARANCE & THEMES</Text>
                </View>
                <View style={styles.activeThemeBadge}>
                  <View style={[styles.activeThemeDot, { backgroundColor: colors.accent }]} />
                  <Text style={styles.activeThemeBadgeText}>
                    {activeThemeMeta.name} • {resolvedMode.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Display Mode Control */}
              <View style={styles.sectionBlock}>
                <Text style={styles.subSectionLabel}>DISPLAY MODE</Text>
                <View style={styles.segmentedControl}>
                  {modes.map((m) => {
                    const isActive = colorMode === m.key;
                    return (
                      <TouchableOpacity
                        key={m.key}
                        style={[styles.segmentBtn, isActive && styles.segmentBtnActive]}
                        onPress={() => handleSelectMode(m.key)}
                        activeOpacity={0.75}
                      >
                        <MaterialCommunityIcons
                          name={m.icon}
                          size={14}
                          color={isActive ? colors.accentContrastText : colors.textMuted}
                        />
                        <Text
                          style={[
                            styles.segmentBtnText,
                            isActive && styles.segmentBtnTextActive,
                          ]}
                        >
                          {m.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Theme Palette Grid */}
              <View style={styles.sectionBlock}>
                <Text style={styles.subSectionLabel}>ACCENT COLOR PALETTE</Text>
                <View style={styles.paletteGrid}>
                  {THEME_LIST.map((t) => {
                    const isSelected = themeId === t.id;
                    return (
                      <TouchableOpacity
                        key={t.id}
                        style={[
                          styles.paletteChip,
                          isSelected && styles.paletteChipSelected,
                        ]}
                        onPress={() => handleSelectTheme(t.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.paletteSwatch, { backgroundColor: t.accentHex }]}>
                          {isSelected && (
                            <MaterialCommunityIcons
                              name="check"
                              size={12}
                              color={t.id === 'crimson' ? '#FFFFFF' : '#000000'}
                            />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.paletteName,
                            isSelected && { color: colors.accent, fontWeight: '800' },
                          ]}
                          numberOfLines={1}
                        >
                          {t.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* 2. UNITS & WEIGHT PREFERENCES */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderLeft}>
                  <MaterialCommunityIcons name="weight" size={18} color={colors.accent} />
                  <Text style={styles.cardHeaderTitle}>WEIGHT UNIT STANDARD</Text>
                </View>
                <View style={styles.activeThemeBadge}>
                  <Text style={styles.activeThemeBadgeText}>
                    CURRENT: {activeUser.weightUnit.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardDescription}>
                Select your global preferred weight measurement unit. You can also toggle KG / LBS on any individual workout set.
              </Text>

              <View style={styles.segmentedControl}>
                <TouchableOpacity
                  style={[
                    styles.segmentBtn,
                    activeUser.weightUnit === 'kg' && styles.segmentBtnActive,
                  ]}
                  onPress={() => handleSelectUnit('kg')}
                  activeOpacity={0.75}
                >
                  <MaterialCommunityIcons
                    name="scale-bathroom"
                    size={14}
                    color={activeUser.weightUnit === 'kg' ? colors.accentContrastText : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.segmentBtnText,
                      activeUser.weightUnit === 'kg' && styles.segmentBtnTextActive,
                    ]}
                  >
                    Kilograms (KG)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.segmentBtn,
                    activeUser.weightUnit === 'lbs' && styles.segmentBtnActive,
                  ]}
                  onPress={() => handleSelectUnit('lbs')}
                  activeOpacity={0.75}
                >
                  <MaterialCommunityIcons
                    name="scale-bathroom"
                    size={14}
                    color={activeUser.weightUnit === 'lbs' ? colors.accentContrastText : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.segmentBtnText,
                      activeUser.weightUnit === 'lbs' && styles.segmentBtnTextActive,
                    ]}
                  >
                    Pounds (LBS)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 3. CLOUD DATABASE SYNC */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderLeft}>
                  <MaterialCommunityIcons
                    name={isSyncing ? 'cloud-sync' : 'cloud-check'}
                    size={18}
                    color={colors.accent}
                  />
                  <Text style={styles.cardHeaderTitle}>CLOUD DATABASE SYNC</Text>
                </View>
                <View
                  style={[
                    styles.syncStatusBadge,
                    {
                      backgroundColor: isSyncing
                        ? 'rgba(59, 130, 246, 0.15)'
                        : 'rgba(16, 185, 129, 0.15)',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.activeThemeDot,
                      { backgroundColor: isSyncing ? '#3B82F6' : '#10B981' },
                    ]}
                  />
                  <Text
                    style={[
                      styles.syncStatusBadgeText,
                      { color: isSyncing ? '#3B82F6' : '#10B981' },
                    ]}
                  >
                    {isSyncing ? 'SYNCING...' : 'ONLINE READY'}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardDescription}>
                {lastSyncedAt
                  ? `Last synced: ${lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. All offline logs automatically push to Firebase Firestore.`
                  : 'Workouts logged offline are queued locally and automatically sync when connected to the internet.'}
              </Text>

              <TouchableOpacity
                style={[styles.syncNowButton, isSyncing && { opacity: 0.6 }]}
                onPress={() => syncNow()}
                disabled={isSyncing}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={isSyncing ? 'loading' : 'cloud-upload-outline'}
                  size={16}
                  color={colors.accentContrastText}
                />
                <Text style={styles.syncNowButtonText}>
                  {isSyncing ? 'SYNCING WORKOUTS...' : 'SYNC OFFLINE DATA TO CLOUD'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 4. WHAT'S NEW & CHANGELOG BUTTON */}
            <TouchableOpacity
              style={styles.changelogActionCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onOpenChangelog();
              }}
              activeOpacity={0.8}
            >
              <View style={styles.changelogLeft}>
                <View style={styles.changelogIconBox}>
                  <MaterialCommunityIcons name="newspaper-variant-outline" size={20} color={colors.accent} />
                </View>
                <View>
                  <View style={styles.changelogTitleRow}>
                    <Text style={styles.changelogTitle}>VIEW WHAT'S NEW</Text>
                    <View style={styles.newVersionBadge}>
                      <Text style={styles.newVersionBadgeText}>v{APP_VERSION}</Text>
                    </View>
                  </View>
                  <Text style={styles.changelogSubtitle}>
                    Read release notes, new exercises, and feature additions
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            {/* 5. SECURITY & ISOLATED STORAGE */}
            <View style={styles.securityCard}>
              <View style={styles.securityIconBox}>
                <MaterialCommunityIcons name="shield-check" size={20} color={colors.emerald} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.securityTitle}>Private & Isolated Storage</Text>
                <Text style={styles.securitySub}>
                  Your workouts, walks, personal records, and themes are encrypted and securely stored on this device.
                </Text>
              </View>
            </View>

            {/* 6. LOGOUT BUTTON */}
            <TouchableOpacity
              style={styles.signOutBtn}
              onPress={() => setShowSignOutModal(true)}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons name="logout" size={18} color={colors.danger} />
              <Text style={styles.signOutText}>SIGN OUT OF ACCOUNT</Text>
            </TouchableOpacity>

            {/* App Footer */}
            <View style={styles.appFooter}>
              <Text style={styles.appFooterText}>
                SPOTTER LOGBOOK · VERSION {APP_VERSION}
              </Text>
              <Text style={styles.appFooterSub}>
                Built for progressive overload, precision biomechanics & athletic consistency.
              </Text>
            </View>
          </ScrollView>

          {/* Sign Out Confirmation Modal */}
          <SignOutConfirmModal
            visible={showSignOutModal}
            onClose={() => setShowSignOutModal(false)}
            onConfirm={async () => {
              setShowSignOutModal(false);
              onClose();
              await logout();
            }}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 12) : 0,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceBorder,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    settingsIconBox: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: colors.accentSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.text,
      letterSpacing: 0.5,
      fontFamily: 'monospace',
    },
    closeBtn: {
      padding: 6,
      borderRadius: 12,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    scrollArea: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
      gap: 16,
    },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder,
      borderWidth: 1,
      borderRadius: 22,
      padding: 16,
      gap: 14,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    cardHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    cardHeaderTitle: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.text,
      letterSpacing: 0.8,
      fontFamily: 'monospace',
    },
    cardDescription: {
      fontSize: 12,
      lineHeight: 18,
      color: colors.textMuted,
    },
    activeThemeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.surfaceRaised,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    activeThemeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    activeThemeBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textSecondary,
      fontFamily: 'monospace',
    },
    sectionBlock: {
      gap: 8,
    },
    subSectionLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textDim,
      letterSpacing: 0.8,
      fontFamily: 'monospace',
    },
    segmentedControl: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceRaised,
      padding: 4,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      gap: 4,
    },
    segmentBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 9,
      borderRadius: 10,
      gap: 6,
    },
    segmentBtnActive: {
      backgroundColor: colors.accent,
    },
    segmentBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
    },
    segmentBtnTextActive: {
      color: colors.accentContrastText,
      fontWeight: '900',
    },
    paletteGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    paletteChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceRaised,
      paddingVertical: 7,
      paddingHorizontal: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      gap: 8,
      width: '48%',
    },
    paletteChipSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSubtle,
    },
    paletteSwatch: {
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    paletteName: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      flex: 1,
    },
    syncStatusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    syncStatusBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      fontFamily: 'monospace',
    },
    syncNowButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent,
      paddingVertical: 12,
      borderRadius: 14,
      gap: 8,
    },
    syncNowButtonText: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.6,
    },
    changelogActionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder,
      borderWidth: 1,
      borderRadius: 22,
      padding: 16,
    },
    changelogLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    changelogIconBox: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: colors.accentSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    changelogTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    changelogTitle: {
      fontSize: 13,
      fontWeight: '900',
      color: colors.text,
      fontFamily: 'monospace',
    },
    newVersionBadge: {
      backgroundColor: colors.accent,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    newVersionBadgeText: {
      fontSize: 10,
      fontWeight: '900',
      color: colors.accentContrastText,
      fontFamily: 'monospace',
    },
    changelogSubtitle: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    securityCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder,
      borderWidth: 1,
      borderRadius: 20,
      padding: 14,
    },
    securityIconBox: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: colors.emeraldBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    securityTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.text,
    },
    securitySub: {
      fontSize: 11,
      color: colors.textMuted,
      lineHeight: 16,
      marginTop: 2,
    },
    signOutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.dangerBg,
      borderColor: colors.danger,
      borderWidth: 1,
      paddingVertical: 14,
      borderRadius: 18,
      gap: 8,
    },
    signOutText: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.danger,
      letterSpacing: 0.8,
    },
    appFooter: {
      alignItems: 'center',
      paddingVertical: 10,
      gap: 4,
    },
    appFooterText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textDim,
      fontFamily: 'monospace',
      letterSpacing: 0.8,
    },
    appFooterSub: {
      fontSize: 11,
      color: colors.textDim,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
  });
