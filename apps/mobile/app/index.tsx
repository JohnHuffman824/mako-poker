import { StyleSheet, Text, View } from 'react-native'

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mako Poker</Text>
      <Text style={styles.subtitle}>
        GTO Coach — Ask me anything about preflop strategy
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
})
