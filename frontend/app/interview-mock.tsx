import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useExamStore } from '@/stores/examStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useInterviewStore } from '@/stores/interviewStore';
import { useActivityStore } from '@/stores/activityStore';
import { ScoreCardSheet } from '@/components/scorecard/ScoreCardSheet';
import { PICard } from '@/components/scorecard/cards/PICard';
import { GDCard } from '@/components/scorecard/cards/GDCard';
import type { CardVars } from '@/config/scorecard-templates';
import type { StudySession } from '@/stores/activityStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatMessage = {
  id: string;
  role: 'user' | 'ai';
  text: string;
};

type GeminiContent = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

type SessionSummary = {
  overallRating: number;
  strengths: string[];
  improvements: string[];
  summaryText: string;
};

// ─── System Prompts ───────────────────────────────────────────────────────────

function buildSystemPrompt(
  mode: string,
  psuName: string,
  psuFullName: string,
  branchName: string,
  allCoreSubjects: string[],
  userIntro: string,
  sectorHint: string,
  techSummary: string,
  gdTopics?: string[],
): string {
  const summaryInstruction = `
When giving your final evaluation/summary, start with this EXACT JSON block on its own line (then continue with your narrative):
SUMMARY_JSON:{"overallRating":X,"strengths":["...","..."],"improvements":["...","..."]}
Replace X with a number 1–10. Include exactly 2–3 strings in each array.`;

  if (mode === 'gd') {
    const topicsBlock = gdTopics && gdTopics.length > 0
      ? `\nSample GD topics for reference (these are illustrative examples only — NOT verified actual past exam topics from ${psuName}; use them purely as style and theme inspiration to generate a completely NEW, original topic):\n${gdTopics.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n`
      : '';

    return `You are conducting a Group Discussion simulation for ${psuFullName} recruitment.
Candidate introduction: "${userIntro}"
${topicsBlock}
Generate ONE relevant, original GD topic for ${psuName} (sector: ${sectorHint}). The topic must be fresh — inspired by the theme of the samples above but not copied from them.
Three virtual candidates participate: Aisha, Rahul, and Dev. Each has distinct, slightly different viewpoints.

Structure the GD in these exact phases:

PREP PHASE: Announce the topic. Tell the candidate: "You have 90 seconds to prepare your thoughts. Take your time."

OPENING PHASE:
- Aisha gives a 2–3 sentence opening statement
- Rahul gives a 2–3 sentence opening statement
- Dev gives a 2–3 sentence opening statement
- Then write exactly: "🎯 YOUR TURN (Opening): Share your opening statement on this topic."

DISCUSSION PHASE (repeat 3 times — wait for candidate's response each time):
After candidate speaks, have 1–2 virtual candidates respond naturally with different angles or counter-arguments.
Then write: "🎯 YOUR TURN (Discussion): Add your point or counter an argument made above."

CONCLUSION PHASE:
- Aisha gives a 2–3 sentence conclusion
- Rahul gives a conclusion
- Dev gives a conclusion
- Then write: "🎯 YOUR TURN (Conclusion): Give your final summary statement."

EVALUATION (after candidate's conclusion):
Provide structured evaluation:
Content Quality: X/10
Communication Clarity: X/10
Assertiveness: X/10
Listening & Responsiveness: X/10
Leadership & Initiative: X/10
Overall Verdict: [Strong/Average/Needs Improvement]
Key Strengths (2): ...
Areas to Improve (2): ...

${summaryInstruction}

Begin now with the PREP PHASE. Announce the topic first.`;
  }

  if (mode === 'technical') {
    return `You are a senior ${branchName} engineer and technical interview panelist for ${psuFullName}.

Candidate background: "${userIntro}"

Reference subjects (standard ${branchName} engineering syllabus — use as a guide only; actual interview questions will vary based on candidate responses and ${psuName}'s focus areas): ${allCoreSubjects.join(', ')}

Instructions:
- Conduct a formal technical interview covering ${branchName} core subjects
- Generate your own original questions — do NOT recycle textbook questions verbatim
- Connect at least 3 questions to ${psuName}'s specific operations or projects
- After each answer: give a brief 1–2 line assessment, then ask the next question
- Adapt difficulty: go deeper if answer is strong, simplify or clarify if weak
- Ask 8–10 questions total
- Keep the conversation flowing naturally — do not label each exchange
- When the user sends "END SESSION", output your structured summary

${summaryInstruction}

Also end your summary with:
STUDY_TOPICS:["topic1","topic2","topic3"]
(3 topics the candidate should study before the actual interview)

Start: "Good morning. I've reviewed your profile. [Reference something specific from their background]. Let's begin the technical round. [First question]"`;
  }

  // HR mode
  const techContext = techSummary
    ? `This candidate just completed the technical round. Technical assessment:\n"${techSummary}"\n\nReference the technical performance naturally during HR questions (e.g., if candidate showed depth in power systems, ask how they'd apply that at ${psuName}).`
    : `This is a standalone HR interview — no technical round was completed.`;

  return `You are the HR interviewer for ${psuFullName}.
${techContext}

Candidate introduction: "${userIntro}"

Conduct a professional HR interview. Cover: motivation for joining ${psuName}, career goals, teamwork, leadership, adaptability, integrity, and ${psuName}-specific knowledge (recent projects, CSR, sector position).

Ask 8–10 questions total. After all questions or when user sends "END SESSION", give your HR evaluation.

${summaryInstruction}

Start: "Thank you for joining us today. Please have a seat. Let me start by asking — [reference something from their intro] — tell me more about yourself and why you want to join ${psuName}."`;
}

