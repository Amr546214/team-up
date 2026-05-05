import type { ChatUser, Conversation, Message, ChatFilter } from '../types';

// Avatar image URLs from pravatar.cc (stable placeholder service)
const AVATAR_BASE_URL = 'https://i.pravatar.cc/150';

export const mockCurrentUser: ChatUser = {
  id: 'current-user-1',
  name: 'Alex Developer',
  role: 'developer',
  avatar: `${AVATAR_BASE_URL}?img=12`,
  status: 'online',
};

export const mockUsers: ChatUser[] = [
  {
    id: 'user-1',
    name: 'Sarah Client',
    role: 'client',
    avatar: `${AVATAR_BASE_URL}?img=1`,
    status: 'online',
  },
  {
    id: 'user-2',
    name: 'TechCorp Inc.',
    role: 'company',
    avatar: `${AVATAR_BASE_URL}?img=8`,
    status: 'offline',
  },
  {
    id: 'user-3',
    name: 'Mike Designer',
    role: 'developer',
    avatar: `${AVATAR_BASE_URL}?img=11`,
    status: 'busy',
  },
  {
    id: 'user-4',
    name: 'Emma Manager',
    role: 'team-leader',
    avatar: `${AVATAR_BASE_URL}?img=5`,
    status: 'away',
  },
  {
    id: 'user-5',
    name: 'DevStudio LLC',
    role: 'company',
    avatar: `${AVATAR_BASE_URL}?img=13`,
    status: 'online',
  },
  {
    id: 'user-6',
    name: 'Admin John',
    role: 'admin',
    avatar: `${AVATAR_BASE_URL}?img=3`,
    status: 'online',
  },
];

// Group avatar images (using higher numbered images for groups)
const GROUP_AVATAR_URL = 'https://i.pravatar.cc/150';
export const groupAvatars: Record<string, string> = {
  'conv-6': `${GROUP_AVATAR_URL}?img=20`, // Frontend Team
  'conv-7': `${GROUP_AVATAR_URL}?img=25`, // TeamUP Support
};

export const chatFilterLabels: Record<ChatFilter, string> = {
  all: 'All',
  direct: 'Chats',
  group: 'Groups',
  unread: 'Unread',
};

// Create dates for realistic conversation history
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
const lastWeek = new Date(today);
lastWeek.setDate(lastWeek.getDate() - 5);

