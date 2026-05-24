import { db, auth } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  doc, 
  updateDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';

export interface Message {
  id?: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
  attachments?: string[];
}

export interface Ticket {
  id: string;
  userId: string;
  subject: string;
  status: 'open' | 'closed' | 'pending';
  lastMessage?: string;
  updatedAt: any;
  createdAt: any;
}

const TICKETS_COLLECTION = 'support_tickets';

export const createTicket = async (subject: string, initialMessage: string, attachments: string[] = []) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const ticketData = {
    userId: user.uid,
    subject,
    status: 'open',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: initialMessage,
  };

  const ticketRef = await addDoc(collection(db, TICKETS_COLLECTION), ticketData);
  
  // Add initial message to a subcollection
  await addDoc(collection(db, TICKETS_COLLECTION, ticketRef.id, 'messages'), {
    senderId: user.uid,
    senderName: user.displayName || 'User',
    text: initialMessage,
    attachments,
    createdAt: serverTimestamp(),
  });

  return ticketRef.id;
};

export const addReply = async (ticketId: string, text: string, attachments: string[] = []) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  await addDoc(collection(db, TICKETS_COLLECTION, ticketId, 'messages'), {
    senderId: user.uid,
    senderName: user.displayName || 'User',
    text,
    attachments,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, TICKETS_COLLECTION, ticketId), {
    updatedAt: serverTimestamp(),
    lastMessage: text,
  });
};

export const getTicketsWithMessages = (userId: string, callback: (tickets: any[]) => void) => {
  const q = query(
    collection(db, TICKETS_COLLECTION),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, async (snapshot) => {
    const ticketsData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    const ticketsWithMessages = await Promise.all(ticketsData.map(async (ticket) => {
      const messagesQ = query(
        collection(db, TICKETS_COLLECTION, ticket.id, 'messages'),
        orderBy('createdAt', 'asc')
      );
      const messagesSnapshot = await getDocs(messagesQ);
      const messages = messagesSnapshot.docs.map(mDoc => {
        const mData = mDoc.data();
        return {
          id: mDoc.id,
          sender: mData.senderId === userId ? 'user' : 'support',
          message: mData.text,
          date: mData.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
          attachments: mData.attachments?.map((uri: string) => ({ uri })) || [],
        };
      });

      return {
        ...ticket,
        date: ticket.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        messages
      };
    }));

    callback(ticketsWithMessages);
  });
};

export const getAllTicketsWithMessages = (callback: (tickets: any[]) => void) => {
  const q = query(
    collection(db, TICKETS_COLLECTION),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, async (snapshot) => {
    const ticketsData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    const ticketsWithMessages = await Promise.all(ticketsData.map(async (ticket) => {
      const messagesQ = query(
        collection(db, TICKETS_COLLECTION, ticket.id, 'messages'),
        orderBy('createdAt', 'asc')
      );
      const messagesSnapshot = await getDocs(messagesQ);
      const messages = messagesSnapshot.docs.map(mDoc => {
        const mData = mDoc.data();
        return {
          id: mDoc.id,
          sender: mData.senderId === ticket.userId ? 'user' : 'support',
          message: mData.text,
          date: mData.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
          attachments: mData.attachments?.map((uri: string) => ({ uri })) || [],
        };
      });

      return {
        ...ticket,
        date: ticket.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        messages
      };
    }));

    callback(ticketsWithMessages);
  });
};

export const updateTicketStatus = async (ticketId: string, status: string) => {
  await updateDoc(doc(db, TICKETS_COLLECTION, ticketId), {
    status,
    updatedAt: serverTimestamp(),
  });
};

export const getMessages = (ticketId: string, callback: (messages: Message[]) => void) => {
  const q = query(
    collection(db, TICKETS_COLLECTION, ticketId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Message[];
    callback(messages);
  });
};
