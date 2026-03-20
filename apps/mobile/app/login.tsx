import { useState } from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { router } from 'expo-router'
import * as authApi from '../src/api/auth'
import { saveToken, setUser } from '../src/stores/auth-store'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const result = isRegister
        ? await authApi.register(
            email.trim(),
            password,
            displayName.trim() || undefined
          )
        : await authApi.login(email.trim(), password)

      await saveToken(result.token)
      setUser(result.user)
      router.replace('/')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Authentication failed'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mako Poker</Text>
      <Text style={styles.subtitle}>
        {isRegister ? 'Create an account' : 'Sign in'}
      </Text>

      {isRegister && (
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Display name (optional)"
          placeholderTextColor="#64748b"
          autoCapitalize="words"
        />
      )}

      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor="#64748b"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />

      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#64748b"
        secureTextEntry
        autoComplete={
          isRegister ? 'new-password' : 'current-password'
        }
      />

      {error && (
        <Text style={styles.error}>{error}</Text>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#f8fafc" />
        ) : (
          <Text style={styles.buttonText}>
            {isRegister ? 'Create Account' : 'Sign In'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.toggle}
        onPress={() => {
          setIsRegister(!isRegister)
          setError(null)
        }}
      >
        <Text style={styles.toggleText}>
          {isRegister
            ? 'Already have an account? Sign in'
            : "Don't have an account? Register"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.skip}
        onPress={() => router.replace('/')}
      >
        <Text style={styles.skipText}>
          Skip — use without account
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#f8fafc',
    fontSize: 16,
    marginBottom: 12,
  },
  error: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  toggle: {
    marginTop: 16,
    alignItems: 'center',
  },
  toggleText: {
    color: '#3b82f6',
    fontSize: 14,
  },
  skip: {
    marginTop: 24,
    alignItems: 'center',
  },
  skipText: {
    color: '#64748b',
    fontSize: 14,
  },
})