// ─── Gemini multi-turn call ───────────────────────────────────────────────────

async function sendMessage(
  apiKey: string,
  modelId: string,
  history: GeminiContent[],
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: history }),
  });
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response from Gemini');
  return text;
}

// ─── Parse SUMMARY_JSON ────────────────────────────────────────────────────────

function parseSummaryJson(text: string): Partial<SessionSummary> {
  try {
    const match = text.match(/SUMMARY_JSON:(\{[^}]+\}(?:\s*\])?)/);
    if (!match) return {};
    // The JSON might have arrays — match more carefully
    const jsonStart = text.indexOf('SUMMARY_JSON:');
    if (jsonStart === -1) return {};
    const jsonStr = text.slice(jsonStart + 'SUMMARY_JSON:'.length).trim();
    // Find balanced braces
    let depth = 0;
    let end = 0;
    for (let i = 0; i < jsonStr.length; i++) {
      if (jsonStr[i] === '{') depth++;
      else if (jsonStr[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
    }
    const parsed = JSON.parse(jsonStr.slice(0, end));
    return {
      overallRating: Number(parsed.overallRating) || 5,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
    };
  } catch {
    return {};
  }
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const MODE_LABELS: Record<string, string> = {
  gd: 'Group Discussion',
  technical: 'Technical PI',
  hr: 'HR Interview',
};

// ─── AI Text Formatter ────────────────────────────────────────────────────────

/**
 * Render inline bold (**text**) within a <Text> parent.
 * Returns an array of strings and <Text> elements.
 */
function inlineBold(text: string, baseColor: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <Text key={i} style={{ fontFamily: 'Inter_600SemiBold', color: baseColor }}>{part.slice(2, -2)}</Text>
      : part
  );
}

/**
 * Formats an AI message into structured RN elements.
 * Handles: 🎯 YOUR TURN prompts, **bold**, bullet/numbered lists,
 * "Label: value" score lines, and plain paragraphs.
 */
