import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  addReply,
  getAllTicketsWithMessages,
  updateTicketStatus,
} from '@/services/support';
import { uploadToCloudinary } from '@/services/cloudinary';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { TicketList } from '@/components/support/TicketList';
import { ChatThread } from '@/components/support/ChatThread';
import { db } from '@/config/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RatingEntry {
  id: string;
  rating: number;
  review: string;
  userId: string;
  timestamp: number;
  createdAt: string;
}

type AdminTab = 'tickets' | 'ratings';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderStars(rating: number) {
  return [1, 2, 3, 4, 5].map(i => (
    <Ionicons key={i} name={i <= rating ? 'star' : 'star-outline'} size={14} color="#F59E0B" />
  ));
}

function formatDate(ts: number): string {
  try {
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

// ─── Ratings panel ────────────────────────────────────────────────────────────

const RatingsPanel: React.FC = () => {
  const [ratings, setRatings] = useState<RatingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'ratings'), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as RatingEntry[];
      setRatings(data);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to load ratings: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={rStyles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (ratings.length === 0) {
    return (
      <View style={rStyles.centered}>
        <Ionicons name="star-outline" size={40} color={Colors.outlineVariant} />
        <Text style={rStyles.emptyText}>No ratings yet</Text>
      </View>
    );
  }

  // Compute stats
  const avg = ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length;
  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: ratings.filter(r => r.rating === star).length,
    pct: Math.round((ratings.filter(r => r.rating === star).length / ratings.length) * 100),
  }));

  return (
    <ScrollView style={rStyles.container} contentContainerStyle={rStyles.content} showsVerticalScrollIndicator={false}>
      {/* Summary card */}
      <View style={rStyles.summaryCard}>
        <View style={rStyles.avgBlock}>
          <Text style={rStyles.avgNumber}>{avg.toFixed(1)}</Text>
          <View style={rStyles.avgStars}>{renderStars(Math.round(avg))}</View>
          <Text style={rStyles.avgCount}>{ratings.length} rating{ratings.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={rStyles.distBlock}>
          {dist.map(({ star, count, pct }) => (
            <View key={star} style={rStyles.distRow}>
              <Text style={rStyles.distStar}>{star}</Text>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <View style={rStyles.distBar}>
                <View style={[rStyles.distFill, { width: `${pct}%` }]} />
              </View>
              <Text style={rStyles.distCount}>{count}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Individual ratings */}
      {ratings.map(r => (
        <View key={r.id} style={rStyles.ratingCard}>
          <View style={rStyles.ratingHeader}>
            <View style={rStyles.starsRow}>{renderStars(r.rating)}</View>
            <Text style={rStyles.ratingDate}>{formatDate(r.timestamp)}</Text>
          </View>
          <Text style={rStyles.ratingUser} numberOfLines={1}>
            {r.userId === 'guest' ? '👤 Guest' : `👤 ${r.userId.slice(0, 12)}…`}
          </Text>
          {!!r.review && (
            <Text style={rStyles.ratingReview}>"{r.review}"</Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AdminSupportScreen() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('tickets');

  useEffect(() => {
    const unsubscribe = getAllTicketsWithMessages(fetchedTickets => {
      setTickets(fetchedTickets);
      if (selectedTicket) {
        const updated = fetchedTickets.find(t => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleReply = async (message: string, attachments: any[]) => {
    if (!selectedTicket) return;
    const urls = await Promise.all(
      (attachments ?? []).map((a: any) => uploadToCloudinary(a.uri))
    );
    await addReply(selectedTicket.id, message, urls);
  };

  const handleUpdateStatus = async (status: 'open' | 'closed' | 'pending') => {
    if (!selectedTicket) return;
    await updateTicketStatus(selectedTicket.id, status);
    setSelectedTicket({ ...selectedTicket, status });
    Alert.alert('Status Updated', `Ticket marked as ${status}.`);
  };

  // Show chat thread when a ticket is open
  if (selectedTicket) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ChatThread
          ticket={selectedTicket}
          isLoading={isLoading}
          isAdmin
          onBack={() => setSelectedTicket(null)}
          onReply={handleReply}
          onUpdateStatus={handleUpdateStatus}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(['tickets', 'ratings'] as AdminTab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons
              name={tab === 'tickets' ? 'chatbubbles-outline' : 'star-outline'}
              size={16}
              color={activeTab === tab ? Colors.primary : Colors.outline}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'tickets' ? `Tickets${tickets.length ? ` (${tickets.length})` : ''}` : 'Ratings'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'tickets' ? (
        <TicketList
          tickets={tickets}
          isLoading={isLoading}
          isAdmin
          onSelectTicket={setSelectedTicket}
        />
      ) : (
        <RatingsPanel />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FBFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  backBtn: { padding: 6 },
  headerTitle: { ...Typography.h3, color: Colors.primary },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { ...Typography.bodyMd, color: Colors.outline },
  tabTextActive: { color: Colors.primary, fontFamily: 'Inter_600SemiBold' },
});

const rStyles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxxl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 64, gap: 12 },
  emptyText: { ...Typography.bodyMd, color: Colors.outline },

  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: Radius.md,
    padding: Spacing.xl,
    flexDirection: 'row',
    gap: Spacing.xl,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  avgBlock: { alignItems: 'center', gap: 4, minWidth: 72 },
  avgNumber: {
    fontSize: 42,
    fontFamily: 'Inter_700Bold',
    color: Colors.onSurface,
    lineHeight: 48,
  },
  avgStars: { flexDirection: 'row', gap: 2 },
  avgCount: { ...Typography.bodySm, color: Colors.outline },

  distBlock: { flex: 1, gap: 6, justifyContent: 'center' },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  distStar: { ...Typography.bodySm, color: Colors.outline, width: 10, textAlign: 'right' },
  distBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F0F2F5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  distFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  distCount: { ...Typography.bodySm, color: Colors.outline, width: 20, textAlign: 'right' },

  ratingCard: {
    backgroundColor: '#FFF',
    borderRadius: Radius.md,
    padding: Spacing.lg,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: '#F0F2F5',
    gap: 6,
  },
  ratingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  starsRow: { flexDirection: 'row', gap: 2 },
  ratingDate: { ...Typography.bodySm, color: Colors.outline },
  ratingUser: { ...Typography.bodySm, color: Colors.outline, fontFamily: 'Inter_600SemiBold' },
  ratingReview: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
