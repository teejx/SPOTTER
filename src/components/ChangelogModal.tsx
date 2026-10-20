import React, { useMemo } from 'react';
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
import { ThemeColors } from '../theme/colors';
import { CHANGELOG_HISTORY, APP_VERSION } from '../utils/changelog';

interface ChangelogModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ visible, onClose }) => {
  const { colors, isDark } = useFitness();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  if (!visible) return null;

  const latestRelease = CHANGELOG_HISTORY[0];

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleDismiss}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Top Bar */}
          <View style={styles.headerBar}>
            <View style={styles.badgeRow}>
              <View style={styles.versionBadge}>
                <Text style={styles.versionBadgeText}>v{latestRelease.version}</Text>
              </View>
              <Text style={styles.releaseDateText}>{latestRelease.releaseDate}</Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleDismiss}
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
            {/* Hero Banner */}
            <View style={styles.heroCard}>
              <View style={styles.heroIconBox}>
                <MaterialCommunityIcons name="lightning-bolt" size={26} color={colors.accent} />
              </View>
              <Text style={styles.heroTitle}>{latestRelease.title}</Text>
              <Text style={styles.heroSummary}>{latestRelease.summary}</Text>
            </View>

            {/* Release Highlights */}
            <View style={styles.highlightsList}>
              <Text style={styles.sectionHeaderTitle}>WHAT'S NEW & IMPROVED</Text>

              {latestRelease.highlights.map((item, idx) => (
                <View key={idx} style={styles.highlightCard}>
                  <View style={styles.highlightIconCircle}>
                    <MaterialCommunityIcons
                      name={(item.icon as any) || 'check'}
                      size={20}
                      color={colors.accent}
                    />
                  </View>

                  <View style={styles.highlightTextCol}>
                    <View style={styles.highlightHeaderRow}>
                      <Text style={styles.highlightTitle}>{item.title}</Text>
                      {item.tag && (
                        <View style={styles.tagBadge}>
                          <Text style={styles.tagBadgeText}>{item.tag}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.highlightDesc}>{item.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Note regarding updates */}
            <View style={styles.footerNoteCard}>
              <MaterialCommunityIcons name="information-outline" size={16} color={colors.textDim} />
              <Text style={styles.footerNoteText}>
                You can revisit this changelog anytime from your Profile → Settings → View Changelog.
              </Text>
            </View>
          </ScrollView>

          {/* Fixed Bottom CTA */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={handleDismiss}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="dumbbell"
                size={18}
                color={colors.accentContrastText}
              />
              <Text style={styles.ctaButtonText}>GOT IT, LET'S TRAIN!</Text>
            </TouchableOpacity>
          </View>
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
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    versionBadge: {
      backgroundColor: colors.accent,
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 8,
    },
    versionBadgeText: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.accentContrastText,
      fontFamily: 'monospace',
    },
    releaseDateText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
      fontFamily: 'monospace',
      textTransform: 'uppercase',
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
      padding: 18,
      paddingBottom: 28,
    },
    heroCard: {
      backgroundColor: colors.surfaceRaised,
      borderColor: colors.surfaceBorder,
      borderWidth: 1,
      borderRadius: 22,
      padding: 20,
      marginBottom: 20,
      alignItems: 'center',
      textAlign: 'center',
    },
    heroIconBox: {
      width: 52,
      height: 52,
      borderRadius: 18,
      backgroundColor: colors.accentSubtle,
      borderWidth: 1.5,
      borderColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    heroTitle: {
      fontSize: 22,
      fontWeight: '900',
      color: colors.text,
      letterSpacing: -0.4,
      textAlign: 'center',
      marginBottom: 8,
    },
    heroSummary: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.textMuted,
      textAlign: 'center',
      paddingHorizontal: 8,
    },
    sectionHeaderTitle: {
      fontSize: 11,
      fontWeight: '900',
      color: colors.textDim,
      letterSpacing: 1.2,
      fontFamily: 'monospace',
      marginBottom: 12,
      paddingLeft: 4,
    },
    highlightsList: {
      gap: 12,
      marginBottom: 20,
    },
    highlightCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.cardBg,
      borderColor: colors.cardBorder,
      borderWidth: 1,
      borderRadius: 18,
      padding: 14,
      gap: 14,
    },
    highlightIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: colors.accentSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginTop: 2,
    },
    highlightTextCol: {
      flex: 1,
    },
    highlightHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 4,
    },
    highlightTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
      flex: 1,
    },
    tagBadge: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    tagBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.textDim,
      fontFamily: 'monospace',
    },
    highlightDesc: {
      fontSize: 12,
      lineHeight: 18,
      color: colors.textMuted,
    },
    footerNoteCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
      borderColor: colors.cardBorder,
      borderWidth: 1,
      borderRadius: 14,
      padding: 12,
    },
    footerNoteText: {
      fontSize: 11,
      color: colors.textDim,
      lineHeight: 16,
      flex: 1,
    },
    bottomBar: {
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: colors.surfaceBorder,
      backgroundColor: colors.background,
    },
    ctaButton: {
      backgroundColor: colors.accent,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 16,
      gap: 8,
    },
    ctaButtonText: {
      fontSize: 13,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.8,
    },
  });
