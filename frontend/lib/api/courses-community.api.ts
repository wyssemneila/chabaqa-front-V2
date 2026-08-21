import { apiClient, ApiSuccessResponse } from '../core/client';
import { coursesApi } from './courses.api';
import { communitiesApi } from '../community/communities.api';
import { getMe } from '../user/user.api';
import type { Course, CourseEnrollment } from '../core/types';

export interface CourseWithProgress extends Course {
  progress?: number;
  isEnrolled?: boolean;
  enrollmentId?: string;
  enrolledAt?: string;
  completedChapters?: number;
  totalChapters?: number;
}

export interface CoursesPageData {
  community: any;
  courses: CourseWithProgress[];
  userEnrollments: CourseEnrollment[];
  currentUser: any;
}

/**
 * Transform backend course data to frontend format
 * Backend returns courses with sections and chapters nested
 */
export function transformCourse(backendCourse: any): any {
  if (!backendCourse) return null;

  // Extract inner data if wrapped in 'data' or 'cours' property
  const courseData = backendCourse.data || backendCourse.cours || backendCourse;

  // Transform sections and chapters
  const sections = [...(courseData.sections || [])]
    .sort((left: any, right: any) => Number(left.ordre ?? left.order ?? 0) - Number(right.ordre ?? right.order ?? 0))
    .map((section: any) => ({
    id: section.id || '',
    title: section.titre || section.title || '',
    description: section.description || '',
    order: section.ordre || section.order || 0,
    courseId: String(courseData._id || courseData.id || ''),
    chapters: [...(section.chapitres || [])]
      .sort((left: any, right: any) => Number(left.ordre ?? left.order ?? 0) - Number(right.ordre ?? right.order ?? 0))
      .map((chapter: any) => {
      // Schema: free preview = isPreview true or !isPaidChapter; backend sends isPreview and isPaid
      const isPaid = Boolean(chapter.isPaidChapter ?? chapter.isPaid);
      const isPreview = Boolean(chapter.isPreview ?? !isPaid);
      const content = typeof chapter.contenu === 'string' && chapter.contenu.trim().length > 0
        ? chapter.contenu
        : chapter.description || '';

      // Video URL handling: backend now strips videoUrl for premium chapters
      // and provides hasProtectedVideo + videoStorageKey instead
      const hasProtectedVideo = Boolean(chapter.hasProtectedVideo);
      const videoUrl = hasProtectedVideo ? '' : (chapter.videoUrl ?? chapter.video_url ?? chapter.videoURL ?? chapter.video ?? chapter.url ?? "");

      return {
        id: chapter.id || '',
        title: chapter.titre || chapter.title || '',
        content,
        videoUrl,
        hasProtectedVideo,
        videoStorageKey: chapter.videoStorageKey || null,
        // Handle duration: if duree > 300, it's likely already in seconds (legacy data)
        // Otherwise, duree is in minutes, convert to seconds
        duration: Number(chapter.duree ?? 0) > 300
          ? Number(chapter.duree ?? 0)
          : (Number(chapter.duree ?? 0) || 0) * 60,
        order: chapter.ordre || chapter.order || 0,
        isPaidChapter: isPaid,
        isPreview,
        price: Number(chapter.prix ?? chapter.price ?? 0) || 0,
        sectionId: String(chapter.sectionId || section.id || ''),
        notes: typeof chapter.notes === 'string' ? chapter.notes : '',
        resources: Array.isArray(chapter.ressources)
          ? chapter.ressources.map((r: any) => ({
            id: r.id || '',
            title: r.titre || r.title || '',
            titre: r.titre || r.title || '',
            type: r.type || 'link',
            url: r.url || '',
            description: r.description || '',
            order: r.ordre || r.order || 0,
          }))
          : [],
        createdAt: chapter.createdAt || new Date().toISOString(),
      };
    }),
    createdAt: section.createdAt || new Date().toISOString(),
    }));

  const enrollmentCount = courseData.inscriptions?.length || courseData.enrollmentCount || 0;

  // Transform creator data
  const creator = courseData.creator || (courseData.creatorId ? {
    id: String(courseData.creatorId._id || courseData.creatorId.id || ''),
    name: `${courseData.creatorId.nom || ''} ${courseData.creatorId.prenom || ''}`.trim() || courseData.creatorId.name || 'Unknown',
    avatar: courseData.creatorId.avatar || courseData.creatorId.profile_picture || courseData.creatorId.photo_profil || undefined,
  } : {
    id: '',
    name: 'Unknown',
    avatar: undefined,
  });

  return {
    // mongoId for API calls that expect _id; id must match backend enrollment.courseId (custom id)
    mongoId: String(courseData._id || courseData.mongoId || ''),
    id: String(courseData.id || courseData._id || ''),
    title: courseData.titre || courseData.title || '',
    slug: courseData.slug || '',
    description: courseData.description || '',
    communityId: String(courseData.communityId || ''),
    creatorId: String(courseData.creatorId?._id || courseData.creatorId?.id || courseData.creatorId || ''),
    creator, // Include creator object for component compatibility
    thumbnail: courseData.thumbnail || courseData.image || undefined,
    price: courseData.prix || courseData.price || 0,
    priceType: courseData.isPaidCourse ? 'paid' : 'free',
    level: courseData.niveau || courseData.level || 'beginner',
    duration: courseData.duree || courseData.duration || 0,
    isPublished: courseData.isPublished !== false,
    enrollmentCount,
    enrollments: courseData.inscriptions || courseData.enrollments || [],
    rating: Number(courseData.rating || courseData.averageRating || 0),
    averageRating: Number(courseData.averageRating || courseData.rating || 0),
    ratingCount: Number(courseData.ratingCount || courseData.totalRatings || courseData.reviews_count || 0),
    sequentialProgression: Boolean(courseData.sequentialProgression),
    unlockMessage: typeof courseData.unlockMessage === "string" ? courseData.unlockMessage : undefined,
    sections, // Include sections with chapters
    createdAt: courseData.createdAt || new Date().toISOString(),
    updatedAt: courseData.updatedAt || new Date().toISOString(),
  };
}