function renderFormattedText(text: string, isUser: boolean): React.ReactElement {
  const textColor = isUser ? Colors.white : Colors.onSurface;
  const mutedColor = isUser ? 'rgba(255,255,255,0.75)' : Colors.onSurfaceVariant;
  const lines = text.split('\n');
  const elements: React.ReactElement[] = [];
  let prevEmpty = false;

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (!trimmed) {
      if (!prevEmpty && elements.length > 0) {
        elements.push(<View key={`sp-${i}`} style={{ height: 6 }} />);
      }
      prevEmpty = true;
      return;
    }
    prevEmpty = false;

    // ── 🎯 YOUR TURN highlight ──────────────────────────────────────────────
    if (trimmed.includes('🎯')) {
      elements.push(
        <View key={i} style={fmtStyles.yourTurnLine}>
          <Ionicons name="mic" size={13} color={Colors.gold} />
          <Text style={fmtStyles.yourTurnLineText}>{trimmed.replace('🎯 ', '')}</Text>
        </View>
      );
      return;
    }

    // ── Bullet list: "- item" / "• item" / "* item" ─────────────────────────
    const bulletMatch = trimmed.match(/^[-•*]\s+(.+)/);
    if (bulletMatch) {
      elements.push(
        <View key={i} style={fmtStyles.listRow}>
          <Text style={[fmtStyles.bullet, { color: isUser ? Colors.gold : Colors.primary }]}>•</Text>
          <Text style={[fmtStyles.listText, { color: textColor, flex: 1 }]}>
            {inlineBold(bulletMatch[1], textColor)}
          </Text>
        </View>
      );
      return;
    }

    // ── Numbered list: "1. item" ─────────────────────────────────────────────
    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (numMatch) {
      elements.push(
        <View key={i} style={fmtStyles.listRow}>
          <Text style={[fmtStyles.bullet, { color: isUser ? Colors.gold : Colors.primary }]}>{numMatch[1]}.</Text>
          <Text style={[fmtStyles.listText, { color: textColor, flex: 1 }]}>
            {inlineBold(numMatch[2], textColor)}
          </Text>
        </View>
      );
      return;
    }

    // ── Label: Value (interview score lines, e.g. "Content Quality: 8/10") ──
    // Matches lines starting with Title-Case or ALL-CAPS label before a colon
    const labelMatch = trimmed.match(/^([A-Z][A-Za-z &/]{1,34}):\s*(.+)/);
    if (labelMatch) {
      elements.push(
        <Text key={i} style={[fmtStyles.bodyLine, { color: textColor }]}>
          <Text style={[fmtStyles.labelKey, { color: isUser ? Colors.gold : Colors.primary }]}>{labelMatch[1]}: </Text>
          <Text style={{ color: textColor }}>{inlineBold(labelMatch[2], textColor)}</Text>
        </Text>
      );
      return;
    }

    // ── Default paragraph ────────────────────────────────────────────────────
    elements.push(
      <Text key={i} style={[fmtStyles.bodyLine, { color: textColor }]}>
        {inlineBold(trimmed, textColor)}
      </Text>
    );
  });

  return <View style={fmtStyles.formattedRoot}>{elements}</View>;
}

const fmtStyles = StyleSheet.create({
  formattedRoot: { gap: 3 },
  bodyLine: { ...Typography.bodyMd, lineHeight: 22 },
  yourTurnLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginVertical: 4,
  },
  yourTurnLineText: {
    ...Typography.bodyMd,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.white,
    flex: 1,
  },
  listRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  bullet: { ...Typography.bodyMd, fontFamily: 'Inter_600SemiBold', lineHeight: 22, width: 16 },
  listText: { ...Typography.bodyMd, lineHeight: 22 },
  labelKey: { ...Typography.bodyMd, fontFamily: 'Inter_600SemiBold', lineHeight: 22 },
});

// ─── Main Component ────────────────────────────────────────────────────────────

