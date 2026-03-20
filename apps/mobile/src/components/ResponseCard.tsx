import { StyleSheet, Text, View } from 'react-native'

interface ResponseCardProps {
  answer: string
  confidence: 'high' | 'medium' | 'low'
  responseTimeMs?: number
  toolsUsed?: string[]
}

const CONFIDENCE_LABEL: Record<string, string> = {
  high: 'High confidence',
  medium: 'Approximate',
  low: 'Low confidence',
}

const CONFIDENCE_BG: Record<string, string> = {
  high: '#166534',
  medium: '#854d0e',
  low: '#991b1b',
}

const CONFIDENCE_TEXT: Record<string, string> = {
  high: '#4ade80',
  medium: '#fbbf24',
  low: '#f87171',
}

const TOOL_LABELS: Record<string, string> = {
  lookup_preflop_range: 'Range lookup',
  lookup_push_fold: 'Push/fold chart',
  get_hand_recommendation: 'Hand analysis',
}

export default function ResponseCard({
  answer,
  confidence,
  responseTimeMs,
  toolsUsed,
}: ResponseCardProps) {
  const sections = parseAnswer(answer)

  return (
    <View style={styles.card}>
      {sections.map((section, i) => (
        <Text
          key={i}
          style={
            section.bold
              ? styles.recommendation
              : styles.explanation
          }
        >
          {section.text}
        </Text>
      ))}

      <View style={styles.footer}>
        <View
          style={[
            styles.badge,
            { backgroundColor: CONFIDENCE_BG[confidence] },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: CONFIDENCE_TEXT[confidence] },
            ]}
          >
            {CONFIDENCE_LABEL[confidence]}
          </Text>
        </View>

        <View style={styles.meta}>
          {toolsUsed && toolsUsed.length > 0 && (
            <Text style={styles.metaText}>
              {toolsUsed
                .map((t) => TOOL_LABELS[t] ?? t)
                .filter(unique)
                .join(', ')}
            </Text>
          )}
          {responseTimeMs != null && (
            <Text style={styles.metaText}>
              {(responseTimeMs / 1000).toFixed(1)}s
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}

interface Section {
  text: string
  bold: boolean
}

/**
 * Split the answer into a leading recommendation (first
 * line or sentence) and the rest as explanation.
 */
function parseAnswer(answer: string): Section[] {
  const lines = answer.split('\n').filter((l) => l.trim())
  if (lines.length === 0) return [{ text: answer, bold: false }]
  if (lines.length === 1) return [{ text: lines[0], bold: true }]

  return [
    { text: lines[0], bold: true },
    { text: lines.slice(1).join('\n'), bold: false },
  ]
}

function unique(value: string, index: number, arr: string[]) {
  return arr.indexOf(value) === index
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 14,
    maxWidth: '85%',
  },
  recommendation: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    lineHeight: 22,
    marginBottom: 8,
  },
  explanation: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 21,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  meta: {
    flexDirection: 'row',
    gap: 8,
  },
  metaText: {
    fontSize: 11,
    color: '#64748b',
  },
})
