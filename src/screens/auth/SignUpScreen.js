import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import {
  setUser,
  setLoading,
  setError,
  setProfile,
} from '../../store/slices/authSlice';
import { signUp } from '../../services/authService';
import { showGlobalToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { spacing } from '../../theme/spacing';
const validationSchema = Yup.object({
  name: Yup.string()
    .min(2, 'Name is too short')
    .required('Full name is required'),
  email: Yup.string()
    .email('Enter a valid email')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'At least 6 characters required')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords do not match')
    .required('Please confirm your password'),
});
const SignUpScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector(state => state.auth);

  const formik = useFormik({
    initialValues: { name: '', email: '', password: '', confirmPassword: '' },
    validationSchema,
    onSubmit: async values => {
      dispatch(setLoading(true));
      const result = await signUp(
        values.email.trim(),
        values.password,
        values.name.trim(),
      );
      if (result.success) {
        const profileData = {
          uid: result.user.uid,
          name: values.name.trim(),
          email: values.email.trim(),
          bio: '',
          profilePicture: '',
          followers: [],
          following: [],
        };
        dispatch(setProfile(profileData));
        dispatch(
          setUser({
            uid: result.user.uid,
            email: result.user.email,
            displayName: values.name.trim(),
          }),
        );
        showGlobalToast('Account created! Welcome 🎉', 'success');
      } else {
        dispatch(setError(result.error));
        showGlobalToast(result.error || 'Sign up failed', 'error');
      }
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Page Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.pageTitle}>Create Account</Text>
          <Text style={styles.pageSubtitle}>Join Social Connect today!</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={formik.values.name}
            onChangeText={formik.handleChange('name')}
            onBlur={formik.handleBlur('name')}
            error={formik.touched.name && formik.errors.name}
            autoCapitalize="words"
          />

          {/* Email */}
          <Input
            label="Email"
            placeholder="john.doe@email.com"
            value={formik.values.email}
            onChangeText={formik.handleChange('email')}
            onBlur={formik.handleBlur('email')}
            error={formik.touched.email && formik.errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Password */}
          <Input
            label="Password"
            placeholder="••••••••••"
            value={formik.values.password}
            onChangeText={formik.handleChange('password')}
            onBlur={formik.handleBlur('password')}
            error={formik.touched.password && formik.errors.password}
            secureTextEntry
          />

          {/* Confirm Password */}
          <Input
            label="Confirm Password"
            placeholder="••••••••••"
            value={formik.values.confirmPassword}
            onChangeText={formik.handleChange('confirmPassword')}
            onBlur={formik.handleBlur('confirmPassword')}
            error={
              formik.touched.confirmPassword && formik.errors.confirmPassword
            }
            secureTextEntry
          />
          <View style={styles.buttonWrapper}>
            <Button
              title="Create Account"
              onPress={formik.handleSubmit}
              isLoading={isLoading}
            />
          </View>
          {/* Login Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    paddingBottom: 40,
  },

  // ── Top Bar ──
  topBar: {
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#1A1A2E',
    fontWeight: '600',
    lineHeight: 22,
  },

  // ── Title Block ──
  titleBlock: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },

  // ── Form Card ──
  card: {
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },

  // ── Button ──
  buttonWrapper: {
    marginTop: 8,
    marginBottom: 4,
  },

  // ── Footer ──
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  loginLink: {
    color: '#5B50D6',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default SignUpScreen;
