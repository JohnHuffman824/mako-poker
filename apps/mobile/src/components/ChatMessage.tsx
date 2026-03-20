import { StyleSheet, Text, View } from 'react-native'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  confidence?: 'high' | 'medium' | 'low'
  responseTimeMs?: number
}

interface ChatMessageProps {
  message: Message
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: '#22c55e',
  medium: '#eab308',
  low: '#ef4444',
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        <Text
          style={[
            styles.text,
            isUser ? styles.userText : styles.assistantText,
          ]}
        >
          {message.content}
        </Text>
      </View>
      {!isUser && message.confidence && (
        <View style={styles.meta}>
          <View
            style={[
              styles.confidenceDot,
              {
                backgroundColor:
                  CONFIDENCE_COLORS[message.confidence],
              },
            ]}
          />
          <Text style={styles.metaText}>
            {message.confidence} confidence
          </Text>
          {message.responseTimeMs != null && (
            <Text style={styles.metaText}>
              {' '}
              &middot; {(message.responseTimeMs / 1000).toFixed(1)}s
            </Text>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#1e293b',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#f8fafc',
  },
  assistantText: {
    color: '#e2e8f0',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingLeft: 4,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
  },
})
