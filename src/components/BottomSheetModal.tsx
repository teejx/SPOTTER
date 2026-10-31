import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  DimensionValue,
  StyleProp,
  ViewStyle,
  Easing,
  PanResponder,
  BackHandler,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFitness } from '../context/FitnessContext';
import { useOverlay } from '../context/OverlayContext';

export interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: DimensionValue;
  maxHeight?: DimensionValue;
  containerStyle?: StyleProp<ViewStyle>;
  showHandle?: boolean;
}

export const BottomSheetModal: React.FC<BottomSheetModalProps> = ({
  visible,
  onClose,
  children,
  height,
  maxHeight = '88%',
  containerStyle,
  showHandle = true,
}) => {
  const { colors, isDark } = useFitness();
  const { blurTargetRef, setOverlay, removeOverlay } = useOverlay();
  const insets = useSafeAreaInsets();
  const sheetId = useRef(`bottom_sheet_${Math.random().toString(36).substring(2, 9)}`).current;

  const [modalRendered, setModalRendered] = useState(visible);
  const slideAnim = useRef(new Animated.Value(600)).current;
  const isClosingRef = useRef(false);

  // Progressive Blur Interpolation:
  // - slideAnim = 0 (fully expanded): blurOpacity = 1 (optimal calibrated frosted blur)
  // - slideAnim = 200 (halfway): blurOpacity = 0.50 (moderate soft blur)
  // - slideAnim >= 400 (dismissed): blurOpacity = 0 (completely clear background)
  const blurOpacity = slideAnim.interpolate({
    inputRange: [0, 400],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Fast but smooth entrance animation
  const animateIn = useCallback(() => {
    isClosingRef.current = false;
    slideAnim.stopAnimation();
    slideAnim.setValue(500);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  // Snappy fast exit animation with guard to prevent race conditions
  const animateOut = useCallback((callback?: () => void) => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    slideAnim.stopAnimation();
    Animated.timing(slideAnim, {
      toValue: 600,
      duration: 150,
      easing: Easing.in(Easing.cubic),
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
    animateOut(onClose);
  }, [animateOut, onClose]);

  // Handle hardware Android back button
  useEffect(() => {
    if (!modalRendered) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackdropPress();
      return true;
    });
    return () => subscription.remove();
  }, [modalRendered, handleBackdropPress]);

  // Common drag motion handler
  const handleMove = useCallback((_: any, gestureState: any) => {
    if (gestureState.dy > 0) {
      slideAnim.setValue(gestureState.dy);
    } else {
      slideAnim.setValue(0);
    }
  }, [slideAnim]);

  // Common release / dismiss handler
  const handleRelease = useCallback((_: any, gestureState: any) => {
    // If dragged downward past 45px or flicked down with velocity > 0.25, dismiss immediately
    if (gestureState.dy > 45 || gestureState.vy > 0.25) {
      animateOut(onClose);
    } else {
      // Snap back to open position cleanly
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 160,
        friction: 12,
        useNativeDriver: true,
      }).start();
    }
  }, [slideAnim, animateOut, onClose]);

  // 1. Dedicated Top Handle PanResponder: claims touch immediately on touch-down
  const handlePanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
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

  // 2. Sheet-wide PanResponder: intercepts vertical downward drags on the card header/body
  const sheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return gestureState.dy > 12 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.5;
        },
        onMoveShouldSetPanResponderCapture: (_, gestureState) => {
          return gestureState.dy > 14 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.5;
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

  const bottomClearance = Math.max(insets.bottom, 12) + 8;

  // Build the overlay tree rendered inside the root OverlayHost (outside BlurTargetView)
  const overlayComponent = useMemo(() => {
    if (!modalRendered) return null;

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
          {/* Calibrated blur intensity: background shapes and colors remain recognizable through frosted glass */}
          <BlurView
            blurTarget={blurTargetRef}
            blurMethod="dimezisBlurViewSdk31Plus"
            intensity={isDark ? 28 : 20}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          {/* Subtle contrast glaze for claymorphic clarity without muddying background */}
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark
                  ? 'rgba(5, 7, 14, 0.20)'
                  : 'rgba(215, 222, 235, 0.16)',
              },
            ]}
          />
        </Animated.View>

        {/* Tap backdrop to dismiss */}
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        {/* Disconnected Floating Island Sheet Container with Sheet PanResponder */}
        <Animated.View
          {...sheetPanResponder.panHandlers}
          style={[
            styles.floatingSheet,
            {
              backgroundColor: colors.surface,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              marginBottom: bottomClearance,
              transform: [{ translateY: slideAnim }],
            },
            height !== undefined && { height },
            maxHeight !== undefined && { maxHeight },
            containerStyle,
          ]}
        >
          {/* Dedicated Top Drag Handle Slot with Handle PanResponder */}
          <View {...handlePanResponder.panHandlers} style={styles.handleHitSlot}>
            {showHandle && (
              <View
                style={[
                  styles.handle,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.30)'
                      : 'rgba(0, 0, 0, 0.22)',
                  },
                ]}
              />
            )}
          </View>

          {children}
        </Animated.View>
      </View>
    );
  }, [
    modalRendered,
    blurOpacity,
    blurTargetRef,
    isDark,
    colors.surface,
    bottomClearance,
    slideAnim,
    height,
    maxHeight,
    containerStyle,
    showHandle,
    handlePanResponder,
    sheetPanResponder,
    handleBackdropPress,
    children,
  ]);

  // Synchronize overlay registration with OverlayHost
  useEffect(() => {
    if (modalRendered && overlayComponent) {
      setOverlay(sheetId, overlayComponent);
    } else {
      removeOverlay(sheetId);
    }

    return () => {
      removeOverlay(sheetId);
    };
  }, [modalRendered, overlayComponent, sheetId, setOverlay, removeOverlay]);

  return null;
};

const styles = StyleSheet.create({
  overlayRoot: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  // Floating disconnected sheet - elevated with all four corners rounded and margins on all sides
  floatingSheet: {
    marginHorizontal: 16,
    borderRadius: 28,
    borderWidth: 1.5,
    overflow: 'hidden',
    paddingBottom: 16,
    elevation: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
  },
  handleHitSlot: {
    width: '100%',
    paddingTop: 12,
    paddingBottom: 10,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 3,
  },
});
