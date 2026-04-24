import { apiClient, ApiSuccessResponse } from './client';
import { challengesApi } from './challenges.api';
import { communitiesApi } from './communities.api';
import { getMe } from './user.api';
import type { Challenge, ChallengeParticipant } from './types';

export interface ChallengeWithProgress extends Challenge {
  mongoId?: string;
  progress?: number;
  isParticipating?: boolean;
  // participantCount is inherited from Challenge
  completedTasks?: number;
  totalTasks?: number;
  joinedAt?: string;
  depositAmount?: number;
  completionReward?: number;
  tasks?: any[];
  category?: string;
  duration?: string;
  creator?: any;
}

export interface ChallengesPageData {
  community: any;
  challenges: ChallengeWithProgress[];
  userParticipations: any[];
  currentUser: any;
}

function toCount(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

function toProgressPercent(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function progressFromCompleted(completed: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((completed / total) * 100)));
}

/**
 * Transform backend challenge data to frontend format
 */
function transformChallenge(backendChallenge: any): ChallengeWithProgress {
  const canonicalChallengeId = String(backendChallenge.id || backendChallenge._id || '');
  const mongoChallengeId = backendChallenge._id ? String(backendChallenge._id) : undefined;

  // Transform participants - backend returns userName and userAvatar
  const participants = (backendChallenge.participants || []).map((p: any) => ({
    id: String(p._id || p.id || ''),
    oderId: p.oderId || p.id,
    userId: String(p.userId?._id || p.userId || ''),
    challengeId: canonicalChallengeId,
    name: p.userName || p.userId?.name || p.name || 'Participant',
    avatar: p.userAvatar || p.userId?.avatar || p.userId?.profile_picture || p.avatar,
    score: p.totalPoints || p.score || 0,
    progress: p.progress || 0,
    completedTasks: p.completedTasks?.map((t: any) => String(t)) || [],
    joinedAt: p.joinedAt || new Date().toISOString(),
    isActive: p.isActive !== false,
  }));

  // Calculate participant count
  const participantCount = backendChallenge.participantCount || participants.length;

  // Transform tasks
  const tasks = (backendChallenge.tasks || []).map((task: any) => ({
    id: String(task._id || task.id || ''),
    challengeId: canonicalChallengeId,
    title: task.title || '',
    description: task.description || '',
    points: task.points || 0,
    order: task.ordre || task.order || 0,
    createdAt: task.createdAt || new Date().toISOString(),
  }));

  // Transform creator
  const creator = backendChallenge.creatorId ? {
    id: String(backendChallenge.creatorId._id || backendChallenge.creatorId.id || ''),
    name: backendChallenge.creatorId.name || backendChallenge.creatorName || 'Unknown',
    avatar: backendChallenge.creatorId.avatar || backendChallenge.creatorId.profile_picture || backendChallenge.creatorAvatar || undefined,
  } : {
    id: '',
    name: backendChallenge.creatorName || 'Unknown',
    avatar: backendChallenge.creatorAvatar || undefined,
  };

  // Calculate if challenge is active
  const now = new Date();
  const startDate = new Date(backendChallenge.startDate);
  const endDate = new Date(backendChallenge.endDate);
  const isActive = backendChallenge.isActive !== false && startDate <= now && endDate >= now;

  return {
    id: canonicalChallengeId,
    mongoId: mongoChallengeId,
    title: backendChallenge.title || '',
    slug: backendChallenge.slug || '',
    description: backendChallenge.description || '',
    communityId: String(backendChallenge.communityId || ''),
    creatorId: String(backendChallenge.creatorId?._id || backendChallenge.creatorId?.id || backendChallenge.creatorId || ''),
    thumbnail: backendChallenge.thumbnail || undefined,
    startDate: backendChallenge.startDate || startDate.toISOString(),
    endDate: backendChallenge.endDate || endDate.toISOString(),
    prize: backendChallenge.completionReward || backendChallenge.prize || undefined,
    difficulty: backendChallenge.difficulty || 'medium',
    isActive,
    participantCount,
    participants, // Include participants array for component compatibility
    createdAt: backendChallenge.createdAt || new Date().toISOString(),
    // Additional fields for component compatibility
    depositAmount: backendChallenge.depositAmount || 0,
    completionReward: backendChallenge.completionReward || 0,
    category: backendChallenge.category || 'General',
    duration: backendChallenge.duration || '',
    tasks,
    creator,
  };
}

/**
 * Transform backend participation data
 */
