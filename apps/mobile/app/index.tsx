import { useCallback, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ChatInput from '../src/components/ChatInput'
import ChatMessage from '../src/components/ChatMessage'
import type { Message } from '../src/components/ChatMessage'
import { askQuestion } from '../src/api/client'

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const flatListRef = useRef<FlatList>(null)

  const handleSend = useCallback(async (text: string) => {
    setError(null)
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    }
    setMessages((prev) => [...prev, userMessage])
    setLoading(true)

    try {
      const response = await askQuestion(text)
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        confidence: response.confidence,
        responseTimeMs: response.responseTimeMs,
        toolsUsed: response.toolsUsed,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const scrollToEnd = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }, [])

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={
          Platform.OS === 'ios' ? 90 : 0
        }
      >
        {messages.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.title}>Mako Poker</Text>
            <Text style={styles.subtitle}>
              Ask me anything about preflop strategy
            </Text>
            <Text style={styles.hint}>
              Try: "Should I open AKs from the CO at 25BB
              in a 6max tournament?"
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChatMessage message={item} />
            )}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={scrollToEnd}
          />
        )}

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#3b82f6" size="small" />
            <Text style={styles.loadingText}>
              Analyzing...
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorRow}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <ChatInput onSend={handleSend} disabled={loading} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  flex: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  hint: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 24,
  },
  messageList: {
    paddingVertical: 12,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  loadingText: {
    color: '#94a3b8',
    marginLeft: 8,
    fontSize: 14,
  },
  errorRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
})
