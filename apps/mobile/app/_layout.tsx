import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { StyleSheet, View } from 'react-native'
import {
  loadToken,
  subscribe,
  getState,
} from '../src/stores/auth-store'
import * as authApi from '../src/api/auth'
import { setUser } from '../src/stores/auth-store'

export default function RootLayout() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    loadToken().then(async (token) => {
      if (token) {
        try {
          const user = await authApi.getMe(token)
          setUser(user)
        } catch {
          // Token expired — user can still use app unauthenticated
        }
      }
      setReady(true)
    })
  }, [])

  if (!ready) return null

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#f8fafc',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: '#0f172a' },
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: 'Mako Poker' }}
        />
        <Stack.Screen
          name="login"
          options={{
            title: 'Sign In',
            presentation: 'modal',
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
})
