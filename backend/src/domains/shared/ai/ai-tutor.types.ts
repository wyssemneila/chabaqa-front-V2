export type AiTutorMode = 'chat' | 'summary' | 'quiz' | 'simplify';

export type AiTutorIntent =
  | 'question'
  | 'summary'
  | 'quiz'
  | 'simplify'
  | 'clarification'
  | 'other';

export type TutorSource = {
  id: string;
  label: string;
  excerpt: string;
};

export type TutorQuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sourceId?: string;
};

export type ChapterContextBundle = {
  courseId: string;
  courseTitle: string;
  chapterId: string;
  chapterTitle: string;
  sectionTitle: string;
  contextText: string;
  sources: TutorSource[];
  aiTutorEnabled: boolean;
};

export type ChatTutorResponse = {
  mode: 'chat';
  answer: string;
  sources: TutorSource[];
  intent: AiTutorIntent;
  chapterId: string;
  model: string;
};

export type SummaryTutorResponse = {
  mode: 'summary';
  summary: string;
  keyPoints: string[];
  sources: TutorSource[];
  chapterId: string;
  model: string;
};

export type QuizTutorResponse = {
  mode: 'quiz';
  questions: TutorQuizQuestion[];
  chapterId: string;
  model: string;
};

export type SimplifyTutorResponse = {
  mode: 'simplify';
  answer: string;
  sources: TutorSource[];
  chapterId: string;
  model: string;
};

export type TutorAskResponse =
  | ChatTutorResponse
  | SummaryTutorResponse
  | QuizTutorResponse
  | SimplifyTutorResponse;

export type TutorChapterInsight = {
  chapterId: string;
  chapterTitle: string;
  sectionTitle: string;
  totalQuestions: number;
  uniqueLearners: number;
  topQuestions: Array<{ text: string; count: number }>;
  intents: Record<string, number>;
  lastActivityAt: string | null;
  isConfusing: boolean;
};

export type TutorCourseInsights = {
  courseId: string;
  chapters: TutorChapterInsight[];
};
