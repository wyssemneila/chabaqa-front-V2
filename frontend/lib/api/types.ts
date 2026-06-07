// Common types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// User types
export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  role: 'admin' | 'creator' | 'member';
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Community types
export interface Community {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  category: string;
  tags: string[];
  logo?: string;
  logoUrl?: string;
  image?: string;
  coverImage?: string;
  coverUrl?: string;
  thumbnailUrl?: string;
  price: number;
  priceType: 'free' | 'monthly' | 'yearly' | 'one-time';
  type?: 'community' | 'course' | 'challenge' | 'event' | 'oneToOne' | 'product';
  members: number;
  rating: number;
  averageRating?: number;
  ratingCount?: number;
  verified: boolean;
  featured: boolean;
  creator: {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
  };
  settings?: CommunitySettings;
  isPrivate?: boolean;
  inviteLink?: string;
  fees_of_join?: number;
  currency?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvitePreview {
  communityId: string;
  slug: string;
  name: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  creator?: {
    name: string;
    avatar?: string;
  };
  membersCount?: number;
  price: number;
  currency?: string;
  isPrivate: boolean;
  priceType?: string;
}

export interface CommunitySocialLinks {
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  discord?: string;
  behance?: string;
  github?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
  website?: string;
}

export interface CommunitySettings {
  id?: string;
  communityId?: string;
  allowMemberPosts?: boolean;
  requireApproval?: boolean;
  allowInvites?: boolean;
  visibility?: 'public' | 'private' | 'hidden';
  updatedAt?: string;
  primaryColor?: string;
  secondaryColor?: string;
  welcomeMessage?: string;
  features?: string[];
  benefits?: string[];
  template?: string;
  fontFamily?: string;
  borderRadius?: number;
  backgroundStyle?: string;
  heroLayout?: string;
  headerStyle?: 'default' | 'centered' | 'minimal';
  contentWidth?: 'narrow' | 'normal' | 'wide' | 'full';
  showStats?: boolean;
  showHero?: boolean;
  showFeatures?: boolean;
  showBenefits?: boolean;
  showTestimonials?: boolean;
  showPosts?: boolean;
  showFAQ?: boolean;
  enableAnimations?: boolean;
  enableParallax?: boolean;
  logo?: string;
  heroBackground?: string;
  gallery?: string[];
  videoUrl?: string;
  socialLinks?: CommunitySocialLinks;
  customSections?: any[];
  metaTitle?: string;
  metaDescription?: string;
  customDomain?: string;
  headerScripts?: string;
}

export interface CommunityMember {
  id: string;
  userId: string;
  communityId: string;
  role: 'owner' | 'admin' | 'moderator' | 'support' | 'member';
  joinedAt: string;
  user: User;
}

export interface CommunityFilters {
  category?: string;
  priceType?: string;
  featured?: boolean;
  verified?: boolean;
  minMembers?: number;
  sortBy?: 'popular' | 'newest' | 'members' | 'rating';
}

// Course types
export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  communityId: string;
  creatorId: string;
  thumbnail?: string;
  price: number;
  priceType: 'free' | 'paid';
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  isPublished: boolean;
  enrollmentCount: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseSection {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  createdAt: string;
}

export interface CourseChapter {
  id: string;
  sectionId: string;
  title: string;
  content: string;
  videoUrl?: string;
  duration: number;
  order: number;
  isFree: boolean;
  createdAt: string;
}

export interface CourseEnrollment {
  id: string;
  userId: string;
  courseId: string;
  progress: number;
  completedChapters: string[];
  enrolledAt: string;
  lastAccessedAt: string;
}

// Challenge types
export interface ChallengeResource {
  id?: string;
  title: string;
  type: 'video' | 'article' | 'code' | 'tool' | 'pdf' | 'link';
  url: string;
  description?: string;
  order?: number;
}

export interface ChallengeTaskResource {
  id?: string;
  title: string;
  type: 'video' | 'article' | 'code' | 'tool';
  url: string;
  description?: string;
}

export interface ChallengeTask {
  id: string;
  challengeId?: string;
  day: number;
  title: string;
  description: string;
  deliverable?: string;
  points: number;
  instructions?: string;
  notes?: string;
  isActive?: boolean;
  isCompleted?: boolean;
  resources?: ChallengeTaskResource[];
  createdAt?: string;
  order?: number; // legacy
}

export interface ChallengeParticipant {
  id: string;
  userId: string;
  challengeId: string;
  score: number;
  progress: number;
  completedTasks: string[];
  joinedAt: string;
  isActive?: boolean;
  user: User | {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface ChallengePricing {
  participationFee: number;
  currency: string;
  depositAmount?: number;
  depositRequired?: boolean;
  isPremium?: boolean;
  completionReward?: number;
  topPerformerBonus?: number;
  streakBonus?: number;
  premiumFeatures?: {
    personalMentoring?: boolean;
    exclusiveResources?: boolean;
    priorityFeedback?: boolean;
    certificate?: boolean;
    liveSessions?: boolean;
    communityAccess?: boolean;
  };
  paymentOptions?: {
    allowInstallments?: boolean;
    installmentCount?: number;
    earlyBirdDiscount?: number;
    groupDiscount?: number;
    memberDiscount?: number;
  };
  freeTrialDays?: number;
  trialFeatures?: string[];
}

export interface Challenge {
  id: string;
  mongoId?: string;
  title: string;
  slug?: string;
  description: string;
  communityId: string;
  communitySlug?: string;
  creatorId: string;
  thumbnail?: string;
  startDate: string;
  endDate: string;
  prize?: string;
  difficulty: 'easy' | 'medium' | 'hard' | string;
  category?: string;
  isActive: boolean;
  participantCount: number;
  participants?: ChallengeParticipant[];
  tasks?: ChallengeTask[];
  resources?: ChallengeResource[];
  notes?: string;
  duration?: string;
  depositAmount?: number;
  completionReward?: number;
  pricing?: ChallengePricing;
  sequentialProgression?: boolean;
  unlockMessage?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ChallengeUnlockedTask {
  id: string;
  title: string;
  day: number;
  isCompleted: boolean;
  isUnlocked: boolean;
}

export interface ChallengeUnlockedTasksResponse {
  unlockedTasks: ChallengeUnlockedTask[];
  sequentialProgressionEnabled: boolean;
  unlockMessage?: string;
}

// Session types
export interface Session {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  image?: string;
  communityId: string;
  communitySlug?: string;
  communityName?: string;
  creatorId: string;
  duration: number; // in minutes
  price: number;
  currency: string;
  availableSlots: number;
  bookedSlots: number;
  averageRating?: number;
  ratingCount?: number;
  category?: string;
  bookingsCount?: number;
  bookingsThisWeek?: number;
  canBookMore?: boolean;
  notes?: string;
  resources?: Array<Record<string, unknown>>;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface SessionBooking {
  id: string;
  userId: string;
  sessionId: string;
  creatorId?: string;
  communityId?: string;
  scheduledAt: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  meetingLink?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// Event types
/**
 * Event interface for frontend
 * 
 * **Dual ID System:**
 * - `_id`: MongoDB ObjectId (optional) - Used internally by backend
 * - `id`: Custom string ID (required) - Primary identifier for API operations
 */
export interface Event {
  /** MongoDB ObjectId - Optional field for backend compatibility */
  _id?: string;
  /** Custom event ID - Primary identifier */
  id: string;
  title: string;
  slug: string;
  description: string;
  communityId?: string;
  creatorId?: string;
  thumbnail?: string;
  image?: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  location?: string;
  isVirtual?: boolean;
  maxAttendees?: number;
  currentAttendees?: number;
  attendeesCount?: number;
  price: number;
  type?: string;
  category?: string;
  tags?: string[];
  onlineUrl?: string;
  isPublished: boolean;
  isActive: boolean;
  timezone: string;
  attendees: any[];
  createdAt: string;
  updatedAt?: string;
}

export interface EventTicket {
  id: string;
  eventId?: string;
  name: string;
  price: number;
  quantity?: number;
  sold?: number;
  type?: string;
  description?: string;
}

// Product types
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  communityId: string;
  community?: {
    id: string;
    name: string;
    slug: string;
  };
  creatorId: string;
  creator?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  thumbnail?: string;
  images?: string[];
  price: number;
  type: 'digital' | 'physical';
  isPublished: boolean;
  salesCount?: number;
  sales?: number;
  rating: number;
  averageRating?: number;
  ratingCount?: number;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  price: number;
  stock?: number;
}

export interface ProductFile {
  id: string;
  productId: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

// Post types
export interface PostLink {
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  communityId: string;
  authorId: string;
  thumbnail?: string;
  isPublished: boolean;
  likes: number;
  likesCount?: number; // Alias for likes, kept for backwards compatibility
  reactions?: PostReaction[];
  commentsCount: number;
  shareCount: number;
  isLikedByUser?: boolean;
  isSharedByUser?: boolean;
  isBookmarkedByUser?: boolean;
  isPinned?: boolean;
  pinnedAt?: string;
  comments?: PostComment[];
  images?: string[];
  videos?: string[];
  links?: PostLink[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  author: User;
}

export type PostShareMethod =
  | 'native'
  | 'copy_link'
  | 'whatsapp'
  | 'x'
  | 'facebook'
  | 'linkedin'
  | 'telegram'
  | 'email';

export interface PostShareMeta {
  postId: string;
  shareUrl: string;
  title: string;
  text: string;
  platformUrls: {
    whatsapp: string;
    x: string;
    facebook: string;
    linkedin: string;
    telegram: string;
    email: string;
  };
}

export interface PostStats {
  postId: string;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  isLikedByUser: boolean;
  isSharedByUser: boolean;
}

export interface PostComment {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  parentId?: string;
  replies?: PostComment[];
  createdAt: string;
  updatedAt: string;
}

export interface PostReaction {
  emoji: string;
  count: number;
  usersIncludeMe: boolean;
  usernames?: string[];
  userNames?: string[];
  users?: Array<{
    id?: string;
    username?: string;
    firstName?: string;
    name?: string;
  }>;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: User;
}

// Payment types
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
}

export interface Subscription {
  id: string;
  userId: string;
  communityId: string;
  status: 'active' | 'cancelled' | 'past_due';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

// Analytics types
export interface DashboardAnalytics {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  members: {
    total: number;
    new: number;
    active: number;
  };
  engagement: {
    posts: number;
    comments: number;
    likes: number;
  likesCount?: number; // Alias for likes, kept for backwards compatibility
    shares: number;
  };
}

export interface RevenueAnalytics {
  period: string;
  revenue: number;
  transactions: number;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data?: any;
  createdAt: string;
}

// Storage types
export interface UploadedFile {
  assetId?: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimetype: string;
  type: string;
  uploadedAt: string;
}

// Progression types
export type ProgressionContentType =
  | 'course'
  | 'challenge'
  | 'session'
  | 'event'
  | 'product'
  | 'post'
  | 'resource'
  | 'community'
  | 'subscription';

export interface ProgressionActionLinks {
  view: string;
  continue?: string;
}

export interface ProgressionCommunityRef {
  id: string;
  name?: string;
  slug?: string;
}

export interface ProgressionItem {
  contentId: string;
  contentType: ProgressionContentType;
  title: string;
  description?: string;
  thumbnail?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progressPercent?: number;
  lastAccessedAt?: string;
  completedAt?: string;
  community?: ProgressionCommunityRef;
  meta?: Record<string, unknown>;
  actions?: ProgressionActionLinks;
}

export interface ProgressionSummaryByType {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  byType: Record<string, ProgressionSummaryByType>;
}

export interface ProgressionSummary {
  totalItems: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  byType: Record<string, ProgressionSummaryByType>;
}

export interface ProgressionPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: ProgressionItem[];
}

export interface ProgressionOverview {
  summary: ProgressionSummary;
  pagination: ProgressionPagination;
  items: ProgressionItem[];
}

// Learning path types
export interface LearningPathItem {
  id: string;
  type: 'chapter' | 'challenge' | 'resource';
  contentId: string;
  title: string;
  reason: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface LearningPathResponse {
  items: LearningPathItem[];
}

// Resource types
export type ResourceType = 'Article' | 'Video' | 'Guide' | 'Podcast' | 'Ebook';

export type ResourceElementType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'link'
  | 'code'
  | 'quote';

export interface ResourceContentElement {
  type: ResourceElementType;
  content: string;
  title?: string;
  description?: string;
  alt?: string;
  caption?: string;
  order?: number;
  metadata?: Record<string, any>;
}

export interface ResourceGuideSection {
  title: string;
  description?: string;
  order?: number;
  elements?: ResourceContentElement[];
}

export interface ResourceContentArticle {
  elements?: ResourceContentElement[];
  excerpt?: string;
  tags?: string[];
}

export interface ResourceContentVideo {
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  quality?: string;
  description?: ResourceContentElement[];
}

export interface ResourceContentGuide {
  sections?: ResourceGuideSection[];
  introduction?: ResourceContentElement[];
  conclusion?: ResourceContentElement[];
  guideMetadata?: Record<string, any>;
}

export interface Resource {
  _id?: string;
  id?: string;
  titre: string;
  slug?: string;
  description: string;
  type: ResourceType;
  readTime?: string;
  category?: string;
  author?: string;
  authorName?: string;
  communityId?: string;
  thumbnailUrl?: string;
  coverImageUrl?: string;
  content?: ResourceContentArticle | ResourceContentVideo | ResourceContentGuide | Record<string, any>;
  isPublished?: boolean;
  isPremium?: boolean;
  tags?: string[];
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Messaging types
export type ConversationType = 'COMMUNITY_DM' | 'HELP_DM' | 'PEER_DM' | 'SESSION_TEMP_DM' | 'LIVE_SUPPORT';

export interface MessageAttachment {
  url: string;
  type: 'image' | 'file' | 'video';
  size: number;
  name?: string;
  mimeType?: string;
  width?: number;
  height?: number;
}

export interface MessageParticipant {
  id: string;
  _id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  avatar?: string;
  profile_picture?: string;
  photo_profil?: string;
  photo?: string;
  role?: string;
}

export interface MessageReaction {
  emoji: string;
  userIds: string[];
  count: number;
  usersIncludeMe?: boolean;
}

export interface MessageEditHistory {
  text?: string;
  editedBy: string | MessageParticipant;
  editedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  text?: string;
  clientRequestId?: string;
  replyToMessageId?: string | Message;
  attachments: MessageAttachment[];
  reactions?: MessageReaction[];
  readAt?: string;
  editedAt?: string;
  editedBy?: string | MessageParticipant;
  editHistory?: MessageEditHistory[];
  deletedAt?: string;
  deletedBy?: string | MessageParticipant;
  pinnedAt?: string;
  pinnedBy?: string | MessageParticipant;
  deletedFor?: string[];
  createdAt: string;
  updatedAt: string;
  sender?: MessageParticipant;
  recipient?: MessageParticipant;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  participantA: string | User;
  participantB?: string | User;
  communityId?: string | Community;
  lastMessageText: string;
  lastMessageAt?: string;
  unreadCountA: number;
  unreadCountB: number;
  isOpen: boolean;
  sessionId?: string;
  sessionBookingId?: string;
  expiresAt?: string;
  closedAt?: string;
  closeReason?: 'session_finished' | 'booking_cancelled' | 'booking_completed' | 'manual';
  supportStatus?: 'BOT_ACTIVE' | 'WAITING_ADMIN' | 'ASSIGNED' | 'CLOSED';
  assignedAdminId?: string;
  requestedAdminAt?: string;
  claimedAt?: string;
  closedByAdminId?: string;
  createdAt: string;
  updatedAt: string;
}

export type LiveSupportStatus = 'BOT_ACTIVE' | 'WAITING_ADMIN' | 'ASSIGNED' | 'CLOSED';

export interface LiveSupportTicket {
  id: string;
  type: 'LIVE_SUPPORT';
  participantA: string | User;
  supportStatus: LiveSupportStatus;
  isOpen: boolean;
  assignedAdminId?: string;
  requestedAdminAt?: string;
  claimedAt?: string;
  closedAt?: string;
  closeReason?: 'manual';
  lastMessageText?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LiveSupportMessage {
  id: string;
  conversationId: string;
  senderType: 'user' | 'ai' | 'admin';
  senderUserId?: string;
  senderAdminId?: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface InboxResponse {
  conversations: Conversation[];
  page: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  limit: number;
}

export interface MessagesResponse {
  messages: Message[];
  conversation: Conversation;
  page: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  limit: number;
}

export interface MessageSearchResponse {
  messages: Message[];
  page: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  limit: number;
}

// Achievement types
export interface AchievementCriteria {
  type: 'count_completed' | 'count_created' | 'time_spent' | 'streak_days' | 'points_earned' | 'community_join_date';
  contentType?: string;
  count?: number;
  timeMinutes?: number;
  days?: number;
  points?: number;
  monthsSinceJoin?: number;
}

export interface AchievementResponse {
  id: string;
  name: string;
  description: string;
  icon?: string;
  criteria: AchievementCriteria;
  communityId?: string;
  isActive: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  tags: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserAchievementResponse {
  id: string;
  userId: string;
  achievementId: string;
  communityId: string;
  earnedAt: string;
  metadata: Record<string, any>;
  isPublic: boolean;
  sharedAt?: string;
  achievement?: AchievementResponse;
}

export interface AchievementWithProgress extends AchievementResponse {
  isUnlocked: boolean;
  earnedAt?: string;
  userAchievementId?: string;
  progress?: number;
  currentValue?: number;
  targetValue?: number;
}
