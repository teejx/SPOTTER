import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';
import { UserProfile } from '../types';

interface PasswordCriteria {
  hasLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export const AuthScreen: React.FC = () => {
  const { login, register, loginGuest, isCloudConfigured } = useFitness();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [name, setName] = useState('');
  const [goal, setGoal] = useState<UserProfile['trainingGoal']>('Strength');
  const [weight, setWeight] = useState('75');
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guest modal state
  const [isGuestOpen, setIsGuestOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestGoal, setGuestGoal] = useState<UserProfile['trainingGoal']>('Strength');

  // Password criteria computation
  const criteria: PasswordCriteria = useMemo(() => {
    return {
      hasLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
    };
  }, [password]);

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const isAllPasswordCriteriaSatisfied =
    criteria.hasLength &&
    criteria.hasUpper &&
    criteria.hasLower &&
    criteria.hasNumber &&
    criteria.hasSpecial &&
    passwordsMatch;

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please provide your email / handle and password.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await login(email.trim(), password);
      if (!res.success) {
        setError(res.error || 'Login failed.');
      }
    } catch (e: any) {
      setError(e.message || 'Login encountered an error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      setError('Please enter your athlete name.');
      return;
    }
    if (!email.trim()) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!isAllPasswordCriteriaSatisfied) {
      setError('Please fulfill all password requirements before registering.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const numWeight = parseFloat(weight) || 75;
      const res = await register(email.trim(), password, name.trim(), goal, numWeight, unit);
      if (!res.success) {
        setError(res.error || 'Registration failed.');
      }
    } catch (e: any) {
      setError(e.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    try {
      await loginGuest({
        name: guestName.trim() || 'Guest Athlete',
        trainingGoal: guestGoal,
      });
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const goals: UserProfile['trainingGoal'][] = [
    'Strength',
    'Hypertrophy',
    'Endurance',
    'Functional',
    'General Fitness'
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="lightning-bolt" size={26} color="#000000" />
          </View>
          <Text style={styles.brandTagline}>SPOTTER ATHLETICS // CORE V2</Text>
          <Text style={styles.brandTitle}>TRAINING LOGBOOK</Text>
          <Text style={styles.brandSubtitle}>
            High-performance workout intelligence & athlete telemetry.
          </Text>
        </View>

        {/* Database Status Indicator */}
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, isCloudConfigured ? styles.statusDotCloud : styles.statusDotLocal]} />
          <Text style={styles.statusText}>
            {isCloudConfigured
              ? 'CLOUD SYNC ACTIVE (FIREBASE)'
              : 'LOCAL ENCRYPTED DATABASE'}
          </Text>
        </View>

        {/* Mode Switcher Tabs */}
        <View style={styles.modeContainer}>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'login' && styles.modeTabActive]}
            onPress={() => {
              setMode('login');
              setError(null);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.modeTabText, mode === 'login' && styles.modeTabTextActive]}>
              SIGN IN
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, mode === 'register' && styles.modeTabActive]}
            onPress={() => {
              setMode('register');
              setError(null);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.modeTabText, mode === 'register' && styles.modeTabTextActive]}>
              CREATE ACCOUNT
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Banner */}
        {error ? (
          <View style={styles.errorBox}>
            <MaterialCommunityIcons name="alert-circle" size={16} color="#ff4d4f" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Form Container */}
        <View style={styles.formCard}>
          {mode === 'register' && (
            <>
              {/* Athlete Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>ATHLETE NAME</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="account" size={18} color={Colors.textDim} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Alex River"
                    placeholderTextColor={Colors.textDim}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              {/* Training Goal Selector */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>TRAINING FOCUS</Text>
                <View style={styles.goalGrid}>
                  {goals.map((g) => {
                    const isSelected = goal === g;
                    return (
                      <TouchableOpacity
                        key={g}
                        style={[styles.goalBtn, isSelected && styles.goalBtnActive]}
                        onPress={() => setGoal(g)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.goalBtnText, isSelected && styles.goalBtnTextActive]}>
                          {g}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Body Weight & Unit */}
              <View style={styles.rowFields}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.label}>BODY WEIGHT</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[styles.input, { fontFamily: 'monospace', fontWeight: '700' }]}
                      placeholder="75"
                      placeholderTextColor={Colors.textDim}
                      keyboardType="decimal-pad"
                      value={weight}
                      onChangeText={setWeight}
                    />
                  </View>
                </View>

                <View style={[styles.fieldGroup, { width: 90 }]}>
                  <Text style={styles.label}>UNIT</Text>
                  <View style={styles.unitToggleRow}>
                    <TouchableOpacity
                      style={[styles.unitBtn, unit === 'kg' && styles.unitBtnActive]}
                      onPress={() => setUnit('kg')}
                    >
                      <Text style={[styles.unitBtnText, unit === 'kg' && styles.unitBtnTextActive]}>KG</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.unitBtn, unit === 'lbs' && styles.unitBtnActive]}
                      onPress={() => setUnit('lbs')}
                    >
                      <Text style={[styles.unitBtnText, unit === 'lbs' && styles.unitBtnTextActive]}>LBS</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </>
          )}

          {/* Email / Handle */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{mode === 'login' ? 'EMAIL OR USERNAME' : 'EMAIL ADDRESS'}</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="email-outline" size={18} color={Colors.textDim} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="athlete@spotter.app"
                placeholderTextColor={Colors.textDim}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="lock-outline" size={18} color={Colors.textDim} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor={Colors.textDim}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={Colors.textDim}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Registration Password Requirements Checklist */}
          {mode === 'register' && (
            <>
              {/* Confirm Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>CONFIRM PASSWORD</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="lock-check-outline" size={18} color={Colors.textDim} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Repeat password"
                    placeholderTextColor={Colors.textDim}
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <MaterialCommunityIcons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={Colors.textDim}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.criteriaCard}>
                <Text style={styles.criteriaTitle}>SECURITY CRITERIA:</Text>
                <View style={styles.criteriaRow}>
                  <MaterialCommunityIcons
                    name={criteria.hasLength ? 'check-circle' : 'circle-outline'}
                    size={14}
                    color={criteria.hasLength ? Colors.volt : Colors.textDim}
                  />
                  <Text style={[styles.criteriaText, criteria.hasLength && styles.criteriaTextDone]}>
                    8+ characters
                  </Text>
                </View>
                <View style={styles.criteriaRow}>
                  <MaterialCommunityIcons
                    name={criteria.hasUpper ? 'check-circle' : 'circle-outline'}
                    size={14}
                    color={criteria.hasUpper ? Colors.volt : Colors.textDim}
                  />
                  <Text style={[styles.criteriaText, criteria.hasUpper && styles.criteriaTextDone]}>
                    Uppercase letter (A-Z)
                  </Text>
                </View>
                <View style={styles.criteriaRow}>
                  <MaterialCommunityIcons
                    name={criteria.hasLower ? 'check-circle' : 'circle-outline'}
                    size={14}
                    color={criteria.hasLower ? Colors.volt : Colors.textDim}
                  />
                  <Text style={[styles.criteriaText, criteria.hasLower && styles.criteriaTextDone]}>
                    Lowercase letter (a-z)
                  </Text>
                </View>
                <View style={styles.criteriaRow}>
                  <MaterialCommunityIcons
                    name={criteria.hasNumber ? 'check-circle' : 'circle-outline'}
                    size={14}
                    color={criteria.hasNumber ? Colors.volt : Colors.textDim}
                  />
                  <Text style={[styles.criteriaText, criteria.hasNumber && styles.criteriaTextDone]}>
                    Number (0-9)
                  </Text>
                </View>
                <View style={styles.criteriaRow}>
                  <MaterialCommunityIcons
                    name={criteria.hasSpecial ? 'check-circle' : 'circle-outline'}
                    size={14}
                    color={criteria.hasSpecial ? Colors.volt : Colors.textDim}
                  />
                  <Text style={[styles.criteriaText, criteria.hasSpecial && styles.criteriaTextDone]}>
                    Special character (!@#$...)
                  </Text>
                </View>
                <View style={styles.criteriaRow}>
                  <MaterialCommunityIcons
                    name={passwordsMatch ? 'check-circle' : 'circle-outline'}
                    size={14}
                    color={passwordsMatch ? Colors.volt : Colors.textDim}
                  />
                  <Text style={[styles.criteriaText, passwordsMatch && styles.criteriaTextDone]}>
                    Passwords match
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* Primary Action Button */}
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              mode === 'register' && !isAllPasswordCriteriaSatisfied && styles.primaryBtnDisabled,
            ]}
            onPress={mode === 'login' ? handleLogin : handleRegister}
            disabled={isLoading || (mode === 'register' && !isAllPasswordCriteriaSatisfied)}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>
                  {mode === 'login' ? 'SIGN IN TO LOGBOOK' : 'CREATE ATHLETE PROFILE'}
                </Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color="#000000" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR EXPLORE IMMEDIATELY</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Guest Access Card */}
        <TouchableOpacity
          style={styles.guestCard}
          onPress={() => setIsGuestOpen(!isGuestOpen)}
          activeOpacity={0.8}
        >
          <View style={styles.guestLeft}>
            <View style={styles.guestIcon}>
              <MaterialCommunityIcons name="account-clock" size={20} color={Colors.volt} />
            </View>
            <View>
              <Text style={styles.guestTitle}>CONTINUE AS GUEST</Text>
              <Text style={styles.guestDesc}>Instant access • Preserved in local storage</Text>
            </View>
          </View>
          <MaterialCommunityIcons
            name={isGuestOpen ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={Colors.textDim}
          />
        </TouchableOpacity>

        {/* Expandable Guest Profile Config */}
        {isGuestOpen && (
          <View style={styles.guestFormCard}>
            <Text style={styles.label}>GUEST ATHLETE NAME</Text>
            <TextInput
              style={styles.guestInput}
              placeholder="e.g. Guest Lifter"
              placeholderTextColor={Colors.textDim}
              value={guestName}
              onChangeText={setGuestName}
            />

            <TouchableOpacity
              style={styles.guestSubmitBtn}
              onPress={handleGuestLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.guestSubmitBtnText}>ENTER LOGBOOK AS GUEST →</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.volt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: Colors.volt,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  brandTagline: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: Colors.volt,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceRaised,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'center',
    gap: 6,
    marginBottom: 16,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotCloud: {
    backgroundColor: Colors.volt,
  },
  statusDotLocal: {
    backgroundColor: '#3b82f6',
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  modeContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: Colors.surfaceRaised,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textDim,
    letterSpacing: 0.8,
  },
  modeTabTextActive: {
    color: Colors.volt,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 77, 79, 0.12)',
    borderColor: 'rgba(255, 77, 79, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#ff4d4f',
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: Colors.textDim,
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceRaised,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 44,
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  inputNoIcon: {
    height: 44,
    color: Colors.textPrimary,
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: '700',
    paddingHorizontal: 12,
    backgroundColor: Colors.surfaceRaised,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 12,
  },
  eyeBtn: {
    padding: 8,
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  goalBtn: {
    backgroundColor: Colors.surfaceRaised,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  goalBtnActive: {
    backgroundColor: Colors.volt,
    borderColor: Colors.volt,
  },
  goalBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  goalBtnTextActive: {
    color: '#000000',
  },
  rowFields: {
    flexDirection: 'row',
    gap: 10,
  },
  unitToggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceRaised,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 12,
    height: 44,
    padding: 3,
  },
  unitBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  unitBtnActive: {
    backgroundColor: Colors.volt,
  },
  unitBtnText: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: Colors.textDim,
  },
  unitBtnTextActive: {
    color: '#000000',
  },
  criteriaCard: {
    backgroundColor: Colors.surfaceRaised,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  criteriaTitle: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: Colors.textDim,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  criteriaText: {
    fontSize: 11,
    color: Colors.textDim,
    fontFamily: 'monospace',
  },
  criteriaTextDone: {
    color: Colors.textPrimary,
  },
  primaryBtn: {
    backgroundColor: Colors.volt,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    shadowColor: Colors.volt,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnDisabled: {
    opacity: 0.4,
  },
  primaryBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.surfaceBorder,
  },
  dividerText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: Colors.textDim,
    letterSpacing: 0.8,
  },
  guestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  guestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guestIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(212, 255, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  guestDesc: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  guestFormCard: {
    backgroundColor: Colors.surfaceRaised,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    gap: 10,
  },
  guestInput: {
    backgroundColor: Colors.surface,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 12,
    color: Colors.textPrimary,
    fontSize: 12,
  },
  guestSubmitBtn: {
    backgroundColor: Colors.surfaceBorder,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  guestSubmitBtnText: {
    color: Colors.volt,
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
});
