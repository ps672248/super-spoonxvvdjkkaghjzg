import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, 
  ActivityIndicator, Image, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';

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
  const [status, requestPermission] = ImagePicker.useMediaLibraryPermissions();

  const handlePickAttachment = async () => {
    if (status?.status !== ImagePicker.PermissionStatus.GRANTED) {
      const permission = await requestPermission();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setAttachments([...attachments, {
        uri: asset.uri,
        name: asset.fileName || 'upload.jpg',
        type: 'image/jpeg',
      }]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!inputText.trim() && attachments.length === 0) return;
    setIsSending(true);
    try {
      await onReply(inputText.trim(), attachments);
      setInputText('');
      setAttachments([]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return Colors.success;
      case 'pending': return Colors.warning;
      case 'closed': return Colors.outline;
      default: return Colors.primary;
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isAdmin ? Colors.secondary : Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{ticket.subject}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '1A' }]}>
            <Text style={[styles.statusBadgeText, { color: getStatusColor(ticket.status) }]}>
              {ticket.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Admin Status Changer */}
      {isAdmin && onUpdateStatus && (
        <View style={styles.adminActions}>
          <Text style={styles.adminActionsLabel}>Change Status:</Text>
          <View style={styles.adminButtons}>
            {(['open', 'pending', 'closed'] as const).map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.adminBtn,
                  ticket.status === s && { backgroundColor: getStatusColor(s) },
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

      {/* Messages ScrollView */}
      <ScrollView 
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={isAdmin ? Colors.secondary : Colors.primary} />
          </View>
        ) : !ticket.messages || ticket.messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages in this ticket yet.</Text>
          </View>
        ) : (
          ticket.messages.map((msg) => {
            const isSupport = msg.sender === 'support';
            // If admin view, 'support' messages are mine, 'user' messages are theirs
            const isMine = isAdmin ? isSupport : !isSupport;

            return (
              <View 
                key={msg.id} 
                style={[styles.messageBubble, isMine ? styles.myBubble : styles.theirBubble]}
              >
                <Text style={[styles.messageSender, isMine && styles.mySenderText]}>
                  {isSupport ? 'Support Team' : 'User'}
                </Text>

                {msg.message ? (
                  <Text style={[styles.messageText, isMine && styles.myMessageText]}>
                    {msg.message}
                  </Text>
                ) : null}

                {msg.attachments && msg.attachments.length > 0 && (
                  <View style={styles.attachmentGrid}>
                    {msg.attachments.map((att, index) => (
                      <Image key={index} source={{ uri: att.uri }} style={styles.attachedImg} />
                    ))}
                  </View>
                )}

                <Text style={[styles.messageDate, isMine && styles.myDateText]}>
                  {new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Closed Banner or Input Bar */}
      {ticket.status === 'closed' ? (
        <View style={styles.closedBanner}>
          <Ionicons name="information-circle" size={20} color={Colors.outline} />
          <Text style={styles.closedBannerText}>
            This ticket has been closed. If you have further questions, please open a new ticket.
          </Text>
        </View>
      ) : (
        <View style={styles.inputSection}>
          {/* Attachment Preview Bar */}
          {attachments.length > 0 && (
            <View style={styles.attachmentPreviewContainer}>
              {attachments.map((att, index) => (
                <View key={index} style={styles.attachmentPreview}>
                  <Image source={{ uri: att.uri }} style={styles.previewImg} />
                  <TouchableOpacity style={styles.removeAttBtn} onPress={() => removeAttachment(index)}>
                    <Ionicons name="close-circle" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Input Row */}
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.attachBtn} onPress={handlePickAttachment}>
              <Ionicons name="image-outline" size={24} color={Colors.outline} />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              placeholderTextColor={Colors.outline}
              multiline
              maxLength={500}
            />

            <TouchableOpacity 
              style={[styles.sendBtn, (!inputText.trim() && attachments.length === 0) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={isSending || (!inputText.trim() && attachments.length === 0)}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FBFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.onSurface,
    flex: 1,
    marginRight: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
  },
  statusBadgeText: {
    ...Typography.labelCaps,
    fontSize: 10,
  },
  adminActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: '#EEF2FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E7FF',
  },
  adminActionsLabel: {
    ...Typography.bodySm,
    color: Colors.primaryContainer,
    fontFamily: 'Inter_600SemiBold',
  },
  adminButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  adminBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  adminBtnText: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  loadingContainer: {
    padding: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...Typography.bodyMd,
    color: Colors.outline,
    textAlign: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    ...Shadows.card,
  },
  myBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderBottomRightRadius: Radius.xs,
  },
  theirBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    borderBottomLeftRadius: Radius.xs,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  messageSender: {
    ...Typography.bodySm,
    color: Colors.outline,
    fontSize: 10,
    marginBottom: 2,
    fontFamily: 'Inter_600SemiBold',
  },
  mySenderText: {
    color: Colors.onPrimaryContainer,
  },
  messageText: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
  },
  myMessageText: {
    color: '#FFF',
  },
  attachmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  attachedImg: {
    width: 150,
    height: 150,
    borderRadius: Radius.sm,
  },
  messageDate: {
    ...Typography.bodySm,
    color: Colors.outline,
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: Spacing.xs,
  },
  myDateText: {
    color: Colors.onPrimaryContainer,
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: '#F3F4F6',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: Spacing.sm,
  },
  closedBannerText: {
    ...Typography.bodySm,
    color: Colors.outline,
    flex: 1,
  },
  inputSection: {
    padding: Spacing.md,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
  },
  attachmentPreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  attachmentPreview: {
    position: 'relative',
  },
  previewImg: {
    width: 60,
    height: 60,
    borderRadius: Radius.sm,
  },
  removeAttBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFF',
    borderRadius: Radius.pill,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  attachBtn: {
    padding: Spacing.xs,
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    ...Typography.bodyMd,
    color: Colors.onSurface,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.outlineVariant,
    elevation: 0,
    shadowOpacity: 0,
  },
});
