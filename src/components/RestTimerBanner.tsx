import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';

export const RestTimerBanner: React.FC = () => {
  const { restTimer } = useFitness();

  if (!restTimer.isRunning || restTimer.secondsRemaining <= 0) {
    return null;
  }

  const minutes = Math.floor(restTimer.secondsRemaining / 60);
  const seconds = restTimer.secondsRemaining % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        <View style={styles.pulseIconBox}>
          <MaterialCommunityIcons name="timer-outline" size={18} color="#000000" />
        </View>
        <View>
          <Text style={styles.timerTitle}>
            REST TIMER {restTimer.exerciseName ? `• ${restTimer.exerciseName}` : ''}
          </Text>
          <Text style={styles.timerCountdown}>{timeFormatted}</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.plusBtn}
          onPress={() => restTimer.addSeconds(30)}
          activeOpacity={0.7}
        >
          <Text style={styles.plusBtnText}>+30s</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={restTimer.stop}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="close" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceRaised,
    borderColor: Colors.volt,
    borderWidth: 1,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.volt,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  pulseIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.volt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  timerCountdown: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.volt,
    fontFamily: 'monospace',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  plusBtn: {
    backgroundColor: Colors.surfaceBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  plusBtnText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  closeBtn: {
    padding: 6,
  },
});
