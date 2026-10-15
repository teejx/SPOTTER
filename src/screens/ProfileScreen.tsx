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
    isSyncing,
    lastSyncedAt,
    syncNow,
    setWeightUnit,
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
        {/* Guest Local Storage Notice Banner */}
        {activeUser.id.startsWith('guest') && (
          <View style={styles.guestNoticeCard}>
            <View style={styles.guestNoticeIconBox}>
              <MaterialCommunityIcons name="alert" size={18} color="#F59E0B" />
            </View>
            <View style={styles.guestNoticeContent}>
              <Text style={styles.guestNoticeTitle}>GUEST MODE (LOCAL STORAGE ONLY)</Text>
              <Text style={styles.guestNoticeDesc}>
                Your workouts and routines are saved on this device only. If you delete or uninstall the app, your progress cannot be recovered.
              </Text>
            </View>
          </View>
        )}

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
                        <MaterialCommunityIcons name="check" size={12} color={t.id === 'crimson' ? '#FFFFFF' : '#000000'} />
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

        {/* 4. UNITS & WEIGHT PREFERENCES */}
        <View style={styles.card}>
          <View style={styles.themeHeaderRow}>
            <View style={styles.themeHeaderLeft}>
              <MaterialCommunityIcons name="weight" size={18} color={colors.accent} />
              <Text style={styles.cardHeaderTitle}>WEIGHT UNIT</Text>
            </View>
            <View style={styles.activeThemeBadge}>
              <Text style={styles.activeThemeBadgeText}>
                CURRENT: {activeUser.weightUnit.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.syncDescription}>
            Choose your preferred global weight standard. You can also toggle between KG and LBS directly inside any active workout or per individual exercise.
          </Text>

          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                activeUser.weightUnit === 'kg' && styles.segmentBtnActive,
              ]}
              onPress={() => setWeightUnit('kg')}
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
              onPress={() => setWeightUnit('lbs')}
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

        {/* 5. CLOUD SYNC & RECONCILIATION CARD */}
        <View style={styles.card}>
          <View style={styles.themeHeaderRow}>
            <View style={styles.themeHeaderLeft}>
              <MaterialCommunityIcons
                name={isSyncing ? "cloud-sync" : "cloud-check"}
                size={18}
                color={colors.accent}
              />
              <Text style={styles.cardHeaderTitle}>CLOUD DATABASE SYNC</Text>
            </View>
            <View style={[
              styles.syncStatusBadge,
              { backgroundColor: isSyncing ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)' }
            ]}>
              <View
                style={[
                  styles.activeThemeDot,
                  { backgroundColor: isSyncing ? '#3B82F6' : '#10B981' }
                ]}
              />
              <Text
                style={[
                  styles.syncStatusBadgeText,
                  { color: isSyncing ? '#3B82F6' : '#10B981' }
                ]}
              >
                {isSyncing ? 'SYNCING...' : 'ONLINE READY'}
              </Text>
            </View>
          </View>

          <Text style={styles.syncDescription}>
            {lastSyncedAt
              ? `Last synced: ${lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. All offline logs automatically push to Firebase Firestore.`
              : 'Workouts logged offline are queued locally and automatically sync when connected to the internet.'}
          </Text>

          <TouchableOpacity
            style={[
              styles.syncNowButton,
              isSyncing && { opacity: 0.6 }
            ]}
            onPress={() => syncNow()}
            disabled={isSyncing}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={isSyncing ? "loading" : "cloud-upload-outline"}
              size={16}
              color={colors.accentContrastText}
            />
            <Text style={styles.syncNowButtonText}>
              {isSyncing ? 'SYNCING WORKOUTS...' : 'SYNC OFFLINE DATA TO CLOUD'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 5. Security & Offline Storage Card */}
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
    syncStatusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    syncStatusBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    syncDescription: {
      fontSize: 11,
      color: colors.textMuted,
      lineHeight: 16,
      marginBottom: 12,
    },
    syncNowButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.accent,
      paddingVertical: 12,
      borderRadius: 14,
    },
    syncNowButtonText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accentContrastText,
      letterSpacing: 0.5,
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
    guestNoticeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)',
      borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.25)',
      borderWidth: 1,
      borderRadius: 16,
      padding: 14,
      marginBottom: 16,
    },
    guestNoticeIconBox: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    guestNoticeContent: {
      flex: 1,
    },
    guestNoticeTitle: {
      fontSize: 10,
      fontWeight: '900',
      color: '#F59E0B',
      letterSpacing: 0.8,
      fontFamily: 'monospace',
      marginBottom: 3,
    },
    guestNoticeDesc: {
      fontSize: 11,
      color: colors.textMuted,
      lineHeight: 16,
    },
  });
