import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getState, logout } from '../src/stores/auth-store'
import { router } from 'expo-router'

const API_BASE = process.env.EXPO_PUBLIC_API_URL
  ?? 'http://localhost:8080'

interface Preset {
  id: string
  name: string
  gameType: string
  tableSize: string
  defaultStackBb: number | null
  isActive: boolean
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const { token } = getState()
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

export default function SettingsScreen() {
  const { user, token } = getState()
  const [presets, setPresets] = useState<Preset[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [gameType, setGameType] = useState('tournament')
  const [tableSize, setTableSize] = useState('6max')
  const [stackBb, setStackBb] = useState('')

  const loadPresets = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const response = await fetch(
        `${API_BASE}/presets`,
        { headers: authHeaders() }
      )
      if (response.ok) {
        setPresets(await response.json())
      }
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { loadPresets() }, [loadPresets])

  async function handleCreate() {
    if (!name.trim()) return
    await fetch(`${API_BASE}/presets`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        name: name.trim(),
        gameType,
        tableSize,
        defaultStackBb: stackBb ? Number(stackBb) : undefined,
      }),
    })
    setName('')
    setStackBb('')
    setShowForm(false)
    loadPresets()
  }

  async function handleActivate(id: string) {
    await fetch(`${API_BASE}/presets/${id}/activate`, {
      method: 'POST',
      headers: authHeaders(),
    })
    loadPresets()
  }

  async function handleDelete(id: string) {
    const doDelete = () => {
      fetch(`${API_BASE}/presets/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      }).then(() => loadPresets())
    }
    if (Platform.OS === 'web') {
      if (confirm('Delete this preset?')) doDelete()
    } else {
      Alert.alert('Delete preset?', '', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ])
    }
  }

  async function handleLogout() {
    await logout()
    router.replace('/login')
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        {user ? (
          <View style={styles.accountRow}>
            <Text style={styles.email}>{user.email}</Text>
            <TouchableOpacity onPress={handleLogout}>
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => router.push('/login')}
          >
            <Text style={styles.linkText}>
              Sign in to save presets
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {token && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Game Presets
            </Text>
            <TouchableOpacity
              onPress={() => setShowForm(!showForm)}
            >
              <Text style={styles.linkText}>
                {showForm ? 'Cancel' : '+ New'}
              </Text>
            </TouchableOpacity>
          </View>

          {showForm && (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Preset name"
                placeholderTextColor="#64748b"
              />
              <View style={styles.row}>
                <ToggleButton
                  label="Tournament"
                  active={gameType === 'tournament'}
                  onPress={() => setGameType('tournament')}
                />
                <ToggleButton
                  label="Cash"
                  active={gameType === 'cash'}
                  onPress={() => setGameType('cash')}
                />
              </View>
              <View style={styles.row}>
                <ToggleButton
                  label="6-max"
                  active={tableSize === '6max'}
                  onPress={() => setTableSize('6max')}
                />
                <ToggleButton
                  label="9-max"
                  active={tableSize === '9max'}
                  onPress={() => setTableSize('9max')}
                />
              </View>
              <TextInput
                style={styles.input}
                value={stackBb}
                onChangeText={setStackBb}
                placeholder="Default stack (BB, optional)"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreate}
              >
                <Text style={styles.createText}>
                  Create Preset
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {loading ? (
            <ActivityIndicator
              color="#3b82f6"
              style={styles.loader}
            />
          ) : (
            <FlatList
              data={presets}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <PresetRow
                  preset={item}
                  onActivate={handleActivate}
                  onDelete={handleDelete}
                />
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  No presets yet
                </Text>
              }
              scrollEnabled={false}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  )
}

function ToggleButton({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={[
        styles.toggle,
        active && styles.toggleActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.toggleLabel,
          active && styles.toggleLabelActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
}

function PresetRow({
  preset,
  onActivate,
  onDelete,
}: {
  preset: Preset
  onActivate: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <View style={styles.presetRow}>
      <TouchableOpacity
        style={styles.presetInfo}
        onPress={() => onActivate(preset.id)}
      >
        <View style={styles.presetHeader}>
          <Text style={styles.presetName}>{preset.name}</Text>
          {preset.isActive && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          )}
        </View>
        <Text style={styles.presetMeta}>
          {preset.gameType} &middot; {preset.tableSize}
          {preset.defaultStackBb
            ? ` \u00b7 ${preset.defaultStackBb}BB`
            : ''}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onDelete(preset.id)}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 8,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  email: {
    color: '#94a3b8',
    fontSize: 16,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
  },
  linkText: {
    color: '#3b82f6',
    fontSize: 14,
  },
  form: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 16,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  toggle: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: '#1e3a5f',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  toggleLabel: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  toggleLabelActive: {
    color: '#3b82f6',
  },
  createButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  createText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 20,
  },
  emptyText: {
    color: '#475569',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  presetInfo: {
    flex: 1,
  },
  presetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  presetName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '500',
  },
  activeBadge: {
    backgroundColor: '#166534',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  activeBadgeText: {
    color: '#4ade80',
    fontSize: 11,
    fontWeight: '600',
  },
  presetMeta: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 2,
  },
  deleteText: {
    color: '#ef4444',
    fontSize: 13,
    paddingLeft: 12,
  },
})
