import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert
} from 'react-native';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, setLoading, setError, setProfile } from '../../store/slices/authSlice';
import { signUp } from '../../services/authService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { spacing } from '../../theme/spacing';

const validationSchema = Yup.object({
  name: Yup.string().min(2, 'Name too short').required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().min(6, 'At least 6 characters').required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords do not match') // ← add null
    .required('Confirm your password'),
});

const SignUpScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector(state => state.auth);

  const formik = useFormik({
    initialValues: { name: '', email: '', password: '', confirmPassword: '' },
    validationSchema,
    onSubmit: async (values) => {
      dispatch(setLoading(true));
      try {
        const result = await signUp(values.email, values.password, values.name);
    
        if (result.success) {
          dispatch(setProfile({
            uid: result.user.uid,
            name: values.name,
            email: values.email,
            bio: '',
            profilePicture: '',
          }));
          dispatch(setUser({
            uid: result.user.uid,
            email: result.user.email,
            displayName: values.name,
          }));
        } else {
          dispatch(setError(result.error));
          Alert.alert('Sign Up Failed', result.error);
        }
      } catch (error) {
        Alert.alert('Error', error.message);
      } finally {
        dispatch(setLoading(false)); // ← always reset loading
      }
    },
  });

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Create Account ✨</Text>
        <Text style={styles.subtitle}>Join Social Connect today</Text>
      </View>

      <View style={styles.form}>
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
          label="Email"
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
          placeholder="Re-enter password"
          value={formik.values.confirmPassword}
          onChangeText={formik.handleChange('confirmPassword')}
          onBlur={formik.handleBlur('confirmPassword')}
          error={formik.touched.confirmPassword && formik.errors.confirmPassword}
          secureTextEntry
        />

        <Button
          title="Create Account"
          onPress={formik.handleSubmit}
          isLoading={isLoading}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  header: { marginBottom: spacing.xl },
  title: {
    fontSize: fonts.sizes.xxxl,
    fontWeight: fonts.weights.extraBold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: { fontSize: fonts.sizes.md, color: colors.text.secondary },
  form: { marginBottom: spacing.xl },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: { color: colors.text.secondary, fontSize: fonts.sizes.md },
  loginText: {
    color: colors.primary,
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.bold,
  },
});

export default SignUpScreen;