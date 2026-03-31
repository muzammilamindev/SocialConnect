import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuth } from '../../store/slices/authSlice';
import { logout } from '../../services/authService';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { spacing } from '../../theme/spacing';

const SettingRow = ({ icon, label, onPress, destructive }) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.rowIcon}>{icon}</Text>
    <Text style={[styles.rowLabel, destructive && styles.destructive]}>
      {label}
    </Text>
    <Text style={styles.chevron}>›</Text>
  </TouchableOpacity>
);

const SettingsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { profile } = useSelector(state => state.auth);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          dispatch(clearAuth());
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.section}>
        <SettingRow
          icon="👤"
          label="Edit Profile"
          onPress={() => navigation.navigate('Profile')}
        />
        <SettingRow icon="📧" label={profile?.email || 'Email'} />
      </View>

      <Text style={styles.sectionTitle}>Preferences</Text>
      <View style={styles.section}>
        <SettingRow icon="🔔" label="Notifications" onPress={() => {}} />
        <SettingRow icon="🎨" label="Appearance" onPress={() => {}} />
      </View>

      <Text style={styles.sectionTitle}>About</Text>
      <View style={styles.section}>
        <SettingRow icon="ℹ️" label="About Social Connect" onPress={() => {}} />
        <SettingRow icon="🔒" label="Privacy Policy" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <SettingRow
          icon="🚪"
          label="Logout"
          onPress={handleLogout}
          destructive
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  sectionTitle: {
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.semiBold,
    color: colors.text.secondary,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginHorizontal: spacing.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowIcon: { fontSize: 20, marginRight: spacing.md },
  rowLabel: {
    flex: 1,
    fontSize: fonts.sizes.md,
    color: colors.text.primary,
  },
  destructive: { color: colors.error },
  chevron: {
    fontSize: fonts.sizes.xl,
    color: colors.text.light,
  },
});

export default SettingsScreen;