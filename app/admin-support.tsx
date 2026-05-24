import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { 
  addReply, 
  getAllTicketsWithMessages, 
  updateTicketStatus 
} from '@/services/support';
import { uploadToCloudinary } from '@/services/cloudinary';
import { Colors, Typography, Spacing } from '@/theme';
import { TicketList } from '@/components/support/TicketList';
import { ChatThread } from '@/components/support/ChatThread';

export default function AdminSupportScreen() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  useEffect(() => {
    const unsubscribe = getAllTicketsWithMessages((fetchedTickets) => {
      setTickets(fetchedTickets);
      if (selectedTicket) {
        const updated = fetchedTickets.find(t => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleReplyTicket = async (message: string, attachments: any[]) => {
    if (!selectedTicket) return;
    const attachmentUrls = await Promise.all(
      (attachments || []).map(async (a: any) => await uploadToCloudinary(a.uri))
    );
    await addReply(selectedTicket.id, message, attachmentUrls);
  };

  const handleUpdateStatus = async (status: 'open' | 'closed' | 'pending') => {
    if (!selectedTicket) return;
    await updateTicketStatus(selectedTicket.id, status);
    setSelectedTicket({ ...selectedTicket, status });
    Alert.alert('Status Updated', `Ticket status changed to ${status}.`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {selectedTicket ? (
        <ChatThread
          ticket={selectedTicket}
          isLoading={isLoading}
          isAdmin={true}
          onBack={() => setSelectedTicket(null)}
          onReply={handleReplyTicket}
          onUpdateStatus={handleUpdateStatus}
        />
      ) : (
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Admin Support Dashboard</Text>
          </View>

          <TicketList
            tickets={tickets}
            isLoading={isLoading}
            isAdmin={true}
            onSelectTicket={setSelectedTicket}
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
    gap: 12
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.primary
  },
  backButton: {
    padding: 8,
  }
});
