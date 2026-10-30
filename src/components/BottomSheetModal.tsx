import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  DimensionValue,
  StyleProp,
  ViewStyle,
  Easing,
  PanResponder,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFitness } from '../context/FitnessContext';

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
  const insets = useSafeAreaInsets();

  const [modalRendered, setModalRendered] = useState(visible);
  const slideAnim = useRef(new Animated.Value(600)).current;

  // Gradual Blur Interpolation:
  // As the sheet slides up (600 -> 0), the blur opacity smoothly transitions from 0 to 1.
  // As the sheet slides down (0 -> 600), the blur opacity smoothly transitions from 1 to 0.
  const blurOpacity = slideAnim.interpolate({
    inputRange: [0, 450],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Fast but smooth entrance animation
  const animateIn = () => {
    slideAnim.setValue(550);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  // Snappy fast exit animation
  const animateOut = (callback?: () => void) => {
    Animated.timing(slideAnim, {
      toValue: 600,
      duration: 160,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setModalRendered(false);
      callback?.();
    });
  };

  useEffect(() => {
    if (visible) {
      setModalRendered(true);
      animateIn();
    } else if (modalRendered) {
      animateOut();
    }
  }, [visible]);

  const handleBackdropPress = () => {
    animateOut(onClose);
  };

  // Interactive Pan Responder for pulling down to dismiss
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 4,
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            slideAnim.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 80 || gestureState.vy > 0.5) {
            // Dismiss snappy down
            animateOut(onClose);
          } else {
            // Snap back up smooth
            Animated.spring(slideAnim, {
              toValue: 0,
              tension: 130,
              friction: 9,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [onClose]
  );

  if (!modalRendered) return null;

  const bottomClearance = Math.max(insets.bottom, 12) + 8;

  return (
    <Modal
      visible={modalRendered}
      transparent
      animationType="none"
      onRequestClose={handleBackdropPress}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Dynamic Gradual Blur Backdrop - smoothly appears/disappears as sheet moves up/down */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: blurOpacity,
            },
          ]}
        >
          <BlurView
            intensity={isDark ? 85 : 65}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          {/* Subtle contrast glaze */}
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark ? 'rgba(5, 7, 14, 0.55)' : 'rgba(215, 222, 235, 0.42)',
              },
            ]}
          />
        </Animated.View>

        {/* Tap outside to dismiss */}
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        {/* Disconnected Floating Island Sheet Container */}
        <Animated.View
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
          {/* Top Drag Handle Bar */}
          {showHandle && (
            <View {...panResponder.panHandlers} style={styles.handleHitSlot}>
              <View
                style={[
                  styles.handle,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.18)',
                  },
                ]}
              />
            </View>
          )}

          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    position: 'relative',
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
    paddingBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 38,
    height: 4.5,
    borderRadius: 2.5,
  },
});
