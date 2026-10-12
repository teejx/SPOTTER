import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors, THEME_LIST, THEME_METADATA } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';
import { SignOutConfirmModal } from '../components/SignOutConfirmModal';
import { EditProfileModal } from '../components/EditProfileModal';
import { ColorMode, ThemeId } from '../types';
import { AVATAR_ROSTER } from '../lib/dicebear';

export const ProfileScreen: React.FC = () => {
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
  } = useFitness();

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  if (!activeUser) return null;

  const athleteName = activeUser.name?.includes('@')
    ? activeUser.name.split('@')[0]
    : activeUser.name;

  const initials = athleteName.slice(0, 2).toUpperCase();

  const activeThemeMeta = THEME_METADATA[themeId] || THEME_METADATA.crimson;

  const modes: { key: ColorMode; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
    { key: 'system', label: 'System', icon: 'cellphone-cog' },
    { key: 'dark', label: 'Dark', icon: 'weather-night' },
    { key: 'light', label: 'Light', icon: 'white-balance-sunny' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 1. Header Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity
            style={[styles.avatarBox, { backgroundColor: activeUser.avatarBg || '#EA580C' }]}
            onPress={() => setIsEditModalVisible(true)}
            activeOpacity={0.8}
          >
            {activeUser.avatarUrl ? (
              <Image
                source={{ uri: activeUser.avatarUrl }}
                style={styles.profileAvatarImg}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
            <View style={styles.avatarEditOverlayBadge}>
              <MaterialCommunityIcons name="pencil" size={10} color={colors.accentContrastText} />
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{athleteName}</Text>

            {/* Username and Edit Button Area */}
            <View style={styles.handleAreaRow}>
              <Text style={styles.profileHandle}>{activeUser.handle}</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditModalVisible(true)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={12}
                  color={colors.accentContrastText}
                />
                <Text style={styles.editButtonText}>EDIT</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.streakBadge}>
              <MaterialCommunityIcons name="fire" size={14} color={colors.flame} />
              <Text style={styles.streakText}>{activeUser.streakDays} Day Workout Streak</Text>
            </View>
          </View>
        </View>

        {/* 2. Profile Summary Snapshot */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>GOAL</Text>
              <Text style={styles.summaryVal}>{activeUser.trainingGoal}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>BODY WEIGHT</Text>
              <Text style={styles.summaryVal}>
                {activeUser.bodyWeight} {activeUser.weightUnit}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>AVATAR</Text>
              <Text style={styles.summaryVal}>
                {AVATAR_ROSTER.find(
                  (c) =>
                    c.style === activeUser.avatarStyle &&
                    c.seed === activeUser.avatarSeed &&
                    (c.options
                      ? JSON.stringify(c.options) === JSON.stringify(activeUser.avatarOptions || {})
                      : !activeUser.avatarOptions || Object.keys(activeUser.avatarOptions).length === 0)
                )?.name ||
                  AVATAR_ROSTER.find(
                    (c) => c.style === activeUser.avatarStyle && c.seed === activeUser.avatarSeed
                  )?.name ||
                  activeUser.avatarSeed ||
                  activeUser.avatarStyle ||
                  'Titan'}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. APPEARANCE & THEME CARD (Pleasing, compact & UX-friendly) */}
        <View style={styles.card}>
          <View style={styles.themeHeaderRow}>
            <View style={styles.themeHeaderLeft}>
              <MaterialCommunityIcons name="palette-swatch-outline" size={18} color={colors.accent} />
              <Text style={styles.cardHeaderTitle}>APPEARANCE & THEMES</Text>
            </View>
            <View style={styles.activeThemeBadge}>
              <View style={[styles.activeThemeDot, { backgroundColor: colors.accent }]} />
              <Text style={styles.activeThemeBadgeText}>
                {activeThemeMeta.name} • {resolvedMode.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Color Mode Segmented Pill */}
          <View style={styles.modeSection}>
            <Text style={styles.subSectionLabel}>DISPLAY MODE</Text>
            <View style={styles.segmentedControl}>
              {modes.map((m) => {
                const isActive = colorMode === m.key;
                return (
                  <TouchableOpacity
                    key={m.key}
                    style={[styles.segmentBtn, isActive && styles.segmentBtnActive]}
                    onPress={() => setColorMode(m.key)}
                    activeOpacity={0.75}
                  >
                    <MaterialCommunityIcons
                      name={m.icon}
                      size={14}
                      color={isActive ? colors.accentContrastText : colors.textMuted}
                    />
                    <Text style={[styles.segmentBtnText, isActive && styles.segmentBtnTextActive]}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Compact Theme Palette Grid */}
          <View style={styles.paletteSection}>
            <Text style={styles.subSectionLabel}>COLOR PALETTE</Text>
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
                    onPress={() => setThemeId(t.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.paletteSwatch, { backgroundColor: t.accentHex }]}>
                      {isSelected && (
                        <MaterialCommunityIcons name="check" size={12} color="#000000" />
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

        {/* 4. Security & Offline Storage Card */}
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

        {/* 5. Account Sign Out */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={() => setShowSignOutModal(true)}
          activeOpacity={0.75}
        >
          <MaterialCommunityIcons name="logout" size={18} color={colors.danger} />
          <Text style={styles.signOutText}>SIGN OUT OF ACCOUNT</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile & Avatar Modal */}
      <EditProfileModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
      />

      {/* Sign Out Confirmation Modal */}
      <SignOutConfirmModal
        visible={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={logout}
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
    content: {
      padding: 16,
      gap: 16,
      paddingBottom: 110,
    },
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      gap: 16,
    },
    avatarBox: {
      width: 68,
      height: 68,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
    },
    profileAvatarImg: {
      width: 68,
      height: 68,
      borderRadius: 24,
    },
    avatarInitials: {
      fontSize: 22,
      fontWeight: '900',
      color: '#FFFFFF',
    },
    avatarEditOverlayBadge: {
      position: 'absolute',
      bottom: 4,
      right: 4,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileInfo: {
      flex: 1,
      gap: 4,
    },
    profileName: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    handleAreaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    profileHandle: {
      fontSize: 12,
      fontFamily: 'monospace',
      color: colors.textMuted,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.accent,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    editButtonText: {
      fontSize: 10,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.5,
    },
    streakBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.surfaceRaised,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      alignSelf: 'flex-start',
      marginTop: 2,
    },
    streakText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.flame,
    },
    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    summaryItem: {
      flex: 1,
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: colors.textDim,
      marginBottom: 3,
    },
    summaryVal: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    summaryDivider: {
      width: 1,
      height: 24,
      backgroundColor: colors.surfaceBorder,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      gap: 16,
    },
    themeHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    themeHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    cardHeaderTitle: {
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 1,
      color: colors.textPrimary,
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
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    activeThemeBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 0.5,
    },
    subSectionLabel: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: colors.textDim,
      marginBottom: 8,
    },
    modeSection: {},
    segmentedControl: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceRaised,
      borderRadius: 14,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      gap: 4,
    },
    segmentBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderRadius: 10,
      gap: 6,
    },
    segmentBtnActive: {
      backgroundColor: colors.accent,
    },
    segmentBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
    },
    segmentBtnTextActive: {
      color: colors.accentContrastText,
      fontWeight: '900',
    },
    paletteSection: {},
    paletteGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    paletteChip: {
      width: '48.5%',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceRaised,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      gap: 10,
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
    securityCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      gap: 12,
    },
    securityIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.emeraldBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    securityTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    securitySub: {
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 2,
      lineHeight: 14,
    },
    signOutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.dangerBg,
      borderWidth: 1,
      borderColor: colors.danger,
      paddingVertical: 14,
      borderRadius: 18,
      marginTop: 8,
    },
    signOutText: {
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 1,
      color: colors.danger,
    },
  });
