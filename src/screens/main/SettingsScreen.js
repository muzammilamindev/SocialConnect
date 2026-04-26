import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuth } from '../../store/slices/authSlice';
import { logout } from '../../services/authService';
import { spacing } from '../../theme/spacing';

const ACCOUNT_ROWS = [
  { id: 'edit', icon: '👤', label: 'Edit Profile', action: 'EditProfile' },
  { id: 'account', icon: '⚙️', label: 'Account Settings', action: null },
  { id: 'privacy', icon: '🔒', label: 'Privacy', action: null },
  { id: 'notifs', icon: '🔔', label: 'Notifications', action: null },
];

const SUPPORT_ROWS = [
  { id: 'help', icon: '❓', label: 'Help Center', action: null },
  { id: 'terms', icon: '📄', label: 'Terms of Service', action: null },
  { id: 'privacy2', icon: '🛡️', label: 'Privacy Policy', action: null },
];

const SectionLabel = ({ title }) => (
  <Text style={styles.sectionLabel}>{title}</Text>
);

const SettingRow = ({ icon, label, onPress, isLast }) => (
  <TouchableOpacity
    style={[styles.row, isLast && styles.rowLast]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.iconBox}>
      <Text style={styles.rowIcon}>{icon}</Text>
    </View>

    <Text style={styles.rowLabel}>{label}</Text>

    <Text style={styles.chevron}>›</Text>
  </TouchableOpacity>
);

const SettingsCard = ({ children }) => (
  <View style={styles.card}>{children}</View>
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

  const handleRowPress = action => {
    if (action === 'EditProfile') {
      navigation.navigate('Profile');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Settings</Text>

        <View style={styles.headerRight} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <SectionLabel title="Account" />

        <SettingsCard>
          {ACCOUNT_ROWS.map((row, index) => (
            <SettingRow
              key={row.id}
              icon={row.icon}
              label={row.label}
              onPress={() => handleRowPress(row.action)}
              isLast={index === ACCOUNT_ROWS.length - 1}
            />
          ))}
        </SettingsCard>

        <SectionLabel title="Support" />

        <SettingsCard>
          {SUPPORT_ROWS.map((row, index) => (
            <SettingRow
              key={row.id}
              icon={row.icon}
              label={row.label}
              onPress={() => handleRowPress(row.action)}
              isLast={index === SUPPORT_ROWS.length - 1}
            />
          ))}
        </SettingsCard>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>↩️</Text>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Social Connect v1.0.0</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  scrollContent: {
    paddingBottom: spacing.xl,
  },

  header: {
    paddingTop: 20,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },

  backIcon: {
    fontSize: 28,
    color: '#1A1A2E',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },

  headerRight: {
    width: 36,
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: 8,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: spacing.md,
    overflow: 'hidden',
    elevation: 1,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  rowLast: {
    borderBottomWidth: 0,
  },

  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },

  rowIcon: {
    fontSize: 18,
  },

  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A2E',
  },

  chevron: {
    fontSize: 22,
    color: '#9CA3AF',
  },

  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    paddingVertical: 14,
    borderRadius: 14,
    elevation: 2,
  },

  logoutIcon: {
    fontSize: 18,
    marginRight: 8,
  },

  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },

  versionText: {
    textAlign: 'center',
    marginTop: spacing.md,
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default SettingsScreen;
