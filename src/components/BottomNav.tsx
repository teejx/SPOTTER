import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';

export type TabKey = 'log' | 'history' | 'routines' | 'metrics' | 'profile';

interface BottomNavProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const { colors, isDark } = useFitness();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const tabs: { key: TabKey; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
    { key: 'log', label: 'LOG', icon: 'weight-lifter' },
    { key: 'history', label: 'HISTORY', icon: 'history' },
    { key: 'routines', label: 'ROUTINES', icon: 'book-open-outline' },
    { key: 'metrics', label: 'METRICS', icon: 'chart-bar' },
    { key: 'profile', label: 'PROFILE', icon: 'account-outline' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = currentTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabButton}
            onPress={() => onSelectTab(tab.key)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={22}
              color={isActive ? colors.accent : colors.textDim}
            />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {isActive ? <View style={styles.activeIndicator} /> : <View style={styles.indicatorPlaceholder} />}
          </TouchableOpacity>
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
    activeIndicator: {
      width: 18,
      height: 2.5,
      borderRadius: 2,
      backgroundColor: colors.accent,
      marginTop: 2,
    },
    indicatorPlaceholder: {
      width: 18,
      height: 2.5,
      marginTop: 2,
    },
  });
