import React, { useMemo, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutChangeEvent,
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

// Interactive Animated Nav Tab Button with press scale & icon pop
const NavTabButton: React.FC<{
  tab: TabItem;
  isActive: boolean;
  onPress: () => void;
  colors: ThemeColors;
  styles: any;
}> = ({ tab, isActive, onPress, colors, styles }) => {
  const pressScale = useRef(new Animated.Value(1)).current;
  const iconScale = useRef(new Animated.Value(1)).current;

  // Pop icon spring whenever this tab becomes active
  useEffect(() => {
    if (isActive) {
      Animated.sequence([
        Animated.timing(iconScale, {
          toValue: 1.25,
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
      toValue: 0.88,
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

  return (
    <TouchableOpacity
      style={styles.tabButton}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      accessibilityLabel={`${tab.label} tab`}
    >
      <Animated.View
        style={[
          styles.tabContentInner,
          {
            transform: [{ scale: pressScale }],
          },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: iconScale }] }}>
          <MaterialCommunityIcons
            name={tab.icon}
            size={22}
            color={isActive ? colors.accent : colors.textDim}
          />
        </Animated.View>
        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
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
      { key: 'log', label: 'LOG', icon: 'weight-lifter' },
      { key: 'history', label: 'HISTORY', icon: 'history' },
      { key: 'routines', label: 'ROUTINES', icon: 'book-open-outline' },
      { key: 'metrics', label: 'METRICS', icon: 'chart-bar' },
      { key: 'profile', label: 'PROFILE', icon: 'account-outline' },
    ],
    []
  );

  const activeIndex = useMemo(
    () => Math.max(0, tabs.findIndex((t) => t.key === currentTab)),
    [tabs, currentTab]
  );

  const [containerWidth, setContainerWidth] = useState(0);
  const indicatorAnim = useRef(new Animated.Value(activeIndex)).current;

  // Spring glide animation across tabs
  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: activeIndex,
      friction: 8,
      tension: 68,
      useNativeDriver: true,
    }).start();
  }, [activeIndex]);

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const innerWidth = containerWidth > 0 ? containerWidth - 16 : 0; // paddingHorizontal: 8 * 2
  const tabWidth = innerWidth > 0 ? innerWidth / tabs.length : 0;
  const indicatorWidth = 22;

  const indicatorTranslateX = indicatorAnim.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: [
      8 + tabWidth * 0 + (tabWidth - indicatorWidth) / 2,
      8 + tabWidth * 1 + (tabWidth - indicatorWidth) / 2,
      8 + tabWidth * 2 + (tabWidth - indicatorWidth) / 2,
      8 + tabWidth * 3 + (tabWidth - indicatorWidth) / 2,
      8 + tabWidth * 4 + (tabWidth - indicatorWidth) / 2,
    ],
  });

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {tabs.map((tab) => {
        const isActive = currentTab === tab.key;
        return (
          <NavTabButton
            key={tab.key}
            tab={tab}
            isActive={isActive}
            onPress={() => onSelectTab(tab.key)}
            colors={colors}
            styles={styles}
          />
        );
      })}

      {/* Smooth Gliding Horizontal Active Indicator */}
      {tabWidth > 0 && (
        <Animated.View
          style={[
            styles.glidingIndicator,
            {
              width: indicatorWidth,
              transform: [{ translateX: indicatorTranslateX }],
            },
          ]}
        />
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 18,
      left: 16,
      right: 16,
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
      paddingVertical: 10,
      paddingHorizontal: 8,
      elevation: 20,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.65 : 0.24,
      shadowRadius: 18,
    },
    tabButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 2,
    },
    tabContentInner: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
    },
    tabLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.textDim,
      letterSpacing: 0.8,
    },
    tabLabelActive: {
      color: colors.accent,
    },
    glidingIndicator: {
      position: 'absolute',
      bottom: 6,
      left: 0,
      height: 3,
      borderRadius: 2,
      backgroundColor: colors.accent,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.45,
      shadowRadius: 4,
      elevation: 3,
    },
  });