export default function InterviewMockScreen() {
  const router = useRouter();
  const { mode = 'technical' } = useLocalSearchParams<{ mode: string }>();

  const { selectedPSU, selectedBranch } = useExamStore();
  const { geminiApiKey, geminiModel, userIntroduction } = useSettingsStore();
  const { techSummary, setTechSummary, setGdTopic } = useInterviewStore();
  const { logInterviewSession } = useActivityStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<GeminiContent[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isYourTurn, setIsYourTurn] = useState(false);
  const [showScoreCard, setShowScoreCard] = useState(false);

  const { sessions } = useActivityStore();

  const buildCardVars = useCallback((s: SessionSummary): CardVars | null => {
    if (!selectedPSU || !selectedBranch) return null;
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const sessionsThisWeek = sessions.filter((sess: StudySession) => now - sess.timestamp < weekMs).length;
    const dayMs = 24 * 60 * 60 * 1000;
    const uniqueDays = new Set(sessions.map((sess: StudySession) => Math.floor(sess.timestamp / dayMs)));
    let streak = 0;
    for (let d = Math.floor(now / dayMs); uniqueDays.has(d); d--) streak++;
    const variant = (s.overallRating % 3) as 0 | 1 | 2;
    return {
      exam: selectedPSU,
      branchId: selectedBranch.id,
      score: s.overallRating,
      sessionsThisWeek,
      streak,
      interviewType: mode === 'gd' ? 'gd' : mode === 'hr' ? 'hr' : 'technical',
      gdTopic: useInterviewStore.getState().gdTopic ?? undefined,
      variant,
    };
  }, [selectedPSU, selectedBranch, sessions, mode]);

  const flatListRef = useRef<FlatList>(null);

  // Build system prompt once on mount
  const systemPrompt = React.useMemo(() => {
    if (!selectedPSU || !selectedBranch) return '';
    const sectorHints: Record<string, string> = {
      hpcl: 'oil refining, energy', iocl: 'oil refining, petroleum', bpcl: 'petroleum, retail fuel',
      ongc: 'upstream oil & gas, exploration', gail: 'gas pipeline, LNG, CGD',
      ntpc: 'power generation, thermal, renewable', powergrid: 'power transmission, HVDC',
      sail: 'steel manufacturing, Make in India', bhel: 'heavy electricals, power plant manufacturing',
      cil: 'coal mining, energy security', mstc: 'e-commerce, scrap trading', nalco: 'aluminium smelting',
    };
    return buildSystemPrompt(
      mode,
      selectedPSU.name,
      selectedPSU.fullName,
      selectedBranch.name,
      selectedBranch.allCoreSubjects,
      userIntroduction,
      sectorHints[selectedPSU.id] || selectedPSU.name,
      techSummary,
      selectedPSU.gdTopics,
    );
  }, []);

  // Initialize: send system prompt as first user turn, get AI opening
  useEffect(() => {
    if (!systemPrompt || !geminiApiKey) return;
    startSession();
  }, []);

  const startSession = async () => {
    setIsInitializing(true);
    try {
      // System prompt goes as first user message to bootstrap the conversation
      const initHistory: GeminiContent[] = [
        { role: 'user', parts: [{ text: systemPrompt }] },
      ];
      const aiText = await sendMessage(geminiApiKey, geminiModel, initHistory);
      const newHistory: GeminiContent[] = [
        ...initHistory,
        { role: 'model', parts: [{ text: aiText }] },
      ];
      setHistory(newHistory);
      const aiMsg: ChatMessage = { id: genId(), role: 'ai', text: aiText };
      setMessages([aiMsg]);

      // Extract GD topic if mode === gd
      if (mode === 'gd') {
        const topicMatch = aiText.match(/topic[:\s]+["']?([^"'\n.]+)/i);
        if (topicMatch) setGdTopic(topicMatch[1].trim());
      }

      // Check if first message already prompts user turn
      setIsYourTurn(aiText.includes('🎯 YOUR TURN'));
    } catch (e) {
      const errMsg: ChatMessage = {
        id: genId(), role: 'ai',
        text: 'Failed to start session. Please check your Gemini API key and try again.',
      };
      setMessages([errMsg]);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isLoading || sessionEnded) return;

    const userMsg: ChatMessage = { id: genId(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    setIsYourTurn(false);

    const newHistory: GeminiContent[] = [
      ...history,
      { role: 'user', parts: [{ text }] },
    ];

    try {
      const aiText = await sendMessage(geminiApiKey, geminiModel, newHistory);
      const updatedHistory: GeminiContent[] = [
        ...newHistory,
        { role: 'model', parts: [{ text: aiText }] },
      ];
      setHistory(updatedHistory);

      const aiMsg: ChatMessage = { id: genId(), role: 'ai', text: aiText };
      setMessages(prev => [...prev, aiMsg]);

      // Check if session ended (summary present)
      if (aiText.includes('SUMMARY_JSON:')) {
        handleSessionEnd(aiText);
      } else {
        setIsYourTurn(aiText.includes('🎯 YOUR TURN'));
      }
    } catch (e) {
      const errMsg: ChatMessage = {
        id: genId(), role: 'ai',
        text: '⚠️ Failed to get a response. Please check your connection and try again.',
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, sessionEnded, history, geminiApiKey, geminiModel]);

  const handleEndSession = () => {
    Alert.alert(
      'End Session',
      'Ask the AI to generate your evaluation and end this session?',
      [
        { text: 'Continue', style: 'cancel' },
        {
          text: 'End & Evaluate',
          onPress: async () => {
            setIsLoading(true);
            const endMsg = 'END SESSION';
            const userMsg: ChatMessage = { id: genId(), role: 'user', text: 'END SESSION' };
            setMessages(prev => [...prev, userMsg]);

            const newHistory: GeminiContent[] = [
              ...history,
              { role: 'user', parts: [{ text: endMsg }] },
            ];
            try {
              const aiText = await sendMessage(geminiApiKey, geminiModel, newHistory);
              const aiMsg: ChatMessage = { id: genId(), role: 'ai', text: aiText };
              setMessages(prev => [...prev, aiMsg]);
              handleSessionEnd(aiText);
            } catch {
              // still end session
              setSessionEnded(true);
            } finally {
              setIsLoading(false);
            }
          }
        },
      ]
    );
  };

  const handleSessionEnd = async (finalText: string) => {
    setSessionEnded(true);
    setIsYourTurn(false);

    const parsed = parseSummaryJson(finalText);

    // Clean up display text (remove SUMMARY_JSON line)
    const cleanText = finalText.replace(/SUMMARY_JSON:\{[^}]+\}/g, '').replace(/STUDY_TOPICS:\[[^\]]+\]/g, '').trim();

    const sessionSummary: SessionSummary = {
      overallRating: parsed.overallRating ?? 5,
      strengths: parsed.strengths ?? [],
      improvements: parsed.improvements ?? [],
      summaryText: cleanText,
    };
    setSummary(sessionSummary);

    // Store tech summary in interviewStore if tech PI
    if (mode === 'technical') {
      setTechSummary(cleanText);
    }

    // Log to activityStore
    if (selectedPSU && selectedBranch) {
      await logInterviewSession({
        psuId: selectedPSU.id,
        psuName: selectedPSU.name,
        branchId: selectedBranch.id,
        branchName: selectedBranch.name,
        type: mode as 'gd' | 'technical' | 'hr',
        overallRating: sessionSummary.overallRating,
        strengths: sessionSummary.strengths,
        improvements: sessionSummary.improvements,
        summaryText: sessionSummary.summaryText,
        topic: mode === 'gd' ? (useInterviewStore.getState().gdTopic ?? undefined) : undefined,
      });
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    // Strip internal JSON markers before display
    const displayText = item.text
      .replace(/SUMMARY_JSON:\{[^}]+\}/g, '')
      .replace(/STUDY_TOPICS:\[[^\]]+\]/g, '')
      .trim();

    return (
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        {!isUser && (
          <View style={styles.aiBubbleIcon}>
            <Ionicons name="sparkles" size={14} color={Colors.primary} />
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
          {renderFormattedText(displayText, isUser)}
        </View>
      </View>
    );
  };

  const modeLabel = MODE_LABELS[mode] || 'Interview';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Mock Interview</Text>
          <Text style={styles.headerSub}>{modeLabel} · {selectedPSU?.name}</Text>
        </View>
        {!sessionEnded && (
          <TouchableOpacity onPress={handleEndSession} style={styles.endBtn}>
            <Text style={styles.endBtnText}>End</Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Chat list */}
        {isInitializing ? (
          <View style={styles.initContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.initText}>Setting up your interview session…</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={m => m.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.chatContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={
              isLoading ? (
                <View style={styles.typingIndicator}>
                  <View style={styles.aiBubbleIcon}>
                    <Ionicons name="sparkles" size={14} color={Colors.primary} />
                  </View>
                  <View style={styles.aiBubble}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                  </View>
                </View>
              ) : null
            }
          />
        )}

        {/* YOUR TURN prompt */}
        {isYourTurn && !sessionEnded && !isLoading && (
          <View style={styles.yourTurnBanner}>
            <Ionicons name="mic" size={14} color={Colors.secondary} />
            <Text style={styles.yourTurnText}>Your turn to respond</Text>
          </View>
        )}

        {/* Input area */}
        {!sessionEnded && !isInitializing && (
          <View style={styles.inputArea}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your response…"
              placeholderTextColor={Colors.outline}
              multiline
              maxLength={1000}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Summary overlay */}
      {sessionEnded && summary && (
        <View style={styles.summaryOverlay}>
          <ScrollView
            style={styles.summaryScroll}
            contentContainerStyle={styles.summaryContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.summaryHeader}>
              <Ionicons name="checkmark-circle" size={32} color={Colors.success} />
              <Text style={styles.summaryTitle}>Session Complete</Text>
              <Text style={styles.summaryMode}>{modeLabel}</Text>
            </View>

            <View style={styles.ratingCard}>
              <Text style={styles.ratingLabel}>Overall Rating</Text>
              <Text style={styles.ratingValue}>{summary.overallRating}<Text style={styles.ratingDenominator}>/10</Text></Text>
            </View>

            {summary.strengths.length > 0 && (
              <View style={styles.summarySection}>
                <Text style={styles.summarySectionTitle}>✅ Strengths</Text>
                {summary.strengths.map((s, i) => (
                  <Text key={i} style={styles.summaryItem}>• {s}</Text>
                ))}
              </View>
            )}

            {summary.improvements.length > 0 && (
              <View style={styles.summarySection}>
                <Text style={styles.summarySectionTitle}>📌 Areas to Improve</Text>
                {summary.improvements.map((s, i) => (
                  <Text key={i} style={styles.summaryItem}>• {s}</Text>
                ))}
              </View>
            )}

            {summary.summaryText.length > 0 && (
              <View style={styles.summarySection}>
                <Text style={styles.summarySectionTitle}>📝 Full Feedback</Text>
                <Text style={styles.summaryFeedback}>{summary.summaryText}</Text>
              </View>
            )}

            <View style={styles.summaryActions}>
              <TouchableOpacity
                style={[styles.summaryBtn, styles.summaryBtnShare]}
                onPress={() => setShowScoreCard(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="share-social-outline" size={16} color={Colors.primary} />
                <Text style={styles.summaryBtnTextShare}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.summaryBtn, styles.summaryBtnSecondary]}
                onPress={() => { setMessages([]); setHistory([]); setSessionEnded(false); setSummary(null); startSession(); }}
                activeOpacity={0.8}
              >
                <Text style={styles.summaryBtnTextSecondary}>Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.summaryBtn, styles.summaryBtnPrimary]}
                onPress={() => router.back()}
                activeOpacity={0.8}
              >
                <Text style={styles.summaryBtnTextPrimary}>Done</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {showScoreCard && summary && (
        <ScoreCardSheet visible={showScoreCard} onClose={() => setShowScoreCard(false)}>
          {mode === 'gd'
            ? <GDCard vars={buildCardVars(summary)!} />
            : <PICard vars={buildCardVars(summary)!} />
          }
        </ScoreCardSheet>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
    gap: Spacing.md,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle: { ...Typography.h4, color: Colors.onSurface },
  headerSub: { ...Typography.bodySm, color: Colors.onSurfaceVariant },
  endBtn: {
    backgroundColor: '#FFEBEE',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  endBtnText: { ...Typography.bodySm, color: '#C62828', fontFamily: 'Inter_600SemiBold' },

  initContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
  initText: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },

  chatContent: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xl },

  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, marginBottom: Spacing.sm },
  messageRowUser: { justifyContent: 'flex-end' },

  aiBubbleIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    alignSelf: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  aiBubble: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderBottomLeftRadius: 4,
    ...Shadows.card,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
    ...Shadows.button,
  },

  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },

  yourTurnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.goldDark,
  },
  yourTurnText: { ...Typography.bodySm, color: Colors.secondary, fontFamily: 'Inter_600SemiBold' },

  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
  },
  input: {
    flex: 1,
    ...Typography.bodyMd,
    color: Colors.onSurface,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  sendBtnDisabled: { opacity: 0.4 },

  // Summary overlay
  summaryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  summaryScroll: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    maxHeight: '85%',
  },
  summaryContent: { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 40 },

  summaryHeader: { alignItems: 'center', gap: Spacing.sm },
  summaryTitle: { ...Typography.h2, color: Colors.onSurface },
  summaryMode: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },

  ratingCard: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  ratingLabel: { ...Typography.labelCaps, color: Colors.onPrimaryContainer },
  ratingValue: { fontSize: 52, fontFamily: 'Inter_700Bold', color: Colors.gold, lineHeight: 60 },
  ratingDenominator: { fontSize: 24, color: Colors.onPrimaryContainer, opacity: 0.7 },

  summarySection: { gap: Spacing.sm },
  summarySectionTitle: { ...Typography.h4, color: Colors.onSurface },
  summaryItem: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, lineHeight: 24, paddingLeft: 4 },
  summaryFeedback: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, lineHeight: 22 },

  summaryActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
  summaryBtn: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBtnPrimary: { backgroundColor: Colors.primary, ...Shadows.button },
  summaryBtnSecondary: { backgroundColor: Colors.surfaceContainerLow, borderWidth: 1, borderColor: Colors.outlineVariant },
  summaryBtnTextPrimary: { ...Typography.button, color: Colors.white },
  summaryBtnTextSecondary: { ...Typography.button, color: Colors.onSurface },
  summaryBtnShare: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.gold + '20', borderWidth: 1, borderColor: Colors.gold + '60' },
  summaryBtnTextShare: { ...Typography.button, color: Colors.primary },
});
