import React, { useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';

export type TabKey = 'log' | 'history' | 'routines' | 'metrics' | 'profile';

interface BottomNavProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

interface TabItem {
  key: TabKey;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const NavTabButton: React.FC<{
  tab: TabItem;
  isActive: boolean;
  onPress: () => void;
  colors: ThemeColors;
  isDark: boolean;
  styles: any;
}> = ({ tab, isActive, onPress, colors, isDark, styles }) => {
  const pressScale = useRef(new Animated.Value(1)).current;
  const iconScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isActive) {
      Animated.sequence([
        Animated.timing(iconScale, {
          toValue: 1.18,
          duration: 110,
          useNativeDriver: true,
        }),
        Animated.spring(iconScale, {
          toValue: 1.0,
          friction: 4.5,
          tension: 90,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      iconScale.setValue(1);
    }
  }, [isActive]);

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.92,
      friction: 6,
      tension: 140,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1.0,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const iconColor = isActive ? colors.accent : colors.textMuted;

  return (
    <TouchableOpacity
      style={styles.tabButton}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.88}
      accessibilityLabel={`${tab.label} tab`}
    >
      <Animated.View
        style={[
          styles.tabContentInner,
          isActive && styles.tabContentInnerActive,
          {
            transform: [{ scale: pressScale }],
          },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: iconScale }] }}>
          <MaterialCommunityIcons
            name={tab.icon}
            size={20}
            color={iconColor}
          />
        </Animated.View>
        <Text
          style={[styles.tabLabel, isActive && styles.tabLabelActive]}
          numberOfLines={1}
          ellipsizeMode="clip"
        >
          {tab.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const { colors, isDark } = useFitness();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const tabs: TabItem[] = useMemo(
    () => [
      { key: 'log', label: 'LOG', icon: 'dumbbell' },
      { key: 'history', label: 'HISTORY', icon: 'history' },
      { key: 'routines', label: 'ROUTINES', icon: 'book-open-outline' },
      { key: 'metrics', label: 'METRICS', icon: 'chart-bar' },
      { key: 'profile', label: 'PROFILE', icon: 'account-outline' },
    ],
    []
  );

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = currentTab === tab.key;
        return (
          <NavTabButton
            key={tab.key}
            tab={tab}
            isActive={isActive}
            onPress={() => onSelectTab(tab.key)}
            colors={colors}
            isDark={isDark}
            styles={styles}
          />
        );
      })}
    </View>
  );
};

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 18,
      left: 14,
      right: 14,
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 32,
      borderWidth: 1.5,
      borderColor: colors.surfaceBorder,
      paddingVertical: 5,
      paddingHorizontal: 6,
      elevation: 16,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.45 : 0.08,
      shadowRadius: 18,
      alignItems: 'center',
      justifyContent: 'space-around',
    },
    // Uniform button target slot: all 5 navbar buttons have identical flex & height
    tabButton: {
      flex: 1,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 1,
    },
    // Standard uniform size for EVERY navbar button (48px height, 100% slot width)
    tabContentInner: {
      width: '100%',
      height: 48,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: 'transparent',
      overflow: 'hidden',
    },
    tabContentInnerActive: {
      backgroundColor: isDark ? (colors.surfaceRaised || '#2B2D4F') : '#EEECFA',
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(122, 111, 240, 0.35)' : 'rgba(99, 85, 230, 0.22)',
    },
    tabLabel: {
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 0.5,
      color: colors.textMuted,
      backgroundColor: 'transparent',
      includeFontPadding: false,
    },
    tabLabelActive: {
      color: colors.accent,
      fontWeight: '900',
    },
  });
