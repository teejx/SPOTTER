import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  DimensionValue,
  StyleProp,
  ViewStyle,
  PanResponder,
  BackHandler,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFitness } from '../context/FitnessContext';
import { useOverlay } from '../context/OverlayContext';
import { MOTION_SPRINGS, MOTION_DURATIONS, MOTION_EASINGS } from '../theme/motion';
import { ClayPressable } from './ClayMotion';

export interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor?: string;
  headerRight?: React.ReactNode;
  showCloseButton?: boolean;
  children?: React.ReactNode;
  height?: DimensionValue;
  maxHeight?: DimensionValue;
  scrollable?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  showHandle?: boolean;
  dismissOnBackdropPress?: boolean;
}

/**
 * Standardized Unified Application Bottom Sheet Component
 * Strictly calibrated to the reference visual direction (media_1793388919077_e6461f85.png).
 * 
 * Features:
 * - 1:1 Continuous finger-following downward drag gesture.
 * - Standardized circular close button (32x32) across the entire application.
 * - Standardized drag pill handle (38x4.5) centered at top.
 * - Standardized header layout (Title + Subtitle + HeaderRight + Close).
 * - Real-time progressive frosted glass background blur.
 * - Natural spring entrance and exit physics.
 * - Automatic keyboard clearance and safe area padding.
 */
