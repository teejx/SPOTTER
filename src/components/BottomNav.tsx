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

const NavTabButton: React.FC<{
  tab: TabItem;
  isActive: boolean;
  onPress: () => void;
  colors: ThemeColors;
  styles: any;
}> = ({ tab, isActive, onPress, colors, styles }) => {
  const pressScale = useRef(new Animated.Value(1)).current;
  const iconScale = useRef(new Animated.Value(1)).current;

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
      toValue: 0.90,
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
          isActive && styles.tabContentInnerActive,
          {
            transform: [{ scale: pressScale }],
          },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: iconScale }] }}>
          <MaterialCommunityIcons
            name={tab.icon}
            size={21}
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
      backgroundColor: isDark ? '#14161F' : '#FFFFFF',
      borderRadius: 32,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.95)',
      paddingVertical: 8,
      paddingHorizontal: 8,
      elevation: 20,
      shadowColor: isDark ? '#000000' : '#475569',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.65 : 0.22,
      shadowRadius: 20,
    },
    tabButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabContentInner: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 20,
    },
    tabContentInnerActive: {
      backgroundColor: isDark ? '#1F2232' : '#F1F5F9',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.05)',
      shadowColor: isDark ? '#000000' : '#CBD5E1',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.35 : 0.12,
      shadowRadius: 5,
      elevation: 3,
    },
    tabLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.textDim,
      letterSpacing: 0.8,
    },
    tabLabelActive: {
      color: colors.accent,
      fontWeight: '900',
    },
  });
