import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  ActivityIndicator, Platform, UIManager, LayoutAnimation 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface TicketListProps {
  tickets: any[];
  isLoading: boolean;
  isAdmin?: boolean;
  onSelectTicket: (ticket: any) => void;
  onCreateNew?: () => void;
  faqs?: FAQ[];
  faqOnly?: boolean;
  ticketsOnly?: boolean;
}

export const TicketList: React.FC<TicketListProps> = ({
  tickets,
  isLoading,
  isAdmin = false,
  onSelectTicket,
  onCreateNew,
  faqs = [],
  faqOnly = false,
  ticketsOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'pending' | 'closed'>('all');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  const filterTickets = () => {
    if (activeTab === 'all') return tickets;
    return tickets.filter(t => t.status === activeTab);
  };

  const filteredTickets = filterTickets();

  const toggleFaq = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFaqId(expandedFaqId === id ? null : id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return Colors.success;
      case 'pending': return Colors.warning;
      case 'closed': return Colors.outline;
      default: return Colors.primary;
    }
  };

  if (faqOnly) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: Spacing.lg }}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqList}>
          {faqs.map((faq) => {
            const isExpanded = expandedFaqId === faq.id;
            return (
              <View key={faq.id} style={styles.faqCard}>
                <TouchableOpacity style={styles.faqHeader} onPress={() => toggleFaq(faq.id)} activeOpacity={0.7}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.outline} />
                </TouchableOpacity>
                {isExpanded && (
                  <View style={styles.faqBody}>
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      {!faqOnly && <View style={styles.tabsContainer}>
        {(['all', 'open', 'pending', 'closed'] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                isActive && (isAdmin ? styles.tabButtonActiveAdmin : styles.tabButtonActive),
              ]}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setActiveTab(tab);
              }}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  isActive && (isAdmin ? styles.tabButtonTextActiveAdmin : styles.tabButtonTextActive),
                ]}
              >
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>}

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tickets Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{isAdmin ? 'All User Tickets' : 'Your Tickets'}</Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={isAdmin ? Colors.secondary : Colors.primary} />
            </View>
          ) : filteredTickets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="ticket-outline" size={48} color={Colors.outlineVariant} />
              <Text style={styles.emptyTitle}>No Tickets Found</Text>
              <Text style={styles.emptyDesc}>
                {activeTab === 'all' 
                  ? "You don't have any support tickets yet." 
                  : `No ${activeTab} tickets found.`}
              </Text>
            </View>
          ) : (
            filteredTickets.map((ticket) => (
              <TouchableOpacity
                key={ticket.id}
                style={styles.ticketCard}
                onPress={() => onSelectTicket(ticket)}
                activeOpacity={0.7}
              >
                <View style={styles.ticketCardHeader}>
                  <Text style={styles.ticketSubject} numberOfLines={1}>
                    {ticket.subject || 'Support Ticket'}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '1A' }]}>
                    <Text style={[styles.statusBadgeText, { color: getStatusColor(ticket.status) }]}>
                      {ticket.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.ticketLastMessage} numberOfLines={2}>
                  {ticket.lastMessage || 'No messages yet.'}
                </Text>

                <View style={styles.ticketFooter}>
                  <Text style={styles.ticketDate}>
                    {new Date(ticket.updatedAt?.toDate ? ticket.updatedAt.toDate() : ticket.updatedAt).toLocaleDateString()}
                  </Text>
                  {isAdmin && ticket.userId && (
                    <Text style={styles.ticketUser}>User ID: {ticket.userId.slice(0, 8)}...</Text>
                  )}
                  <Ionicons name="chevron-forward" size={16} color={Colors.outline} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* FAQs Section (Only for Users, not in ticketsOnly mode) */}
        {!isAdmin && faqs.length > 0 && !ticketsOnly && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            <View style={styles.faqList}>
              {faqs.map((faq) => {
                const isExpanded = expandedFaqId === faq.id;
                return (
                  <View key={faq.id} style={styles.faqCard}>
                    <TouchableOpacity
                      style={styles.faqHeader}
                      onPress={() => toggleFaq(faq.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.faqQuestion}>{faq.question}</Text>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={Colors.primary}
                      />
                    </TouchableOpacity>
                    {isExpanded && (
                      <View style={styles.faqBody}>
                        <Text style={styles.faqAnswer}>{faq.answer}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Create New Ticket Button */}
      {!isAdmin && onCreateNew && (
        <TouchableOpacity style={styles.fab} onPress={onCreateNew} activeOpacity={0.8}>
          <Ionicons name="add" size={24} color="#FFF" />
          <Text style={styles.fabText}>New Ticket</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FBFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.pill,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary + '1A',
  },
  tabButtonActiveAdmin: {
    backgroundColor: Colors.secondary + '1A',
  },
  tabButtonText: {
    ...Typography.buttonSm,
    color: Colors.outline,
  },
  tabButtonTextActive: {
    color: Colors.primary,
  },
  tabButtonTextActiveAdmin: {
    color: Colors.secondary,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.xl,
    paddingBottom: Spacing.xxxl * 2,
  },
  section: {
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.primary,
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
    backgroundColor: '#FFF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#F0F2F5',
    ...Shadows.card,
  },
  emptyTitle: {
    ...Typography.h4,
    color: Colors.onSurface,
    marginTop: Spacing.md,
  },
  emptyDesc: {
    ...Typography.bodySm,
    color: Colors.outline,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  ticketCard: {
    backgroundColor: '#FFF',
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#F0F2F5',
    ...Shadows.card,
    marginBottom: Spacing.sm,
  },
  ticketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  ticketSubject: {
    ...Typography.h4,
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
  ticketLastMessage: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.md,
  },
  ticketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
    paddingTop: Spacing.sm,
  },
  ticketDate: {
    ...Typography.bodySm,
    color: Colors.outline,
  },
  ticketUser: {
    ...Typography.bodySm,
    color: Colors.outline,
    fontFamily: 'Inter_600SemiBold',
  },
  faqList: {
    gap: Spacing.sm,
  },
  faqCard: {
    backgroundColor: '#FFF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#F0F2F5',
    ...Shadows.card,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  faqQuestion: {
    ...Typography.button,
    color: Colors.onSurface,
    flex: 1,
    marginRight: Spacing.sm,
  },
  faqBody: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  faqAnswer: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.pill,
    gap: Spacing.xs,
    ...Shadows.button,
  },
  fabText: {
    ...Typography.button,
    color: '#FFF',
  },
});