// Helper to create a date with specific time
const createDate = (baseDate: Date, hours: number, minutes: number): Date => {
  const d = new Date(baseDate);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

const createMessage = (
  id: string,
  conversationId: string,
  senderId: string,
  content: string,
  date: Date,
  status: Message['status'] = 'read',
  type: Message['type'] = 'text'
): Message => ({
  id,
  conversationId,
  senderId,
  content,
  timestamp: date,
  status,
  type,
});

export const mockMessages: Record<string, Message[]> = {
  'conv-1': [
    createMessage('msg-1-1', 'conv-1', 'user-1', 'Hi! I have a new project for you.', createDate(yesterday, 14, 30), 'read'),
    createMessage('msg-1-2', 'conv-1', 'current-user-1', 'Great! Tell me more about it.', createDate(yesterday, 14, 35), 'read'),
    createMessage('msg-1-3', 'conv-1', 'user-1', 'It is a web app using React and Node.js.', createDate(yesterday, 14, 40), 'read'),
    createMessage('msg-1-4', 'conv-1', 'user-1', 'Are you available to start next week?', createDate(today, 9, 15), 'delivered'),
  ],
  'conv-2': [
    createMessage('msg-2-1', 'conv-2', 'user-2', 'Thank you for your application!', createDate(twoDaysAgo, 10, 0), 'read'),
    createMessage('msg-2-2', 'conv-2', 'user-2', 'We would like to schedule an interview.', createDate(twoDaysAgo, 10, 5), 'read'),
    createMessage('msg-2-3', 'conv-2', 'current-user-1', 'I am available tomorrow at 2 PM.', createDate(twoDaysAgo, 10, 30), 'read'),
    createMessage('msg-2-4', 'conv-2', 'user-2', 'Perfect! We will send you a calendar invite.', createDate(twoDaysAgo, 11, 0), 'read'),
    createMessage('msg-2-5', 'conv-2', 'user-2', 'Looking forward to speaking with you.', createDate(today, 8, 45), 'unread'),
  ],
  'conv-3': [
    createMessage('msg-3-1', 'conv-3', 'user-3', 'Hey! Want to collaborate on a project?', createDate(lastWeek, 16, 0), 'read'),
    createMessage('msg-3-2', 'conv-3', 'current-user-1', 'Sure! What kind of project?', createDate(lastWeek, 16, 5), 'read'),
    createMessage('msg-3-3', 'conv-3', 'user-3', 'A mobile app design for a fintech startup.', createDate(lastWeek, 16, 10), 'read'),
    createMessage('msg-3-4', 'conv-3', 'user-3', 'I handle UI/UX and you do the frontend?', createDate(today, 11, 30), 'delivered'),
  ],
  'conv-4': [
    createMessage('msg-4-1', 'conv-4', 'user-4', 'Team meeting at 3 PM today.', createDate(yesterday, 12, 0), 'read'),
    createMessage('msg-4-2', 'conv-4', 'current-user-1', 'Got it! I will be there.', createDate(yesterday, 12, 5), 'read'),
    createMessage('msg-4-3', 'conv-4', 'user-4', 'Please prepare your progress report.', createDate(yesterday, 12, 10), 'read'),
  ],
  'conv-5': [
    createMessage('msg-5-1', 'conv-5', 'user-5', 'We have reviewed your portfolio.', createDate(lastWeek, 9, 0), 'read'),
    createMessage('msg-5-2', 'conv-5', 'user-5', 'Impressive work! We have a project that matches your skills.', createDate(lastWeek, 9, 10), 'read'),
    createMessage('msg-5-3', 'conv-5', 'current-user-1', 'Thank you! What is the project about?', createDate(lastWeek, 9, 30), 'read'),
    createMessage('msg-5-4', 'conv-5', 'user-5', 'E-commerce platform with custom checkout flow.', createDate(today, 7, 50), 'unread'),
    createMessage('msg-5-5', 'conv-5', 'user-5', 'Budget is $15k, timeline 3 months.', createDate(today, 7, 55), 'unread'),
  ],
  'conv-6': [
    createMessage('msg-6-1', 'conv-6', 'user-3', 'Welcome to the Frontend Team group!', createDate(twoDaysAgo, 9, 0), 'read'),
    createMessage('msg-6-2', 'conv-6', 'user-4', 'Thanks for having me! Excited to work with everyone.', createDate(twoDaysAgo, 9, 5), 'read'),
    createMessage('msg-6-3', 'conv-6', 'user-1', 'Project kickoff meeting is scheduled for Monday.', createDate(yesterday, 15, 0), 'read'),
    createMessage('msg-6-4', 'conv-6', 'current-user-1', 'Got it. I will prepare the initial setup.', createDate(yesterday, 15, 10), 'read'),
    createMessage('msg-6-5', 'conv-6', 'user-3', 'Please share your GitHub handles.', createDate(today, 10, 30), 'unread'),
  ],
  'conv-7': [
    createMessage('msg-7-1', 'conv-7', 'user-6', 'Welcome to TeamUP Support!', createDate(lastWeek, 8, 0), 'read'),
    createMessage('msg-7-2', 'conv-7', 'user-6', 'This is your go-to place for platform updates and announcements.', createDate(lastWeek, 8, 5), 'read'),
    createMessage('msg-7-3', 'conv-7', 'current-user-1', 'Thanks! Looking forward to using the platform.', createDate(lastWeek, 8, 15), 'read'),
    createMessage('msg-7-4', 'conv-7', 'user-6', 'New feature: Direct messaging is now live!', createDate(yesterday, 16, 0), 'read'),
  ],
};

export const mockConversations: Conversation[] = [
  // Direct conversations
  {
    id: 'conv-1',
    type: 'direct',
    participants: [mockUsers[0]], // Sarah Client
    lastMessage: mockMessages['conv-1'][mockMessages['conv-1'].length - 1],
    unreadCount: 1,
    updatedAt: mockMessages['conv-1'][mockMessages['conv-1'].length - 1].timestamp,
  },
  {
    id: 'conv-2',
    type: 'direct',
    participants: [mockUsers[1]], // TechCorp Inc. (company)
    lastMessage: mockMessages['conv-2'][mockMessages['conv-2'].length - 1],
    unreadCount: 1,
    updatedAt: mockMessages['conv-2'][mockMessages['conv-2'].length - 1].timestamp,
  },
  {
    id: 'conv-3',
    type: 'direct',
    participants: [mockUsers[2]], // Mike Designer (developer)
    lastMessage: mockMessages['conv-3'][mockMessages['conv-3'].length - 1],
    unreadCount: 0,
    updatedAt: mockMessages['conv-3'][mockMessages['conv-3'].length - 1].timestamp,
  },
  {
    id: 'conv-4',
    type: 'direct',
    participants: [mockUsers[3]], // Emma Manager (team-leader)
    lastMessage: mockMessages['conv-4'][mockMessages['conv-4'].length - 1],
    unreadCount: 0,
    updatedAt: mockMessages['conv-4'][mockMessages['conv-4'].length - 1].timestamp,
  },
  {
    id: 'conv-5',
    type: 'direct',
    participants: [mockUsers[4]], // DevStudio LLC (company)
    lastMessage: mockMessages['conv-5'][mockMessages['conv-5'].length - 1],
    unreadCount: 2,
    updatedAt: mockMessages['conv-5'][mockMessages['conv-5'].length - 1].timestamp,
  },
  // Group conversations
  {
    id: 'conv-6',
    type: 'group',
    name: 'Frontend Team',
    avatar: groupAvatars['conv-6'],
    participants: [mockUsers[2], mockUsers[3], mockUsers[0]], // Mike, Emma, Sarah
    membersCount: 5,
    lastMessage: mockMessages['conv-6'][mockMessages['conv-6'].length - 1],
    unreadCount: 1,
    updatedAt: mockMessages['conv-6'][mockMessages['conv-6'].length - 1].timestamp,
  },
  {
    id: 'conv-7',
    type: 'group',
    name: 'TeamUP Support',
    avatar: groupAvatars['conv-7'],
    participants: [mockUsers[5]], // Admin John
    membersCount: 1250,
    lastMessage: mockMessages['conv-7'][mockMessages['conv-7'].length - 1],
    unreadCount: 0,
    updatedAt: mockMessages['conv-7'][mockMessages['conv-7'].length - 1].timestamp,
  },
];

export const getConversationMessages = (conversationId: string): Message[] => {
  return mockMessages[conversationId] || [];
};

export const getOtherParticipant = (conversation: Conversation): ChatUser => {
  return conversation.participants[0];
};

export const formatMessageTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
