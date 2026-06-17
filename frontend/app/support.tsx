import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Alert } from '@/utils/alert';
import { useIsWide } from '@/hooks/useColumns';
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
    question: 'Why do I need a Gemini API key?',
    answer: 'Aspirant Arcade uses Google\'s Gemini AI to generate fresh questions every session. The key is free — go to aistudio.google.com, click "Get API Key", create one in under 2 minutes. No billing required.',
    category: 'General'
  },
  {
    id: '2',
    question: 'Is my API key safe?',
    answer: 'Yes. Your API key is stored locally on your device using secure encrypted storage. It is never sent to our servers or shared with anyone.',
    category: 'Security'
  },
  {
    id: '3',
    question: 'Why are questions repeating across sessions?',
    answer: 'The app tracks questions you\'ve seen and tells Gemini to avoid them. If repeats occur, try changing your selected topics in the Syllabus screen or tap "Bypass Cache" to force fresh generation.',
    category: 'Technical'
  },
  {
    id: '4',
    question: 'Which PSUs and branches are supported?',
    answer: 'HPCL, Coal India, BHEL, ONGC, NTPC, SAIL, IOCL, GAIL and more. All major engineering branches — Mechanical, Electrical, Civil, Chemical, Electronics, Computer Science — are supported.',
    category: 'General'
  },
  {
    id: '5',
    question: 'How does the Interview Simulator work?',
    answer: 'Select your target PSU from the Sections screen and tap Interview Prep. The AI acts as a mock panel and asks branch-specific technical and HR questions based on your profile.',
    category: 'Features'
  },
  {
    id: '6',
    question: 'What do the Insights show?',
    answer: 'Insights track your accuracy per topic across all sessions. It shows which topics you score lowest in so you know exactly where to focus before the exam.',
    category: 'Features'
  },
  {
    id: '7',
    question: 'Can I use the app without an account?',
    answer: 'Yes. You can practice, bookmark, and view insights as a guest. Sign in to sync your bookmarks across devices.',
    category: 'Account'
  },
  {
    id: '8',
    question: 'What to do if AI returns wrong or poor quality questions?',
    answer: 'This can happen with free-tier Gemini models. Switch to Gemini 2.5 Flash in Settings > API Configuration for best results. You can also use the Contact Support button below to report specific issues.',
    category: 'Support'
  }
];

export default function SupportScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isWide = useIsWide();
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
      </View>

      {selectedTicket ? (
        <ChatThread
          ticket={selectedTicket}
          isLoading={isLoading}
          onBack={() => setSelectedTicket(null)}
          onReply={handleReplyTicket}
        />
      ) : isWide ? (
        /* Wide: FAQ panel left, tickets panel right */
        <View style={styles.wideLayout}>
          <View style={styles.wideFaq}>
            <TicketList
              tickets={[]}
              isLoading={false}
              onSelectTicket={setSelectedTicket}
              onCreateNew={() => setIsNewModalVisible(true)}
              faqs={FAQS}
              faqOnly
            />
          </View>
          <View style={styles.wideTickets}>
            <TicketList
              tickets={tickets}
              isLoading={isLoading}
              onSelectTicket={setSelectedTicket}
              onCreateNew={() => setIsNewModalVisible(true)}
              faqs={[]}
              ticketsOnly
            />
          </View>
        </View>
      ) : (
        <TicketList
          tickets={tickets}
          isLoading={isLoading}
          onSelectTicket={setSelectedTicket}
          onCreateNew={() => setIsNewModalVisible(true)}
          faqs={FAQS}
        />
      )}

      <NewTicketModal
        visible={isNewModalVisible}
        onClose={() => setIsNewModalVisible(false)}
        onSubmit={handleCreateTicket}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FBFF',
  },
  wideLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  wideFaq: {
    width: '40%',
    borderRightWidth: 1,
    borderRightColor: '#F0F2F5',
  },
  wideTickets: {
    flex: 1,
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
