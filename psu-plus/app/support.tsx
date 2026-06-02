import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { 
  createTicket, 
  addReply, 
  getTicketsWithMessages 
} from '@/services/support';
import { uploadToCloudinary } from '@/services/cloudinary';
import { Colors, Typography, Radius, Spacing, Shadows } from '@/theme';
import { useAuthStore } from '@/stores/authStore';
import { TicketList } from '@/components/support/TicketList';
import { ChatThread } from '@/components/support/ChatThread';
import { NewTicketModal } from '@/components/support/NewTicketModal';

const FAQS = [
  {
    id: '1',
    question: 'How do I download syllabus and notes?',
    answer: 'Navigate to the "Syllabus" or "Notes" section from the home screen, select your subject, and click the download icon next to the file you want to save.',
    category: 'General'
  },
  {
    id: '2',
    question: 'Can I access the app offline?',
    answer: 'Yes! Any syllabus or notes you have downloaded can be accessed offline via the "Downloads" tab in your profile.',
    category: 'Technical'
  },
  {
    id: '3',
    question: 'How to update my profile information?',
    answer: 'Go to Settings > Profile and click the edit icon to change your name, branch, or semester details.',
    category: 'Account'
  },
  {
    id: '4',
    question: 'What to do if I find incorrect information?',
    answer: 'Please use the "Contact Support" button on this screen and describe the issue. Our team will verify and correct the content within 24-48 hours.',
    category: 'Support'
  }
];

export default function SupportScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [isNewModalVisible, setIsNewModalVisible] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = getTicketsWithMessages(user.uid, (fetchedTickets) => {
      setTickets(fetchedTickets);
      // Update selected ticket with fresh messages if open
      if (selectedTicket) {
        const updated = fetchedTickets.find(t => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.authRequiredContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-closed-outline" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.authTitle}>Authentication Required</Text>
          <Text style={styles.authSubtitle}>
            Please sign in to access our premium support system and FAQs.
          </Text>
          <TouchableOpacity 
            style={styles.authButton}
            onPress={() => router.push('/auth/login' as any)}
          >
            <Text style={styles.authButtonText}>Sign In Now</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleCreateTicket = async (subject: string, message: string, attachments: any[]) => {
    const attachmentUrls = await Promise.all(
      (attachments || []).map(async (a: any) => await uploadToCloudinary(a.uri))
    );
    await createTicket(subject, message, attachmentUrls);
    Alert.alert('Success', 'Your support ticket has been created successfully.');
  };

  const handleReplyTicket = async (message: string, attachments: any[]) => {
    if (!selectedTicket) return;
    const attachmentUrls = await Promise.all(
      (attachments || []).map(async (a: any) => await uploadToCloudinary(a.uri))
    );
    await addReply(selectedTicket.id, message, attachmentUrls);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {selectedTicket ? (
        <ChatThread
          ticket={selectedTicket}
          isLoading={isLoading}
          onBack={() => setSelectedTicket(null)}
          onReply={handleReplyTicket}
        />
      ) : (
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Help & Support</Text>
          </View>

          <TicketList
            tickets={tickets}
            isLoading={isLoading}
            onSelectTicket={setSelectedTicket}
            onCreateNew={() => setIsNewModalVisible(true)}
            faqs={FAQS}
          />

          <NewTicketModal
            visible={isNewModalVisible}
            onClose={() => setIsNewModalVisible(false)}
            onSubmit={handleCreateTicket}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FBFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.primary,
  },
  authRequiredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: Spacing.lg,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  authTitle: {
    ...Typography.h2,
    color: Colors.primary,
    textAlign: 'center',
  },
  authSubtitle: {
    ...Typography.bodyMd,
    color: Colors.outline,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  authButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: Radius.md,
    width: '100%',
    alignItems: 'center',
    ...Shadows.button,
  },
  authButtonText: {
    ...Typography.button,
    color: '#FFF',
  },
  secondaryButton: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...Typography.bodyMd,
    color: Colors.outline,
    textDecorationLine: 'underline',
  }
});
