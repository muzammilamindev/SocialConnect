import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { forgotPassword } from '../../services/authService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { spacing } from '../../theme/spacing';

const validationSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Email is required'),
});

const ForgotPasswordScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const formik = useFormik({
    initialValues: { email: '' },
    validationSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      const result = await forgotPassword(values.email);
      setIsLoading(false);
      if (result.success) {
        setSent(true);
      } else {
        Alert.alert('Error', result.error);
      }
    },
  });

  if (sent) {
    return (
      <View style={styles.container}>
        <Text style={styles.successIcon}>📧</Text>
        <Text style={styles.title}>Email Sent!</Text>
        <Text style={styles.message}>
          Check your inbox for password reset instructions.
        </Text>
        <Button title="Back to Login" onPress={() => navigation.navigate('Login')} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Forgot Password 🔐</Text>
      <Text style={styles.subtitle}>
        Enter your email and we'll send you a reset link.
      </Text>

      <Input
        label="Email"
        placeholder="you@example.com"
        value={formik.values.email}
        onChangeText={formik.handleChange('email')}
        onBlur={formik.handleBlur('email')}
        error={formik.touched.email && formik.errors.email}
        keyboardType="email-address"
      />

      <Button
        title="Send Reset Link"
        onPress={formik.handleSubmit}
        isLoading={isLoading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  back: { position: 'absolute', top: spacing.xl, left: spacing.lg },
  backText: { color: colors.primary, fontSize: fonts.sizes.md },
  title: {
    fontSize: fonts.sizes.xxl,
    fontWeight: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fonts.sizes.md,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  successIcon: { fontSize: 64, textAlign: 'center', marginBottom: spacing.lg },
  message: {
    fontSize: fonts.sizes.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});

export default ForgotPasswordScreen;