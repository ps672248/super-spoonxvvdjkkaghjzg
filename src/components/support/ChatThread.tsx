import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Image, Alert, KeyboardAvoidingView, Platform,
  Modal, Dimensions, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
/** Width of media-containing bubble */
const BUBBLE_MEDIA_W = Math.min(SCREEN_W * 0.72, 320);
/** Aspect ratio for images: 4:3 */
const IMG_H = BUBBLE_MEDIA_W * 0.75;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  sender: 'user' | 'support';
  message: string;
  date: string;
  attachments?: { uri: string }[];
}

interface Ticket {
  id: string;
  subject: string;
  status: 'open' | 'closed' | 'pending';
  messages?: Message[];
}

interface ChatThreadProps {
  ticket: Ticket;
  isLoading: boolean;
  isAdmin?: boolean;
  onBack: () => void;
  onReply: (message: string, attachments: any[]) => Promise<void>;
  onUpdateStatus?: (status: 'open' | 'closed' | 'pending') => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

const STATUS_COLORS: Record<string, string> = {
  open: Colors.success ?? '#2E7D32',
  pending: Colors.warning ?? '#F57C00',
  closed: Colors.outline,
};

// ─── Component ────────────────────────────────────────────────────────────────

export const ChatThread: React.FC<ChatThreadProps> = ({
  ticket,
  isLoading,
  isAdmin = false,
  onBack,
  onReply,
  onUpdateStatus,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<{ uri: string; name: string; type: string }[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [mediaPermission, requestPermission] = ImagePicker.useMediaLibraryPermissions();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(t);
  }, [ticket.messages?.length]);

  // ── Attachment picker ───────────────────────────────────────────────────────

  const handlePickAttachment = async () => {
    if (mediaPermission?.status !== ImagePicker.PermissionStatus.GRANTED) {
      const p = await requestPermission();
      if (!p.granted) {
        Alert.alert('Permission Required', 'Allow access to your photo library to attach images.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      setAttachments(prev => [...prev, {
        uri: asset.uri,
        name: asset.fileName || 'upload.jpg',
        type: 'image/jpeg',
      }]);
    }
  };

  const removeAttachment = (index: number) =>
    setAttachments(prev => prev.filter((_, i) => i !== index));

