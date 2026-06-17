import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, 
  ActivityIndicator, Image, Alert, ScrollView, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';

interface NewTicketModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (subject: string, message: string, attachments: any[]) => Promise<void>;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<{ uri: string; name: string; type: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async () => {
    if (!subject.trim()) {
      Alert.alert('Validation Error', 'Please enter a subject.');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Validation Error', 'Please enter a message describing your issue.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(subject.trim(), message.trim(), attachments);
      setSubject('');
      setMessage('');
      setAttachments([]);
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create support ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create New Ticket</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={isSubmitting}>
              <Ionicons name="close" size={24} color={Colors.outline} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.field}>
              <Text style={styles.label}>SUBJECT</Text>
              <TextInput
                style={styles.input}
                value={subject}
                onChangeText={setSubject}
                placeholder="e.g. Issue with syllabus download"
                placeholderTextColor={Colors.outlineVariant}
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>MESSAGE / DESCRIPTION</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={message}
                onChangeText={setMessage}
                placeholder="Describe your issue or question in detail..."
                placeholderTextColor={Colors.outlineVariant}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>ATTACHMENTS (OPTIONAL)</Text>
              <TouchableOpacity 
                style={styles.attachBtn} 
                onPress={handlePickAttachment}
                disabled={isSubmitting}
              >
                <Ionicons name="cloud-upload-outline" size={20} color={Colors.primary} />
                <Text style={styles.attachBtnText}>Upload Screenshot or Image</Text>
              </TouchableOpacity>

              {attachments.length > 0 && (
                <View style={styles.attachmentGrid}>
                  {attachments.map((att, index) => (
                    <View key={index} style={styles.attachmentCard}>
                      <Image source={{ uri: att.uri }} style={styles.attImg} />
                      <TouchableOpacity 
                        style={styles.removeAttBtn} 
                        onPress={() => removeAttachment(index)}
                        disabled={isSubmitting}
                      >
                        <Ionicons name="close-circle" size={20} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Ticket</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '90%',
    ...Shadows.cardHover,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.primary,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  formContainer: {
    padding: Spacing.xl,
  },
  field: {
    marginBottom: Spacing.xl,
  },
  label: {
    ...Typography.labelCaps,
    color: Colors.outline,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: '#F9FBFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    ...Typography.bodyMd,
    color: Colors.onSurface,
  },
  textArea: {
    minHeight: 120,
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    backgroundColor: Colors.primary + '0A',
    gap: Spacing.sm,
  },
  attachBtnText: {
    ...Typography.button,
    color: Colors.primary,
  },
  attachmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  attachmentCard: {
    position: 'relative',
  },
  attImg: {
    width: 80,
    height: 80,
    borderRadius: Radius.sm,
  },
  removeAttBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFF',
    borderRadius: Radius.pill,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
    gap: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelBtnText: {
    ...Typography.button,
    color: Colors.outline,
  },
  submitBtn: {
    flex: 2,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    ...Shadows.button,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    ...Typography.button,
    color: '#FFF',
  },
});
