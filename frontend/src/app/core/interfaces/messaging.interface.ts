import {
  CONVERSATION_TYPE_LABELS,
  ConversationType,
} from '../enums/domain.enum';

export { ConversationType, CONVERSATION_TYPE_LABELS };

export interface ConversationParticipant {
  userId: string;
  role: string;
  fullName: string | null;
  email: string | null;
}

export interface MessageItem {
  id: string;
  body: string;
  senderUserId: string;
  senderName?: string | null;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  orgId: string | null;
  type: ConversationType;
  subject: string | null;
  status: 'open' | 'closed';
  updatedAt: string;
  unread: boolean;
  lastMessage: {
    id: string;
    body: string;
    senderUserId: string;
    createdAt: string;
  } | null;
  participants: ConversationParticipant[];
}

export interface ConversationDetail {
  id: string;
  orgId: string | null;
  type: ConversationType;
  subject: string | null;
  status: 'open' | 'closed';
  updatedAt: string;
  participants: ConversationParticipant[];
  messages: MessageItem[];
}
