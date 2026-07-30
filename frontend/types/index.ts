export type DocumentStatus = 'Active' | 'In Progress' | 'Completed';

export interface CourseDocument {
  id: string;
  title: string;
  filename: string;
  pageCount: number;
  fileSize?: string;
  isFavorite?: boolean;
  lastOpened?: string;
  dayId: string;
  slides: SlidePage[];
}

export interface LearningDay {
  id: string;
  dayNumber: number;
  title: string;
  status: DocumentStatus;
  documents: CourseDocument[];
}

export interface SlidePage {
  pageNumber: number;
  title: string;
  chapter: string;
  contentMarkdown: string;
  keyPoints: string[];
  visualType: 'diagram' | 'code' | 'architecture' | 'comparison' | 'concept';
  diagramMermaid?: string;
  codeSnippet?: string;
  transcriptRef?: string;
}

export type ViewerTool = 'read' | 'pen' | 'highlight' | 'note';

export interface Annotation {
  id: string;
  docId: string;
  pageNumber: number;
  type: 'highlight' | 'freehand' | 'sticky_note';
  text?: string;
  color?: string;
  strokeWidth?: number;
  svgPath?: string;
  position?: { x: number; y: number };
  noteText?: string;
  createdAt: string;
}

export interface Bookmark {
  docId: string;
  pageNumber: number;
  note?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  selectedContext?: {
    docTitle: string;
    pageNumber: number;
    chapter: string;
    highlightedText?: string;
  };
  citation?: {
    pageNumber: number;
    title: string;
  };
}

export interface PromptSuggestion {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
}

export type SummaryScope = 'slide' | 'chapter' | 'lesson';
export type AiTabType = 'chat' | 'summary' | 'quiz';

export interface ConceptCard {
  title: string;
  description: string;
  category?: 'Architecture' | 'Model' | 'Workflow' | 'Pattern' | 'Core';
}

export interface LessonSummary {
  scope: SummaryScope;
  quickSummary: string[];
  keyConcepts: ConceptCard[];
  learningObjectives: string[];
  importantTerms: string[];
  keyTakeaways: string;
  readingInfo: {
    estimatedTimeMinutes: number;
    difficulty: 'Easy' | 'Medium' | 'Advanced';
    wordCount: number;
    totalPages: number;
  };
}

export type QuizQuestionType = 'multiple_choice' | 'true_false' | 'fill_in_blank';

export interface QuizItem {
  id: string;
  type: QuizQuestionType;
  question: string;
  options?: string[]; // for multiple choice
  correctAnswer: string;
  explanation: string;
  slideRef?: number;
}