function transformParticipation(backendParticipation: any): any {
  const completedTasks = toCount(backendParticipation.completedTasks);
  const totalTasks = toCount(backendParticipation.totalTasks);
  const reportedProgress = toProgressPercent(backendParticipation.progress);
  const derivedProgress = progressFromCompleted(completedTasks, totalTasks);

  return {
    challengeId: String(backendParticipation.challengeId || backendParticipation._id || ''),
    joinedAt: backendParticipation.joinedAt || new Date().toISOString(),
    progress: Math.max(reportedProgress, derivedProgress),
    completedTasks,
    totalTasks,
    isActive: backendParticipation.isActive !== false,
    lastActivityAt: backendParticipation.lastActivityAt || backendParticipation.joinedAt || new Date().toISOString(),
  };
}

/**
 * Challenges Community API Service
 */
export const challengesCommunityApi = {
  /**
   * Fetch all data needed for challenges page
   */
  async getChallengesPageData(slug: string): Promise<ChallengesPageData> {
    try {
      // Fetch in parallel
      const [communityResponse, challengesResponse, userParticipationsResponse, currentUser] = await Promise.allSettled([
        communitiesApi.getBySlug(slug),
        challengesApi.getByCommunity(slug),
        // Get user participations - backend endpoint: GET /challenges/user/my-participations?communitySlug=...
        // This endpoint requires auth, so we catch 401/403 errors and return empty participations
        apiClient.get('/challenges/user/my-participations', { communitySlug: slug }).catch((error) => {
          // Return empty participations for auth errors (user not logged in)
          console.log('User participations fetch failed (likely not logged in):', error?.message || error);
          return { data: { participations: [] } } as any;
        }),
        getMe().catch(() => null),
      ]);

      // Handle community
      if (communityResponse.status === 'rejected') {
        throw new Error(`Failed to fetch community: ${communityResponse.reason}`);
      }
      const community = communityResponse.value.data;

      // Handle challenges
      let challenges: ChallengeWithProgress[] = [];
      if (challengesResponse.status === 'fulfilled') {
        const challengesData = challengesResponse.value;
        // Backend returns array of challenges
        const challengesList = challengesData?.data || challengesData || [];
        challenges = Array.isArray(challengesList)
          ? challengesList.map(transformChallenge)
          : [];
      }

      // Handle user participations
      let userParticipations: any[] = [];
      if (userParticipationsResponse.status === 'fulfilled') {
        const participationsData = userParticipationsResponse.value as any;
        const participationsList = participationsData?.data?.participations || participationsData?.participations || [];
        userParticipations = Array.isArray(participationsList)
          ? participationsList.map(transformParticipation)
          : [];
      }

      // Transform current user
      const user = currentUser.status === 'fulfilled' && currentUser.value
        ? {
          id: String(currentUser.value._id || currentUser.value.id || ''),
          email: currentUser.value.email || '',
          username: currentUser.value.username || currentUser.value.name || '',
          firstName: currentUser.value.firstName || currentUser.value.name?.split(' ')[0] || undefined,
          lastName: currentUser.value.lastName || currentUser.value.name?.split(' ').slice(1).join(' ') || undefined,
          avatar: currentUser.value.avatar || currentUser.value.profile_picture || undefined,
          bio: currentUser.value.bio || undefined,
          role: currentUser.value.role || 'member',
          verified: currentUser.value.verified || false,
          createdAt: currentUser.value.createdAt || new Date().toISOString(),
          updatedAt: currentUser.value.updatedAt || new Date().toISOString(),
        }
        : null;

      // Merge challenges with participation data
      const challengesWithProgress: ChallengeWithProgress[] = challenges.map(challenge => {
        const participation = userParticipations.find(
          (p) =>
            p.challengeId === challenge.id ||
            (challenge.mongoId && p.challengeId === challenge.mongoId),
        );

        const fallbackParticipant = user?.id
          ? (challenge.participants || []).find(
              (participant: any) => String(participant.userId) === String(user.id),
            )
          : undefined;

        const totalTasks = challenge.tasks?.length || toCount(participation?.totalTasks);
        const completedFromParticipation = toCount(participation?.completedTasks);
        const completedFromFallback = toCount(fallbackParticipant?.completedTasks);
        const completedTasks = Math.max(completedFromParticipation, completedFromFallback);
        const reportedProgress = Math.max(
          toProgressPercent(participation?.progress),
          toProgressPercent(fallbackParticipant?.progress),
        );
        const derivedProgress = progressFromCompleted(completedTasks, totalTasks);

        return {
          ...challenge,
          isParticipating: !!participation || !!fallbackParticipant,
          progress: Math.max(reportedProgress, derivedProgress),
          completedTasks,
          totalTasks,
          joinedAt: participation?.joinedAt || fallbackParticipant?.joinedAt,
        };
      });

      return {
        community,
        challenges: challengesWithProgress,
        userParticipations,
        currentUser: user,
      };
    } catch (error) {
      console.error('Error fetching challenges page data:', error);
      throw error;
    }
  },
};

