import { StyleSheet, Text, View } from 'react-native'
import ResponseCard from './ResponseCard'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  confidence?: 'high' | 'medium' | 'low'
  responseTimeMs?: number
  toolsUsed?: string[]
}

interface ChatMessageProps {
  message: Message
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
      {isUser ? (
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message.content}</Text>
        </View>
      ) : (
        <ResponseCard
          answer={message.content}
          confidence={message.confidence ?? 'high'}
          responseTimeMs={message.responseTimeMs}
          toolsUsed={message.toolsUsed}
        />
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
  userBubble: {
    maxWidth: '85%',
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#f8fafc',
  },
})
