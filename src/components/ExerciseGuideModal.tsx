import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
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
  if (!exercise) return null;

  const [activeTab, setActiveTab] = useState<GuideTab>('exercisedb');
  const [videoError, setVideoError] = useState(false);

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
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
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
            <MaterialCommunityIcons name="close" size={24} color={Colors.textPrimary} />
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
              color={activeTab === 'exercisedb' ? '#000000' : Colors.textMuted}
            />
            <Text style={[styles.tabBtnText, activeTab === 'exercisedb' && styles.tabBtnTextActive]}>
              Motion Demo (Offline)
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
                <View style={styles.offlineBadgeRow}>
                  <MaterialCommunityIcons name="check-circle" size={13} color="#10B981" />
                  <Text style={styles.offlineBadgeText}>OFFLINE READY ANIMATION</Text>
                </View>

                {gifUrl ? (
                  <Image
                    source={{ uri: gifUrl }}
                    style={styles.guideImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.placeholderBox}>
                    <MaterialCommunityIcons name="image-off-outline" size={36} color={Colors.textDim} />
                    <Text style={styles.placeholderText}>Motion loop not available for this exercise.</Text>
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
                    <MaterialCommunityIcons name="youtube" size={42} color={Colors.textDim} />
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
                      <MaterialCommunityIcons name="animation-play" size={14} color="#000000" />
                      <Text style={styles.fallbackBtnText}>SWITCH TO OFFLINE MOTION DEMO</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Offline Information Note for YouTube */}
          {activeTab === 'video' && (
            <View style={styles.offlineNoticeBox}>
              <MaterialCommunityIcons name="information-outline" size={16} color={Colors.volt} />
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
              <Text style={[styles.sectionTitle, { color: Colors.volt }]}>Form Cues</Text>
              {exercise.formCues.map((cue, idx) => (
                <View key={idx} style={styles.cueRow}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={Colors.volt} />
                  <Text style={styles.cueText}>{cue}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Common Mistakes */}
          {exercise.commonMistakes && exercise.commonMistakes.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, { color: Colors.danger }]}>Common Mistakes</Text>
              {exercise.commonMistakes.map((mistake, idx) => (
                <View key={idx} style={styles.cueRow}>
                  <MaterialCommunityIcons name="alert-circle" size={16} color={Colors.danger} />
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
              <MaterialCommunityIcons name="play" size={18} color="#000000" />
              <Text style={styles.actionBtnText}>Start This Exercise</Text>
            </TouchableOpacity>
          </View>
        )}
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  tag: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  tagDot: {
    fontSize: 10,
    color: Colors.textDim,
  },
  closeBtn: {
    padding: 6,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: 4,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
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
    backgroundColor: Colors.volt,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  tabBtnTextActive: {
    color: '#000000',
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
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
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
    color: Colors.textDim,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  fallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.volt,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 6,
  },
  fallbackBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  offlineNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(212, 255, 0, 0.06)',
    borderColor: 'rgba(212, 255, 0, 0.25)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  offlineNoticeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.volt,
    marginBottom: 2,
  },
  offlineNoticeText: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 15,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  bodyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  muscleChipPrimary: {
    backgroundColor: Colors.voltSubtle,
    borderWidth: 1,
    borderColor: Colors.volt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  muscleChipTextPrimary: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.volt,
  },
  muscleChipSecondary: {
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  muscleChipTextSecondary: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
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
    backgroundColor: Colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNum: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.volt,
    fontFamily: 'monospace',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
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
    color: Colors.textSecondary,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  actionBtn: {
    backgroundColor: Colors.volt,
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
    color: '#000000',
    letterSpacing: 0.5,
  },
});
