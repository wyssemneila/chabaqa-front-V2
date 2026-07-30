import { apiClient, ApiSuccessResponse, PaginatedResponse, PaginationParams } from './client';
import type { ApiGetOptions } from './client';
import type { Course, CourseSection, CourseChapter, CourseEnrollment } from './types';
import { getDeviceInfo } from '@/lib/utils/device';

export interface CreateCourseData {
  title?: string;
  slug?: string;
  titre?: string;
  description: string;
  communityId?: string;
  communitySlug?: string;
  thumbnail?: string;
  price?: number;
  prix?: number;
  priceType?: 'free' | 'paid';
  level?: 'beginner' | 'intermediate' | 'advanced';
  niveau?: string;
  duration?: number;
  duree?: string;
  isPaid?: boolean;
  devise?: string;
  currency?: string;
  category?: string;
  isPublished?: boolean;
  learningObjectives?: string[];
  requirements?: string[];
  sections?: any[];
}

export interface UpdateCourseData extends Partial<CreateCourseData> {
  titre?: string;
  description?: string;
  prix?: number;
  devise?: string;
  category?: string;
  niveau?: string;
  duree?: string;
  learningObjectives?: string[];
  requirements?: string[];
  notes?: string;
  isPublished?: boolean;
  thumbnail?: string;
}

export interface CreateSectionData {
  title: string;
  description?: string;
  order: number;
}

export interface CreateChapterData {
  title: string;
  content: string;
  videoUrl?: string;
  duration: number;
  order: number;
  isPaid?: boolean;
  isFree?: boolean;
  price?: number;
  notes?: string;
}

export interface TranscriptSegment {
  text: string;
  startMs: number;
  endMs: number;
}

export const normalizeCourseResponse = (response: any): any => {
  if (!response) return response;
  if (response?.cours) return response.cours;
  if (response?.data?.cours) return response.data.cours;
  if (response?.data?.data?.cours) return response.data.data.cours;
  if (response?.course) return response.course;
  if (response?.data?.course) return response.data.course;
  if (response?.data?.data?.course) return response.data.data.course;
  if (response?.data?.data) return response.data.data;
  if (response?.data) return response.data;
  return response;
};

export const normalizeCourseListResponse = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.cours)) return response.cours;
  if (Array.isArray(response?.courses)) return response.courses;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.cours)) return response.data.cours;
  if (Array.isArray(response?.data?.courses)) return response.data.courses;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.data?.cours)) return response.data.data.cours;
  if (Array.isArray(response?.data?.data?.courses)) return response.data.data.courses;
  return [];
};

