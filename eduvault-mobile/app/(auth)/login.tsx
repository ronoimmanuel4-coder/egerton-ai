import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Link, Redirect } from 'expo-router';

import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const { login, user, isInitializing } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isInitializing && user) {
    return <Redirect href="/(app)/dashboard" />;
  }

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!email.trim() || !password) {
      Alert.alert('Missing information', 'Please enter both email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ email: email.trim().toLowerCase(), password });
    } catch (error) {
      console.error('Login failed', error);
      Alert.alert('Login failed', 'Please verify your credentials and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Sign in to EduVault</Text>
        <Text style={styles.subtitle}>Access your resources and assessments anywhere.</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="username"
            style={styles.input}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            textContentType="password"
            style={styles.input}
          />
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          disabled={isSubmitting}
        >
          <Text style={styles.buttonText}>{isSubmitting ? 'Signing in…' : 'Sign in'}</Text>
        </TouchableOpacity>

        <Link href="/modal" asChild>
          <TouchableOpacity style={styles.helpLink}>
            <Text style={styles.helpText}>Need help? Contact support</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#f5f7fb',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    padding: 28,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    shadowColor: '#1a2b49',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { height: 12, width: 0 },
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a2b49',
  },
  subtitle: {
    fontSize: 14,
    color: '#495872',
    marginTop: 6,
    marginBottom: 24,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    color: '#1a2b49',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#c7d0e3',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 16,
    color: '#1a2b49',
  },
  button: {
    backgroundColor: '#2251ff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  helpLink: {
    marginTop: 18,
    alignItems: 'center',
  },
  helpText: {
    color: '#2251ff',
    fontWeight: '500',
  },
});