  // ── Send ────────────────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!inputText.trim() && attachments.length === 0) return;
    setIsSending(true);
    try {
      await onReply(inputText.trim(), attachments);
      setInputText('');
      setAttachments([]);
    } catch (error: any) {
      Alert.alert('Send Failed', error.message || 'Could not send message.');
    } finally {
      setIsSending(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* ── Header ── */}
      <View style={[styles.header, isAdmin && styles.headerAdmin]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={isAdmin ? '#FFF' : Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerMeta}>
          <Text style={[styles.headerTitle, isAdmin && styles.headerTitleAdmin]} numberOfLines={1}>
            {ticket.subject}
          </Text>
          <View style={[
            styles.statusPill,
            { backgroundColor: isAdmin ? 'rgba(255,255,255,0.15)' : STATUS_COLORS[ticket.status] + '20' },
          ]}>
            <View style={[styles.statusDot, { backgroundColor: isAdmin ? '#FFF' : STATUS_COLORS[ticket.status] }]} />
            <Text style={[
              styles.statusText,
              { color: isAdmin ? '#FFF' : STATUS_COLORS[ticket.status] },
            ]}>
              {ticket.status.toUpperCase()}
            </Text>
          </View>
        </View>
        {/* Admin badge */}
        {isAdmin && (
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.gold} />
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
        )}
      </View>

      {/* ── Admin status bar ── */}
      {isAdmin && onUpdateStatus && (
        <View style={styles.adminBar}>
          <Text style={styles.adminBarLabel}>Set status:</Text>
          <View style={styles.adminBtns}>
            {(['open', 'pending', 'closed'] as const).map(s => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.adminBtn,
                  ticket.status === s && { backgroundColor: STATUS_COLORS[s] },
                ]}
                onPress={() => onUpdateStatus(s)}
              >
                <Text style={[styles.adminBtnText, ticket.status === s && { color: '#FFF' }]}>
                  {s.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ── Messages ── */}
      <ScrollView
        ref={scrollRef}
        style={styles.msgList}
        contentContainerStyle={styles.msgListContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={isAdmin ? Colors.secondary : Colors.primary} />
          </View>
        ) : !ticket.messages || ticket.messages.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="chatbubbles-outline" size={40} color={Colors.outlineVariant} />
            <Text style={styles.emptyText}>No messages yet</Text>
          </View>
        ) : (
          ticket.messages.map(msg => {
            const isSupport = msg.sender === 'support';
            // "mine" = messages I sent in this context
            const isMine = isAdmin ? isSupport : !isSupport;
            const hasImages = !!msg.attachments && msg.attachments.length > 0;
            const hasText = !!msg.message?.trim();

            return (
              <View key={msg.id} style={[styles.msgRow, isMine ? styles.msgRowRight : styles.msgRowLeft]}>
                <View style={[
                  styles.bubble,
                  isMine ? styles.myBubble : styles.theirBubble,
                  hasImages && styles.mediaBubble,
                ]}>
                  {/* Sender label */}
                  <Text style={[
                    styles.senderLabel,
                    isMine ? styles.mySenderLabel : styles.theirSenderLabel,
                    hasImages && styles.labelPadded,
                  ]}>
                    {isSupport ? 'Support Team' : 'You'}
                  </Text>

                  {/* Text */}
                  {hasText && (
                    <Text style={[
                      styles.msgText,
                      isMine ? styles.myMsgText : styles.theirMsgText,
                      hasImages && styles.textPadded,
                    ]}>
                      {msg.message}
                    </Text>
                  )}

                  {/* Images */}
                  {hasImages && (
                    <View style={styles.imgStack}>
                      {msg.attachments!.map((att, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => setViewerUri(att.uri)}
                          activeOpacity={0.92}
                        >
                          <Image
                            source={{ uri: att.uri }}
                            style={[
                              styles.msgImg,
                              !hasText && idx === 0 && styles.imgFirst,
                              idx === msg.attachments!.length - 1 && (
                                isMine ? styles.imgLastMine : styles.imgLastTheir
                              ),
                            ]}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Timestamp */}
                  <Text style={[
                    styles.timeText,
                    isMine ? styles.myTimeText : styles.theirTimeText,
                    hasImages && styles.timePadded,
                  ]}>
                    {formatTime(msg.date)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── Closed banner / Input bar ── */}
      {ticket.status === 'closed' ? (
        <View style={styles.closedBanner}>
          <Ionicons name="lock-closed-outline" size={18} color={Colors.outline} />
          <Text style={styles.closedText}>
            Ticket closed. Open a new ticket for further assistance.
          </Text>
        </View>
      ) : (
        <View style={styles.inputSection}>
          {/* Attachment previews */}
          {attachments.length > 0 && (
            <View style={styles.previewRow}>
              {attachments.map((att, idx) => (
                <View key={idx} style={styles.previewWrap}>
                  <Image source={{ uri: att.uri }} style={styles.previewImg} />
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeAttachment(idx)}>
                    <Ionicons name="close-circle" size={20} color="#FF4D4F" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Input row */}
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.attachBtn} onPress={handlePickAttachment} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="image-outline" size={24} color={Colors.outline} />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message…"
              placeholderTextColor={Colors.outline}
              multiline
              maxLength={500}
            />

            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!inputText.trim() && attachments.length === 0) && styles.sendBtnOff,
              ]}
              onPress={handleSend}
              disabled={isSending || (!inputText.trim() && attachments.length === 0)}
            >
              {isSending
                ? <ActivityIndicator size="small" color="#FFF" />
                : <Ionicons name="send" size={18} color="#FFF" />}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Full-screen image viewer ── */}
      <Modal
        visible={!!viewerUri}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setViewerUri(null)}
      >
        <View style={styles.viewerBg}>
          <TouchableOpacity
            style={styles.viewerCloseBtn}
            onPress={() => setViewerUri(null)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <View style={styles.viewerCloseCircle}>
              <Ionicons name="close" size={22} color="#FFF" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewerTouchable} activeOpacity={1} onPress={() => setViewerUri(null)}>
            {viewerUri && (
              <Image source={{ uri: viewerUri }} style={styles.viewerImg} resizeMode="contain" />
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEF2F7' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
    gap: 8,
  },
  headerAdmin: { backgroundColor: Colors.primary },   // dark navy, white text
  backBtn: { padding: 4 },
  headerMeta: { flex: 1, gap: 4 },
  headerTitle: {
    ...Typography.h3,
    color: Colors.onSurface,
    fontSize: 15,
  },
  headerTitleAdmin: { color: '#FFF' },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  adminBadgeText: {
    ...Typography.labelCaps,
    color: Colors.gold,
    fontSize: 9,
    letterSpacing: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    gap: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { ...Typography.labelCaps, fontSize: 10 },

  // Admin status bar
  adminBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: '#F0F2FF',
    borderBottomWidth: 1,
    borderBottomColor: '#D8DCF0',
  },
  adminBarLabel: { ...Typography.bodySm, color: Colors.primary, fontFamily: 'Inter_600SemiBold' },
  adminBtns: { flexDirection: 'row', gap: Spacing.xs },
  adminBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  adminBtnText: { ...Typography.labelCaps, color: Colors.onSurfaceVariant, fontSize: 10 },

  // Message list
  msgList: { flex: 1 },
  msgListContent: {
    padding: 12,
    gap: 6,
    paddingBottom: 8,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { ...Typography.bodyMd, color: Colors.outline },

  // Message rows
  msgRow: { flexDirection: 'row', marginBottom: 2 },
  msgRowRight: { justifyContent: 'flex-end' },
  msgRowLeft: { justifyContent: 'flex-start' },

  // Bubbles
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    overflow: 'hidden',
  },
  myBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E8EBF0',
    ...Shadows.card,
  },
  mediaBubble: {
    width: BUBBLE_MEDIA_W,
    maxWidth: BUBBLE_MEDIA_W,
  },

  // Sender label
  senderLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 2,
  },
  mySenderLabel: { color: 'rgba(255,255,255,0.65)' },
  theirSenderLabel: { color: Colors.outline },
  labelPadded: { paddingHorizontal: 12 },

  // Message text
  msgText: { ...Typography.bodyMd, paddingHorizontal: 12, paddingBottom: 6 },
  myMsgText: { color: '#FFF' },
  theirMsgText: { color: Colors.onSurface },
  textPadded: { paddingHorizontal: 12, paddingBottom: 4 },

  // Images
  imgStack: { gap: 2 },
  msgImg: {
    width: BUBBLE_MEDIA_W,
    height: IMG_H,
  },
  imgFirst: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  imgLastMine: {
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 4,
  },
  imgLastTheir: {
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 14,
  },

  // Time
  timeText: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingTop: 2,
    alignSelf: 'flex-end',
  },
  myTimeText: { color: 'rgba(255,255,255,0.55)' },
  theirTimeText: { color: Colors.outline },
  timePadded: { paddingHorizontal: 12 },

  // Closed banner
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: '#F3F4F6',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  closedText: { ...Typography.bodySm, color: Colors.outline, flex: 1 },

  // Input section
  inputSection: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E8EBF0',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  previewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  previewWrap: { position: 'relative' },
  previewImg: { width: 56, height: 56, borderRadius: 8 },
  removeBtn: { position: 'absolute', top: -8, right: -8, backgroundColor: '#FFF', borderRadius: 10 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  attachBtn: { padding: 4, marginBottom: 6 },
  input: {
    flex: 1,
    backgroundColor: '#F3F5F7',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    ...Typography.bodyMd,
    color: Colors.onSurface,
    maxHeight: 110,
    lineHeight: 20,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    ...Shadows.button,
  },
  sendBtnOff: {
    backgroundColor: Colors.outlineVariant,
    elevation: 0,
    shadowOpacity: 0,
  },

  // Image viewer
  viewerBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
  },
  viewerCloseBtn: {
    position: 'absolute',
    top: (StatusBar.currentHeight ?? 40) + 8,
    right: 16,
    zIndex: 10,
  },
  viewerCloseCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerTouchable: { flex: 1, justifyContent: 'center' },
  viewerImg: {
    width: SCREEN_W,
    height: SCREEN_W * 1.2,
    alignSelf: 'center',
  },
});
