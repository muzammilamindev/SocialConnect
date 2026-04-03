import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
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
import { scaleH } from '../../theme/responsive';

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
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Gradient Header */}
        <LinearGradient
          colors={colors.gradients.secondary}
          style={styles.gradientHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.headerEmoji}>✨</Text>
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSubtitle}>Join the community today</Text>
        </LinearGradient>

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
          <Input
            label="Email Address"
            placeholder="you@example.com"
            value={formik.values.email}
            onChangeText={formik.handleChange('email')}
            onBlur={formik.handleBlur('email')}
            error={formik.touched.email && formik.errors.email}
            keyboardType="email-address"
          />
          <Input
            label="Password"
            placeholder="At least 6 characters"
            value={formik.values.password}
            onChangeText={formik.handleChange('password')}
            onBlur={formik.handleBlur('password')}
            error={formik.touched.password && formik.errors.password}
            secureTextEntry
          />
          <Input
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={formik.values.confirmPassword}
            onChangeText={formik.handleChange('confirmPassword')}
            onBlur={formik.handleBlur('confirmPassword')}
            error={
              formik.touched.confirmPassword && formik.errors.confirmPassword
            }
            secureTextEntry
          />

          <View style={styles.termsRow}>
            <Text style={styles.termsText}>
              By signing up you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>

          <Button
            title="Create Account"
            onPress={formik.handleSubmit}
            isLoading={isLoading}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: colors.background },
  gradientHeader: {
    height: scaleH(220),
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerEmoji: { fontSize: 44, marginBottom: 8 },
  headerTitle: {
    fontSize: fonts.sizes.xxl,
    fontWeight: fonts.weights.black,
    color: colors.text.white,
  },
  headerSubtitle: {
    fontSize: fonts.sizes.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  card: {
    margin: spacing.md,
    marginTop: -20,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  termsRow: {
    marginBottom: spacing.md,
    marginTop: -spacing.xs,
  },
  termsText: {
    fontSize: fonts.sizes.xs,
    color: colors.text.secondary,
    lineHeight: 18,
    textAlign: 'center',
  },
  termsLink: {
    color: colors.primary,
    fontWeight: fonts.weights.semiBold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  footerText: { color: colors.text.secondary, fontSize: fonts.sizes.md },
  signInLink: {
    color: colors.primary,
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.bold,
  },
});

export default SignUpScreen;
