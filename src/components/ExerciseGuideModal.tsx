import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import YoutubePlayer from 'react-native-youtube-iframe';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';
import { ExerciseDefinition } from '../types';

interface ExerciseGuideModalProps {
  exercise: ExerciseDefinition | null;
  visible: boolean;
  onClose: () => void;
  onStartExercise?: (exercise: ExerciseDefinition) => void;
}

type GuideTab = 'exercisedb' | 'video';

function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:embed\/|v=|youtu\.be\/|\/v\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export const ExerciseGuideModal: React.FC<ExerciseGuideModalProps> = ({
  exercise,
  visible,
  onClose,
  onStartExercise,
}) => {
  const { colors, isDark } = useFitness();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<GuideTab>('exercisedb');
  const [videoError, setVideoError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 0
  );

  React.useEffect(() => {
    if (visible && exercise) {
      setActiveTab('exercisedb');
      setVideoError(false);
      setImageError(false);
      setIsImageLoading(true);
    }
  }, [visible, exercise?.id]);

  if (!exercise || !visible) return null;

  const videoId = extractYouTubeId(exercise.videoEmbedUrl);
  const gifUrl = exercise.exerciseDbGifUrl || exercise.animationGifUrl;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header with safe top clearance */}
        <View style={[styles.header, { paddingTop: topInset + 10 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.exerciseTitle}>{exercise.name}</Text>
            <View style={styles.tagRow}>
              <Text style={styles.tag}>{exercise.category}</Text>
              <Text style={styles.tagDot}>•</Text>
              <Text style={styles.tag}>{exercise.equipment}</Text>
              {exercise.difficulty && (
                <>
                  <Text style={styles.tagDot}>•</Text>
                  <Text style={styles.tag}>{exercise.difficulty}</Text>
                </>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <MaterialCommunityIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Media Switcher Tab (2 Clean Tabs: Motion Demo & Video Guide) */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'exercisedb' && styles.tabBtnActive]}
            onPress={() => setActiveTab('exercisedb')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="animation-play"
              size={16}
              color={activeTab === 'exercisedb' ? colors.accentContrastText : colors.textMuted}
            />
            <Text style={[styles.tabBtnText, activeTab === 'exercisedb' && styles.tabBtnTextActive]}>
              Motion Demo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'video' && styles.tabBtnActive]}
            onPress={() => setActiveTab('video')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="youtube"
              size={18}
              color={activeTab === 'video' ? '#000000' : '#EF4444'}
            />
            <Text style={[styles.tabBtnText, activeTab === 'video' && styles.tabBtnTextActive]}>
              Video Guide (YouTube)
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Media Player Container */}
          <View style={styles.mediaContainer}>
            {activeTab === 'exercisedb' ? (
              <View style={styles.gifWrapper}>
                {gifUrl && !imageError ? (
                  <>
                    <View style={styles.offlineBadgeRow}>
                      <MaterialCommunityIcons name="motion-play-outline" size={13} color={colors.accent} />
                      <Text style={[styles.offlineBadgeText, { color: colors.accent }]}>MOVEMENT DEMONSTRATION</Text>
                    </View>

                    <Image
                      source={{ uri: gifUrl }}
                      style={styles.guideImage}
                      resizeMode="contain"
                      onLoadStart={() => setIsImageLoading(true)}
                      onLoadEnd={() => setIsImageLoading(false)}
                      onError={() => {
                        setImageError(true);
                        setIsImageLoading(false);
                      }}
                    />
                  </>
                ) : imageError ? (
                  <View style={styles.placeholderBox}>
                    <MaterialCommunityIcons name="cloud-off-outline" size={40} color={colors.accent} />
                    <Text style={[styles.placeholderText, { color: colors.text, fontWeight: '700', fontSize: 14 }]}>
                      GIF Offline (Requires Initial Download)
                    </Text>
                    <Text style={styles.placeholderText}>
                      This animation requires internet on first view to save into offline cache. Once viewed online, it is saved on your device for offline use.
                    </Text>
                    <TouchableOpacity
                      style={styles.fallbackBtn}
                      onPress={() => {
                        setImageError(false);
                        setIsImageLoading(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="refresh" size={14} color={colors.accentContrastText} />
                      <Text style={styles.fallbackBtnText}>RETRY LOADING GIF</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.placeholderBox}>
                    <MaterialCommunityIcons name="image-off-outline" size={36} color={colors.textDim} />
                    <Text style={styles.placeholderText}>Motion demonstration not available for this exercise.</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.videoWrapper}>
                {videoId && !videoError ? (
                  <View style={styles.youtubeContainer}>
                    <YoutubePlayer
                      height={220}
                      play={false}
                      videoId={videoId}
                      webViewProps={{
                        androidLayerType: 'hardware',
                        domStorageEnabled: true,
                      }}
                      onError={(e: any) => {
                        console.warn('YouTube error:', e);
                        setVideoError(true);
                      }}
                    />
                  </View>
                ) : (
                  <View style={styles.placeholderBox}>
                    <MaterialCommunityIcons name="youtube" size={42} color={colors.textDim} />
                    <Text style={styles.placeholderText}>
                      {videoError
                        ? 'Video stream unavailable or network offline.'
                        : 'Video guide not available for this exercise.'}
                    </Text>
                    <TouchableOpacity
                      style={styles.fallbackBtn}
                      onPress={() => {
                        setVideoError(false);
                        setActiveTab('exercisedb');
                      }}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="animation-play" size={14} color={colors.accentContrastText} />
                      <Text style={styles.fallbackBtnText}>SWITCH TO MOTION DEMO</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Offline Information Note for YouTube */}
          {activeTab === 'video' && (
            <View style={styles.offlineNoticeBox}>
              <MaterialCommunityIcons name="information-outline" size={16} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.offlineNoticeTitle}>YouTube requires internet connection</Text>
                <Text style={styles.offlineNoticeText}>
                  Per YouTube terms and DRM policies, live video streaming requires an active internet connection.
                  For 100% offline training at the gym, use the Motion Demo tab above!
                </Text>
              </View>
            </View>
          )}

          {/* Description */}
          {exercise.description && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Overview</Text>
              <Text style={styles.bodyText}>{exercise.description}</Text>
            </View>
          )}

          {/* Muscle Focus */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Target Muscles</Text>
            <View style={styles.chipRow}>
              {exercise.targetMuscles?.map((muscle, i) => (
                <View key={i} style={styles.muscleChipPrimary}>
                  <Text style={styles.muscleChipTextPrimary}>{muscle}</Text>
                </View>
              ))}
              {exercise.secondaryMuscles?.map((muscle, i) => (
                <View key={i} style={styles.muscleChipSecondary}>
                  <Text style={styles.muscleChipTextSecondary}>{muscle}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Form Instructions */}
          {exercise.executionInstructions && exercise.executionInstructions.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Execution Steps</Text>
              {exercise.executionInstructions.map((step, idx) => (
                <View key={idx} style={styles.stepRow}>
                  <View style={styles.stepNumBox}>
                    <Text style={styles.stepNum}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Form Cues */}
          {exercise.formCues && exercise.formCues.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, { color: colors.accent }]}>Form Cues</Text>
              {exercise.formCues.map((cue, idx) => (
                <View key={idx} style={styles.cueRow}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={colors.accent} />
                  <Text style={styles.cueText}>{cue}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Common Mistakes */}
          {exercise.commonMistakes && exercise.commonMistakes.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, { color: colors.danger }]}>Common Mistakes</Text>
              {exercise.commonMistakes.map((mistake, idx) => (
                <View key={idx} style={styles.cueRow}>
                  <MaterialCommunityIcons name="alert-circle" size={16} color={colors.danger} />
                  <Text style={styles.cueText}>{mistake}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Footer Action */}
        {onStartExercise && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                onStartExercise(exercise);
                onClose();
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="play" size={18} color={colors.accentContrastText} />
              <Text style={styles.actionBtnText}>Start This Exercise</Text>
            </TouchableOpacity>
          </View>
        )}
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
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
      backgroundColor: colors.background,
    },
    exerciseTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
    },
    tagRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 2,
    },
    tag: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: 'monospace',
    },
    tagDot: {
      fontSize: 10,
      color: colors.textDim,
    },
    closeBtn: {
      padding: 6,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.inputBg,
      padding: 4,
      marginHorizontal: 16,
      marginTop: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      gap: 6,
    },
    tabBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 9,
      borderRadius: 8,
      gap: 6,
    },
    tabBtnActive: {
      backgroundColor: colors.accent,
    },
    tabBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
    },
    tabBtnTextActive: {
      color: colors.accentContrastText,
      fontWeight: '800',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      gap: 12,
    },
    mediaContainer: {
      minHeight: 230,
      backgroundColor: colors.cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      overflow: 'hidden',
    },
    gifWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
    },
    offlineBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.25)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      marginBottom: 8,
    },
    offlineBadgeText: {
      fontSize: 10,
      fontFamily: 'monospace',
      fontWeight: '800',
      color: '#10B981',
    },
    guideImage: {
      width: '100%',
      height: 190,
    },
    videoWrapper: {
      flex: 1,
      backgroundColor: '#000000',
      justifyContent: 'center',
    },
    youtubeContainer: {
      width: '100%',
      height: 220,
      backgroundColor: '#000000',
    },
    placeholderBox: {
      padding: 30,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    placeholderText: {
      color: colors.textDim,
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 18,
    },
    fallbackBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.accent,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      marginTop: 6,
    },
    fallbackBtnText: {
      fontSize: 11,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.5,
    },
    offlineNoticeBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: colors.accentSubtle,
      borderColor: colors.accent,
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
    },
    offlineNoticeTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accent,
      marginBottom: 2,
    },
    offlineNoticeText: {
      fontSize: 11,
      color: colors.textMuted,
      lineHeight: 15,
    },
    sectionCard: {
      backgroundColor: colors.cardBg,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      gap: 8,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: 0.5,
    },
    bodyText: {
      fontSize: 13,
      color: colors.text,
      lineHeight: 18,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    muscleChipPrimary: {
      backgroundColor: colors.accentSubtle,
      borderWidth: 1,
      borderColor: colors.accent,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    muscleChipTextPrimary: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.accent,
    },
    muscleChipSecondary: {
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    muscleChipTextSecondary: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textMuted,
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    stepNumBox: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.inputBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    stepNum: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.accent,
      fontFamily: 'monospace',
    },
    stepText: {
      flex: 1,
      fontSize: 13,
      color: colors.text,
      lineHeight: 18,
    },
    cueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    cueText: {
      flex: 1,
      fontSize: 12,
      color: colors.text,
    },
    footer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
      backgroundColor: colors.background,
    },
    actionBtn: {
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    actionBtnText: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.accentContrastText,
      letterSpacing: 0.5,
    },
  });