// Courses API
export const coursesApi = {
  // Get all courses
  getAll: async (
    params?: PaginationParams,
    options?: ApiGetOptions,
  ): Promise<PaginatedResponse<Course>> => {
    return apiClient.get<PaginatedResponse<Course>>('/cours', params, options);
  },

  // Create course
  create: async (data: CreateCourseData): Promise<any> => {
    return apiClient.post<any>('/cours/create-cours', data);
  },

  // Get course by ID
  getById: async (id: string): Promise<ApiSuccessResponse<Course>> => {
    return apiClient.get<ApiSuccessResponse<Course>>(`/cours/${id}`);
  },

  // Get course details from backend cours module (supports mongo _id or custom id)
  getCoursById: async (id: string): Promise<any> => {
    return apiClient.get(`/cours/${id}`);
  },

  getUnlockedChapters: async (id: string): Promise<any> => {
    return apiClient.get(`/cours/${id}/unlocked-chapters`);
  },

  getCourseSession: async (courseId: string, currentChapterId?: string): Promise<any> => {
    const params: Record<string, string> = {};
    if (currentChapterId) params.currentChapterId = currentChapterId;
    return apiClient.get(`/cours/${courseId}/course-session`, params);
  },

  checkChapterAccessPaid: async (courseId: string, chapterId: string): Promise<any> => {
    return apiClient.get(`/cours/${courseId}/chapitres/${chapterId}/access`);
  },

  checkChapterAccessSequential: async (courseId: string, chapterId: string): Promise<any> => {
    return apiClient.get(`/cours/${courseId}/chapters/${chapterId}/access`);
  },

  startChapter: async (courseId: string, sectionId: string, chapterId: string, data?: { watchTime?: number }): Promise<any> => {
    return apiClient.post(
      `/course-enrollment/${courseId}/sections/${sectionId}/chapters/${chapterId}/start`,
      { watchTime: data?.watchTime ?? 0 },
    );
  },

  getCourseEnrollmentProgress: async (courseId: string): Promise<any> => {
    return apiClient.get(`/course-enrollment/${courseId}/progress`);
  },

  completeChapterEnrollment: async (courseId: string, chapterId: string): Promise<any> => {
    return apiClient.put(`/course-enrollment/${courseId}/chapters/${chapterId}/complete`);
  },

  updateChapterWatchTime: async (courseId: string, chapterId: string, watchTime: number, videoDuration?: number, isFinal?: boolean): Promise<any> => {
    return apiClient.put(`/course-enrollment/${courseId}/chapters/${chapterId}/watch-time`, {
      watchTime,
      videoDuration,
      isFinal,
    });
  },

  completeCourseEnrollment: async (courseId: string): Promise<any> => {
    return apiClient.put(`/course-enrollment/${courseId}/complete`);
  },

  // =========================================================================
  // TRACKING (Creator Analytics)
  // =========================================================================

  trackView: async (courseId: string): Promise<any> => {
    return apiClient.post(`/cours/${courseId}/track/view`, { metadata: getDeviceInfo() });
  },

  trackStart: async (courseId: string): Promise<any> => {
    return apiClient.post(`/cours/${courseId}/track/start`, { metadata: getDeviceInfo() });
  },

  trackComplete: async (courseId: string): Promise<any> => {
    return apiClient.post(`/cours/${courseId}/track/complete`, { metadata: getDeviceInfo() });
  },

  // Update course
  update: async (id: string, data: UpdateCourseData): Promise<ApiSuccessResponse<Course>> => {
    return apiClient.patch<ApiSuccessResponse<Course>>(`/cours/${id}`, data);
  },

  // Delete course
  delete: async (id: string): Promise<ApiSuccessResponse<void>> => {
    return apiClient.delete<ApiSuccessResponse<void>>(`/cours/${id}`);
  },

  // Get courses by community (using slug)
  getByCommunity: async (slug: string, params?: { page?: number; limit?: number; published?: boolean }): Promise<any> => {
    return apiClient.get(`/cours/community/${slug}`, params);
  },

  // Get user enrolled courses
  getMyCourses: async (params?: PaginationParams): Promise<any> => {
    return apiClient.get('/cours/user/mes-cours', params);
  },

  // Get courses created by the authenticated creator
  getCreated: async (params?: PaginationParams & { communityId?: string }): Promise<any> => {
    return apiClient.get('/cours/user/created', params);
  },

  // Get user progress for all courses
  getUserProgress: async (params?: PaginationParams): Promise<any> => {
    return apiClient.get('/cours/user/progress', params);
  },

  // Get user enrollments
  getMyEnrollments: async (): Promise<any> => {
    // This endpoint seems specific to enrollment module, checking if it needs /cours prefix
    // The controller read didn't show this. It might be in course-enrollment.controller.
    // We will leave it as is if it targets a different module, or assume it's correct.
    return apiClient.get('/course-enrollment/my-enrollments');
  },

  // Get course sections (Note: Backend doesn't have a direct getSections endpoint, usually part of getById)
  getSections: async (courseId: string): Promise<ApiSuccessResponse<CourseSection[]>> => {
    return apiClient.get<ApiSuccessResponse<CourseSection[]>>(`/cours/${courseId}/sections`);
  },

  // Create course section
  createSection: async (courseId: string, data: CreateSectionData): Promise<ApiSuccessResponse<CourseSection>> => {
    // Backend expects: POST /cours/:id/add-section
    return apiClient.post<ApiSuccessResponse<CourseSection>>(`/cours/${courseId}/add-section`, {
      titre: data.title,
      description: data.description,
      ordre: data.order
    });
  },

  // Update section
  updateSection: async (courseId: string, sectionId: string, data: { title?: string; description?: string; order?: number }): Promise<any> => {
    return apiClient.patch(`/cours/${courseId}/sections/${sectionId}`, {
      titre: data.title,
      description: data.description,
      ordre: data.order
    });
  },

  // Delete section
  deleteSection: async (courseId: string, sectionId: string): Promise<any> => {
    return apiClient.delete(`/cours/${courseId}/sections/${sectionId}`);
  },

  // Get course chapters
  getChapters: async (courseId: string): Promise<ApiSuccessResponse<CourseChapter[]>> => {
    return apiClient.get<ApiSuccessResponse<CourseChapter[]>>(`/cours/${courseId}/chapters`);
  },

  // Create course chapter
  createChapter: async (courseId: string, sectionId: string, data: CreateChapterData): Promise<ApiSuccessResponse<CourseChapter>> => {
    const isPaid = typeof data.isPaid === 'boolean' ? data.isPaid : !Boolean(data.isFree);
    // Backend expects: POST /cours/:id/sections/:sectionId/add-chapitre
    return apiClient.post<ApiSuccessResponse<CourseChapter>>(`/cours/${courseId}/sections/${sectionId}/add-chapitre`, {
      titre: data.title,
      description: data.content,
      videoUrl: data.videoUrl,
      duree: data.duration ? String(data.duration) : undefined,
      ordre: data.order,
      isPaid,
      prix: isPaid ? Number(data.price || 0) : 0,
      notes: data.notes || undefined,
    });
  },

  // Update chapter
  updateChapter: async (courseId: string, sectionId: string, chapterId: string, data: any): Promise<any> => {
    return apiClient.patch(`/cours/${courseId}/sections/${sectionId}/chapitres/${chapterId}`, data);
  },

  // Upload chapter video (direct)
  uploadChapterVideo: async (courseId: string, sectionId: string, chapterId: string, file: File): Promise<any> => {
    return apiClient.uploadFile(`/cours/${courseId}/sections/${sectionId}/chapitres/${chapterId}/upload-video`, file, 'file');
  },

  // Generate (or fetch cached) AI transcript for a chapter video
  generateChapterTranscript: async (
    courseId: string,
    sectionId: string,
    chapterId: string,
    options: { force?: boolean } = {},
  ): Promise<{ transcript: TranscriptSegment[]; skipped: boolean; enabled: boolean }> => {
    const query = options.force ? '?force=1' : '';
    return apiClient.post(`/cours/${courseId}/sections/${sectionId}/chapters/${chapterId}/transcribe${query}`, {});
  },

  // Delete chapter
  deleteChapter: async (courseId: string, sectionId: string, chapterId: string): Promise<any> => {
    return apiClient.delete(`/cours/${courseId}/sections/${sectionId}/chapitres/${chapterId}`);
  },

  // Enroll in course
  enroll: async (id: string, promoCode?: string): Promise<{ message: string; enrollment: CourseEnrollment }> => {
    const query = promoCode ? `?promoCode=${encodeURIComponent(promoCode)}` : '';
    return apiClient.post<{ message: string; enrollment: CourseEnrollment }>(`/cours/${id}/enroll${query}`);
  },

  initStripePayment: async (courseId: string, promoCode?: string, idempotencyKey?: string): Promise<any> => {
    const endpoint = promoCode
      ? `/payment/stripe-link/init/course?promoCode=${encodeURIComponent(promoCode)}`
      : `/payment/stripe-link/init/course`;

    return apiClient.post<any>(endpoint, { courseId }, { headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined });
  },

  initChapterStripePayment: async (
    courseId: string,
    chapterId: string,
    promoCode?: string,
    idempotencyKey?: string,
  ): Promise<any> => {
    const endpoint = promoCode
      ? `/payment/stripe-link/init/chapter?promoCode=${encodeURIComponent(promoCode)}`
      : `/payment/stripe-link/init/chapter`;

    return apiClient.post<any>(endpoint, { courseId, chapterId }, { headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined });
  },

  // Get course progress
  getProgress: async (id: string): Promise<ApiSuccessResponse<CourseEnrollment>> => {
    return apiClient.get<ApiSuccessResponse<CourseEnrollment>>(`/cours/${id}/track/progress`);
  },

  // Update chapter progress
  updateProgress: async (id: string, chapterId: string, progress: number): Promise<ApiSuccessResponse<void>> => {
    return apiClient.patch<ApiSuccessResponse<void>>(`/cours/${id}/progress/${chapterId}`, { progress });
  },

  // Complete chapter
  completeChapter: async (id: string, chapterId: string): Promise<ApiSuccessResponse<void>> => {
    return apiClient.post<ApiSuccessResponse<void>>(`/cours/${id}/complete/${chapterId}`);
  },

  // Get courses by user (creator)
  getByCreator: async (userId: string, params?: { page?: number; limit?: number; published?: boolean }): Promise<any> => {
    return apiClient.get(`/cours/by-user/${userId}`, { ...(params || {}), type: 'created' });
  },

  // =========================================================================
  // ENGAGEMENT & SOCIAL (Reviews, Likes, Bookmarks)
  // =========================================================================

  // Add a review
  addReview: async (courseId: string, rating: number, review: string): Promise<any> => {
    return apiClient.post(`/cours/${courseId}/track/rating`, { rating, review });
  },

  // Get reviews for a course
  getReviews: async (courseId: string): Promise<any> => {
    return apiClient.get(`/cours/${courseId}/reviews`);
  },

  // Like a course
  likeCourse: async (courseId: string): Promise<any> => {
    return apiClient.post(`/cours/${courseId}/track/like`, { metadata: getDeviceInfo() });
  },

  // Share a course
  shareCourse: async (courseId: string): Promise<any> => {
    return apiClient.post(`/cours/${courseId}/track/share`, { metadata: getDeviceInfo() });
  },

  // Bookmark a course (using custom bookmark ID or generating one)
  bookmarkCourse: async (courseId: string): Promise<any> => {
    // We use a generated ID or let backend handle it if possible
    // The backend expects `bookmarkId` in the body
    const bookmarkId = `bm_${Date.now()}`;
    return apiClient.post(`/cours/${courseId}/track/bookmark`, { bookmarkId });
  },

  // Remove a bookmark
  removeBookmark: async (courseId: string, bookmarkId: string): Promise<any> => {
    return apiClient.delete(`/cours/${courseId}/track/bookmark/${bookmarkId}`);
  },

  // =========================================================================
  // USER NOTES
  // =========================================================================

  // Create a note
  createNote: async (courseId: string, chapterId: string, content: string, timestamp?: number): Promise<any> => {
    return apiClient.post(`/cours/${courseId}/notes`, { chapterId, content, timestamp });
  },

  // Get user notes for a course
  getNotes: async (courseId: string): Promise<any> => {
    return apiClient.get(`/cours/${courseId}/notes`);
  },

  // Update a note
  updateNote: async (courseId: string, noteId: string, content: string): Promise<any> => {
    return apiClient.put(`/cours/${courseId}/notes/${noteId}`, { content });
  },

  // Delete a note
  deleteNote: async (courseId: string, noteId: string): Promise<any> => {
    return apiClient.delete(`/cours/${courseId}/notes/${noteId}`);
  },

  // =========================================================================
  // ADVANCED MANAGEMENT (Creator)
  // =========================================================================

  // Toggle sequential progression
  toggleSequentialProgression: async (courseId: string, enabled: boolean, unlockMessage?: string): Promise<any> => {
    return apiClient.patch(`/cours/${courseId}/sequential-progression`, { enabled, unlockMessage });
  },

  // Unlock a chapter for a specific user
  unlockChapterForUser: async (courseId: string, chapterId: string, userId: string): Promise<any> => {
    return apiClient.post(`/cours/${courseId}/chapters/${chapterId}/unlock`, { userId });
  },

  // Update thumbnail (file upload)
  updateThumbnailUrl: async (courseId: string, thumbnailUrl: string): Promise<any> => {
    return apiClient.put(`/cours/${courseId}/thumbnail`, { thumbnailUrl });
  },

  updateThumbnail: async (courseId: string, thumbnailUrl: string): Promise<any> => {
    return apiClient.put(`/cours/${courseId}/thumbnail`, { thumbnailUrl });
  },
};
