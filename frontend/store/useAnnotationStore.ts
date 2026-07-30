import { create } from 'zustand';
import { Annotation, Bookmark, ViewerTool } from '../types';

interface AnnotationState {
  activeTool: ViewerTool;
  activeColor: string;
  activeStrokeWidth: number;
  annotations: Annotation[];
  bookmarks: Bookmark[];
  undoStack: Annotation[][];
  redoStack: Annotation[][];

  // Actions
  setTool: (tool: ViewerTool) => void;
  setColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  addAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt'>) => void;
  removeAnnotation: (id: string) => void;
  updateNoteText: (id: string, text: string) => void;
  toggleBookmark: (docId: string, pageNumber: number) => void;
  undo: () => void;
  redo: () => void;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  activeTool: 'read',
  activeColor: '#2563EB',
  activeStrokeWidth: 3,
  annotations: [
    {
      id: 'ann-1',
      docId: 'doc-301',
      pageNumber: 1,
      type: 'highlight',
      text: 'From Chatbots to Autonomous AI Agents',
      color: '#FACC15',
      createdAt: new Date().toISOString()
    },
    {
      id: 'ann-2',
      docId: 'doc-301',
      pageNumber: 1,
      type: 'sticky_note',
      noteText: 'Important exam question: Difference between Chatbot and AI Agent!',
      position: { x: 420, y: 180 },
      createdAt: new Date().toISOString()
    }
  ],
  bookmarks: [
    {
      docId: 'doc-301',
      pageNumber: 1,
      note: 'Key definition of Agentic AI',
      createdAt: new Date().toISOString()
    }
  ],
  undoStack: [],
  redoStack: [],

  setTool: (tool) => set({ activeTool: tool }),
  setColor: (color) => set({ activeColor: color }),
  setStrokeWidth: (width) => set({ activeStrokeWidth: width }),

  addAnnotation: (ann) => {
    const newAnn: Annotation = {
      ...ann,
      id: `ann-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    set((state) => ({
      undoStack: [...state.undoStack, state.annotations],
      redoStack: [],
      annotations: [...state.annotations, newAnn]
    }));
  },

  removeAnnotation: (id) => {
    set((state) => ({
      undoStack: [...state.undoStack, state.annotations],
      redoStack: [],
      annotations: state.annotations.filter((a) => a.id !== id)
    }));
  },

  updateNoteText: (id, text) => {
    set((state) => ({
      annotations: state.annotations.map((a) =>
        a.id === id ? { ...a, noteText: text } : a
      )
    }));
  },

  toggleBookmark: (docId, pageNumber) => {
    set((state) => {
      const exists = state.bookmarks.some(
        (b) => b.docId === docId && b.pageNumber === pageNumber
      );
      if (exists) {
        return {
          bookmarks: state.bookmarks.filter(
            (b) => !(b.docId === docId && b.pageNumber === pageNumber)
          )
        };
      } else {
        return {
          bookmarks: [
            ...state.bookmarks,
            { docId, pageNumber, createdAt: new Date().toISOString() }
          ]
        };
      }
    });
  },

  undo: () => {
    const { undoStack, annotations } = get();
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    set((state) => ({
      annotations: previous,
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, annotations]
    }));
  },

  redo: () => {
    const { redoStack, annotations } = get();
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    set((state) => ({
      annotations: next,
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, annotations]
    }));
  }
}));