export const BottomSheetModal: React.FC<BottomSheetModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  icon,
  iconColor,
  headerRight,
  showCloseButton = true,
  children,
  height,
  maxHeight = '90%',
  scrollable = false,
  containerStyle,
  contentStyle,
  showHandle = true,
  dismissOnBackdropPress = true,
}) => {
  const { colors, isDark } = useFitness();
  const { blurTargetRef, setOverlay, removeOverlay } = useOverlay();
  const insets = useSafeAreaInsets();
  const sheetId = useRef(`bottom_sheet_${Math.random().toString(36).substring(2, 9)}`).current;

  const [modalRendered, setModalRendered] = useState(visible);
  const slideAnim = useRef(new Animated.Value(700)).current;
  const isClosingRef = useRef(false);

  // Progressive Blur Interpolation synchronized directly with slide progress
  const blurOpacity = slideAnim.interpolate({
    inputRange: [0, 400],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Entrance animation: soft spring glide upward from below the screen
  const animateIn = useCallback(() => {
    isClosingRef.current = false;
    slideAnim.stopAnimation();
    slideAnim.setValue(600);
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: MOTION_SPRINGS.sheetSlide.friction,
      tension: MOTION_SPRINGS.sheetSlide.tension,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  // Dismiss animation: smooth acceleration downward
  const animateOut = useCallback((callback?: () => void) => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    slideAnim.stopAnimation();
    Animated.timing(slideAnim, {
      toValue: 700,
      duration: MOTION_DURATIONS.fast,
      easing: MOTION_EASINGS.accelerate,
      useNativeDriver: true,
    }).start(() => {
      setModalRendered(false);
      isClosingRef.current = false;
      callback?.();
    });
  }, [slideAnim]);

  useEffect(() => {
    if (visible) {
      setModalRendered(true);
      animateIn();
    } else if (modalRendered && !isClosingRef.current) {
      animateOut();
    }
  }, [visible, modalRendered, animateIn, animateOut]);

  const handleBackdropPress = useCallback(() => {
    if (dismissOnBackdropPress) {
      animateOut(onClose);
    }
  }, [dismissOnBackdropPress, animateOut, onClose]);

  const handleCloseButtonPress = useCallback(() => {
    animateOut(onClose);
  }, [animateOut, onClose]);

  // Handle hardware Android back button
  useEffect(() => {
    if (!modalRendered) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (dismissOnBackdropPress) {
        handleBackdropPress();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [modalRendered, dismissOnBackdropPress, handleBackdropPress]);

  // Continuous finger-following downward drag tracking
  const handleMove = useCallback((_: any, gestureState: any) => {
    if (gestureState.dy > 0) {
      // 1:1 Continuous tracking downward
      slideAnim.setValue(gestureState.dy);
    } else {
      // Gentle rubber-band resistance when pulling upward
      slideAnim.setValue(gestureState.dy * 0.18);
    }
  }, [slideAnim]);

  // Smart dismissal on release
  const handleRelease = useCallback((_: any, gestureState: any) => {
    // Dismiss if pulled down past 70px OR flicked downward with moderate velocity (> 0.3)
    if (gestureState.dy > 70 || gestureState.vy > 0.3) {
      animateOut(onClose);
    } else {
      // Snap back to 0 cleanly with calibrated clay spring
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: MOTION_SPRINGS.sheetSlide.friction,
        tension: MOTION_SPRINGS.sheetSlide.tension,
        useNativeDriver: true,
      }).start();
    }
  }, [slideAnim, animateOut, onClose]);

  // Dedicated Top Drag Zone PanResponder: Covers the drag handle + entire header region
  // Single unified PanResponder avoids any nested touch cancellation or mid-gesture snap-backs
  const topZonePanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          // Claim touch immediately when finger moves vertically more than 4px
          return Math.abs(gestureState.dy) > 4 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
        },
        onMoveShouldSetPanResponderCapture: (_, gestureState) => {
          return Math.abs(gestureState.dy) > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
        },
        onPanResponderGrant: () => {
          slideAnim.stopAnimation();
        },
        onPanResponderMove: handleMove,
        onPanResponderRelease: handleRelease,
        onPanResponderTerminationRequest: () => false,
        onPanResponderTerminate: handleRelease,
      }),
    [handleMove, handleRelease, slideAnim]
  );

  const bottomClearance = Math.max(insets.bottom, 12);
  const sheetBg = isDark ? '#1C1D22' : '#FFFFFF';
  const sheetBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  // Build the overlay tree rendered inside the root OverlayHost
  const overlayComponent = useMemo(() => {
    if (!modalRendered) return null;

    const hasHeader = Boolean(title || subtitle || icon || showCloseButton || headerRight);

    return (
      <View style={styles.overlayRoot} pointerEvents="box-none">
        {/* Dynamic Progressive Frosted-Glass Backdrop */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: blurOpacity,
            },
          ]}
        >
          <BlurView
            blurTarget={blurTargetRef}
            blurMethod="dimezisBlurViewSdk31Plus"
            intensity={isDark ? 28 : 20}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark
                  ? 'rgba(5, 7, 14, 0.22)'
                  : 'rgba(215, 222, 235, 0.18)',
              },
            ]}
          />
        </Animated.View>

        {/* Tap backdrop to dismiss */}
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        {/* Standardized Bottom Sheet Container */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: sheetBg,
              borderColor: sheetBorder,
              paddingBottom: bottomClearance,
              transform: [{ translateY: slideAnim }],
            },
            height !== undefined && { height },
            maxHeight !== undefined && { maxHeight },
            containerStyle,
          ]}
        >
          {/* Top Drag Zone (Handle + Header) with continuous 1:1 gesture tracking */}
          <View {...topZonePanResponder.panHandlers} style={styles.topDragZone}>
            {/* Standardized Drag Pill Handle */}
            <View style={styles.handleHitSlot}>
              {showHandle && (
                <View
                  style={[
                    styles.handlePill,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.28)'
                        : 'rgba(0, 0, 0, 0.22)',
                    },
                  ]}
                />
              )}
            </View>

            {/* Standardized Header Row */}
            {hasHeader && (
              <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                  {icon && (
                    <View
                      style={[
                        styles.iconBadge,
                        {
                          backgroundColor: (iconColor || colors.accent) + '1A',
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={icon}
                        size={18}
                        color={iconColor || colors.accent}
                      />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    {title && (
                      <Text
                        style={[
                          styles.headerTitle,
                          { color: colors.textPrimary },
                        ]}
                        numberOfLines={1}
                      >
                        {title}
                      </Text>
                    )}
                    {subtitle && (
                      <Text
                        style={[
                          styles.headerSubtitle,
                          { color: colors.textMuted },
                        ]}
                        numberOfLines={1}
                      >
                        {subtitle}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Right controls: Optional headerRight + STANDARDIZED CIRCULAR CLOSE BUTTON */}
                <View style={styles.headerRightControls}>
                  {headerRight}

                  {showCloseButton && (
                    <ClayPressable
                      variant="icon"
                      style={[
                        styles.standardCloseBtn,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.12)'
                            : 'rgba(0, 0, 0, 0.06)',
                        },
                      ]}
                      onPress={handleCloseButtonPress}
                      accessibilityLabel="Close bottom sheet"
                    >
                      <MaterialCommunityIcons
                        name="close"
                        size={18}
                        color={isDark ? '#FFFFFF' : '#111827'}
                      />
                    </ClayPressable>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* Sheet Body Content */}
          {scrollable ? (
            <ScrollView
              style={styles.scrollBody}
              contentContainerStyle={[styles.scrollContent, contentStyle]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          ) : (
            <View style={[styles.bodyContent, contentStyle]}>
              {children}
            </View>
          )}
        </Animated.View>
      </View>
    );
  }, [
    modalRendered,
    blurOpacity,
    blurTargetRef,
    isDark,
    handleBackdropPress,
    sheetBg,
    sheetBorder,
    bottomClearance,
    slideAnim,
    height,
    maxHeight,
    containerStyle,
    topZonePanResponder.panHandlers,
    showHandle,
    title,
    subtitle,
    icon,
    iconColor,
    colors,
    headerRight,
    showCloseButton,
    handleCloseButtonPress,
    scrollable,
    contentStyle,
    children,
  ]);

  useEffect(() => {
    if (modalRendered) {
      setOverlay(sheetId, overlayComponent);
    } else {
      removeOverlay(sheetId);
    }

    return () => {
      removeOverlay(sheetId);
    };
  }, [modalRendered, overlayComponent, setOverlay, removeOverlay, sheetId]);

  return null;
};

const styles = StyleSheet.create({
  overlayRoot: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  sheetContainer: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 24,
  },
  topDragZone: {
    width: '100%',
    paddingBottom: 4,
  },
  handleHitSlot: {
    width: '100%',
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handlePill: {
    width: 38,
    height: 4.5,
    borderRadius: 2.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 10,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Standardized 32x32 circular close button strictly matching reference
  standardCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  scrollBody: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
});
