import { create } from 'zustand';
import { LearningDay, CourseDocument, ChatMessage, SummaryScope } from '../types';
import { INITIAL_COURSE_DAYS } from '../data/mockCourseData';

interface PlatformState {
  days: LearningDay[];
  selectedDocId: string;
  currentPage: number;
  searchQuery: string;
  pdfSearchQuery: string;
  selectedText: string | null;
  questionsUsed: number;
  questionsLimit: number;
  activeAiTab: 'chat' | 'summary' | 'quiz';
  summaryScope: SummaryScope;
  isSidebarOpen: boolean;
  sidebarWidth: number;
  isAiPanelOpen: boolean;
  aiPanelWidth: number;
  isDarkMode: boolean;
  isKeyboardModalOpen: boolean;
  isThumbnailsOpen: boolean;
  chatMessages: ChatMessage[];
  filterTab: 'all' | 'recent' | 'favorites';

  // Actions
  selectDocument: (docId: string) => void;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setSearchQuery: (query: string) => void;
  setPdfSearchQuery: (query: string) => void;
  setSelectedText: (text: string | null) => void;
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  incrementQuestionsUsed: () => void;
  setActiveAiTab: (tab: 'chat' | 'summary' | 'quiz') => void;
  setSummaryScope: (scope: SummaryScope) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  toggleAiPanel: () => void;
  setAiPanelWidth: (width: number) => void;
  toggleDarkMode: () => void;
  toggleKeyboardModal: () => void;
  toggleThumbnails: () => void;
  toggleFavorite: (docId: string) => void;
  addDocument: (dayId: string, newDoc: CourseDocument) => void;
  setFilterTab: (tab: 'all' | 'recent' | 'favorites') => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'ai',
    text: `Hello! I am your **Context-aware AI Tutor**. I am currently observing **Day 3 • Agentic AI.pdf** (Slide 1).\n\nFeel free to ask me anything about **Agentic AI architecture**, **Tool Calling**, or select any text on the slide to explain, simplify, or translate!`,
    timestamp: '10:00 AM',
    citation: {
      pageNumber: 1,
      title: 'Agentic AI Systems & Architecture'
    }
  }
];

export const usePlatformStore = create<PlatformState>((set, get) => ({
  days: INITIAL_COURSE_DAYS,
  selectedDocId: 'doc-301', // Agentic AI.pdf default selected
  currentPage: 1,
  searchQuery: '',
  pdfSearchQuery: '',
  selectedText: null,
  questionsUsed: 7,
  questionsLimit: 15,
  activeAiTab: 'chat',
  summaryScope: 'slide',
  isSidebarOpen: true,
  sidebarWidth: 280,
  isAiPanelOpen: true,
  aiPanelWidth: 380,
  isDarkMode: false,
  isKeyboardModalOpen: false,
  isThumbnailsOpen: false,
  chatMessages: INITIAL_MESSAGES,
  filterTab: 'all',

  selectDocument: (docId) => {
    set({
      selectedDocId: docId,
      currentPage: 1,
      selectedText: null
    });
  },

  setPage: (page) => {
    const state = get();
    const doc = state.days
      .flatMap((d) => d.documents)
      .find((doc) => doc.id === state.selectedDocId);
    if (!doc) return;
    const maxPage = doc.slides.length || 1;
    if (page >= 1 && page <= maxPage) {
      set({ currentPage: page });
    }
  },

  nextPage: () => {
    const { currentPage } = get();
    get().setPage(currentPage + 1);
  },

  prevPage: () => {
    const { currentPage } = get();
    get().setPage(currentPage - 1);
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setPdfSearchQuery: (query) => set({ pdfSearchQuery: query }),
  setSelectedText: (text) => set({ selectedText: text }),

  addChatMessage: (msg) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    set((state) => ({
      chatMessages: [...state.chatMessages, newMsg]
    }));
  },

  incrementQuestionsUsed: () => {
    set((state) => ({
      questionsUsed: Math.min(state.questionsUsed + 1, state.questionsLimit)
    }));
  },

  setActiveAiTab: (tab) => set({ activeAiTab: tab }),
  setSummaryScope: (scope) => set({ summaryScope: scope }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  toggleAiPanel: () => set((state) => ({ isAiPanelOpen: !state.isAiPanelOpen })),
  setAiPanelWidth: (width) => set({ aiPanelWidth: width }),
  toggleDarkMode: () => {
    set((state) => {
      const next = !state.isDarkMode;
      if (typeof document !== 'undefined') {
        if (next) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return { isDarkMode: next };
    });
  },
  toggleKeyboardModal: () => set((state) => ({ isKeyboardModalOpen: !state.isKeyboardModalOpen })),
  toggleThumbnails: () => set((state) => ({ isThumbnailsOpen: !state.isThumbnailsOpen })),

  toggleFavorite: (docId) => {
    set((state) => ({
      days: state.days.map((day) => ({
        ...day,
        documents: day.documents.map((doc) =>
          doc.id === docId ? { ...doc, isFavorite: !doc.isFavorite } : doc
        )
      }))
    }));
  },

  addDocument: (dayId, newDoc) => {
    set((state) => ({
      days: state.days.map((day) =>
        day.id === dayId
          ? { ...day, documents: [...day.documents, newDoc] }
          : day
      ),
      selectedDocId: newDoc.id,
      currentPage: 1
    }));
  },

  setFilterTab: (tab) => set({ filterTab: tab })
}));