/**
 * Transform backend enrollment data to frontend format
 */
function transformEnrollment(backendEnrollment: any, course?: any): CourseEnrollment {
  const courseId = String(backendEnrollment.courseId?._id || backendEnrollment.courseId || backendEnrollment._id || '');

  // Calculate progress - backend uses sections.chapitres structure
  const totalChapters = course?.sections?.reduce((acc: number, section: any) =>
    acc + (section.chapters?.length || section.chapitres?.length || 0), 0) || 0;
  const completedChapters = backendEnrollment.progression?.filter((p: any) => p.isCompleted).length || 0;
  const progress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  return {
    id: String(backendEnrollment._id || backendEnrollment.id || ''),
    userId: String(backendEnrollment.userId?._id || backendEnrollment.userId || ''),
    courseId,
    progress,
    completedChapters: backendEnrollment.progression?.map((p: any) => String(p.chapterId || '')).filter(Boolean) || [],
    enrolledAt: backendEnrollment.enrolledAt || new Date().toISOString(),
    lastAccessedAt: backendEnrollment.updatedAt || backendEnrollment.enrolledAt || new Date().toISOString(),
  };
}

/**
 * Courses Community API Service
 */
export const coursesCommunityApi = {
  /**
   * Fetch all data needed for courses page
   */
  async getCoursesPageData(slug: string): Promise<CoursesPageData> {
    try {
      // Fetch in parallel (enrollment fetched client-side to access auth token)
      const [communityResponse, coursesResponse, currentUser] = await Promise.allSettled([
        communitiesApi.getBySlug(slug),
        coursesApi.getByCommunity(slug, { page: 1, limit: 100, published: true }),
        getMe().catch(() => null),
      ]);

      // Handle community
      if (communityResponse.status === 'rejected') {
        throw new Error(`Failed to fetch community: ${communityResponse.reason}`);
      }
      const community = communityResponse.value.data;

      // Handle courses
      let courses: Course[] = [];
      if (coursesResponse.status === 'fulfilled') {
        const coursesData = coursesResponse.value;
        // Backend returns { success: true, data: { courses: [...], pagination: {...} } }
        const coursesList = coursesData?.data?.courses || coursesData?.cours || coursesData?.data || coursesData || [];
        courses = Array.isArray(coursesList)
          ? coursesList.map(transformCourse)
          : [];
      }

      // User enrollments will be fetched client-side
      const userEnrollments: CourseEnrollment[] = [];

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

      // Merge courses with enrollment data
      const coursesWithProgress: CourseWithProgress[] = courses.map(course => {
        const enrollment = userEnrollments.find(e => e.courseId === course.id);

        // Calculate total chapters from sections
        const totalChapters = (course as any).sections?.reduce((acc: number, section: any) =>
          acc + (section.chapters?.length || 0), 0) || 0;

        return {
          ...course,
          isEnrolled: !!enrollment,
          progress: enrollment?.progress || 0,
          enrollmentId: enrollment?.id,
          enrolledAt: enrollment?.enrolledAt,
          completedChapters: enrollment?.completedChapters?.length || 0,
          totalChapters,
        };
      });

      return {
        community,
        courses: coursesWithProgress,
        userEnrollments,
        currentUser: user,
      };
    } catch (error) {
      console.error('Error fetching courses page data:', error);
      throw error;
    }
  },
};

