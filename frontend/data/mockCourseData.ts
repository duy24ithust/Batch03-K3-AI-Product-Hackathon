import { LearningDay, CourseDocument, LessonSummary, QuizItem, PromptSuggestion } from '../types';

export const INITIAL_COURSE_DAYS: LearningDay[] = [
  {
    id: 'day-1',
    dayNumber: 1,
    title: 'Introduction to AI & LLMs',
    status: 'Completed',
    documents: [
      {
        id: 'doc-101',
        title: 'Introduction to Generative AI',
        filename: 'Introduction.pdf',
        pageCount: 24,
        fileSize: '3.2 MB',
        isFavorite: false,
        dayId: 'day-1',
        slides: [
          {
            pageNumber: 1,
            title: 'Welcome to Generative AI Systems',
            chapter: 'Chapter 1: Foundations',
            contentMarkdown: `# Welcome to Generative AI Systems\n\nModern Artificial Intelligence has transitioned from simple discriminative classifiers to generative systems capable of reasoning, planning, and tool execution.\n\n### Key Highlights\n- **Transformer Revolution**: Self-attention architecture enabling parallel token processing.\n- **Scaling Laws**: Exponential capabilities with compute, parameters, and data.\n- **From Completion to Agency**: How LLMs become interactive agents.`,
            keyPoints: [
              'Transformers replace recurrent architectures with self-attention.',
              'Generative AI models learn statistical representations of language and reasoning.',
              'Modern systems combine LLMs with external tools and memory.'
            ],
            visualType: 'concept'
          },
          {
            pageNumber: 2,
            title: 'Transformer Architecture & Self-Attention',
            chapter: 'Chapter 1: Foundations',
            contentMarkdown: `# Transformer Architecture\n\nThe core of every modern Large Language Model is the **Transformer block**.\n\n\`\`\`text
[ Input Tokens ] -> [ Embedding Layer ] -> [ Multi-Head Self-Attention ] -> [ Feed Forward ] -> [ Output Probabilities ]
\`\`\`\n\nSelf-attention allows the model to weigh the relevance of every token against every other token in the context window simultaneously.`,
            keyPoints: [
              'Multi-Head Self-Attention captures relationships across long sentences.',
              'Positional embeddings inject token order into parallel processing.',
              'Feed-Forward networks store declarative knowledge.'
            ],
            visualType: 'architecture'
          }
        ]
      },
      {
        id: 'doc-102',
        title: 'Practice Workshop: Prompt Basics',
        filename: 'Practice.pdf',
        pageCount: 16,
        fileSize: '1.8 MB',
        isFavorite: true,
        dayId: 'day-1',
        slides: [
          {
            pageNumber: 1,
            title: 'Zero-Shot vs Few-Shot Prompting',
            chapter: 'Chapter 2: Prompting',
            contentMarkdown: `# Zero-Shot vs Few-Shot Prompting\n\nProviding high-quality examples in the prompt significantly improves output accuracy and formatting consistency.`,
            keyPoints: [
              'Zero-shot relies purely on pre-trained instructions.',
              'Few-shot provides 2-5 concrete examples of input-output pairs.',
              'Always specify output constraints explicitly.'
            ],
            visualType: 'concept'
          }
        ]
      }
    ]
  },
  {
    id: 'day-2',
    dayNumber: 2,
    title: 'RAG & Vector Embeddings',
    status: 'Completed',
    documents: [
      {
        id: 'doc-201',
        title: 'Lecture: Retrieval-Augmented Generation',
        filename: 'Lecture.pdf',
        pageCount: 32,
        fileSize: '4.5 MB',
        isFavorite: true,
        dayId: 'day-2',
        slides: [
          {
            pageNumber: 1,
            title: 'Why Retrieval-Augmented Generation?',
            chapter: 'Chapter 1: RAG Overview',
            contentMarkdown: `# Why Retrieval-Augmented Generation (RAG)?\n\nLLMs suffer from hallucinations and knowledge cutoffs. RAG bridges this by retrieving real-time domain documents from a vector store before generating an answer.`,
            keyPoints: [
              'Reduces hallucination by grounding responses in retrieved citations.',
              'Allows updating domain knowledge without expensive fine-tuning.',
              'Supports enterprise access control and source tracking.'
            ],
            visualType: 'diagram'
          }
        ]
      },
      {
        id: 'doc-202',
        title: 'Assignment: Building a Vector Index',
        filename: 'Assignment.pdf',
        pageCount: 12,
        fileSize: '1.4 MB',
        isFavorite: false,
        dayId: 'day-2',
        slides: [
          {
            pageNumber: 1,
            title: 'Chunking & Embedding Strategies',
            chapter: 'Chapter 2: Vector Search',
            contentMarkdown: `# Chunking & Embedding Strategies\n\nHow you slice text determines retrieval quality. Choose semantic chunking over fixed-character splits whenever possible.`,
            keyPoints: [
              'Semantic chunking preserves sentence and paragraph boundaries.',
              'Embeddings map text chunks into high-dimensional vector space.',
              'Cosine similarity measures semantic closeness.'
            ],
            visualType: 'code'
          }
        ]
      }
    ]
  },
  {
    id: 'day-3',
    dayNumber: 3,
    title: 'Agentic AI & Tool Calling',
    status: 'In Progress',
    documents: [
      {
        id: 'doc-301',
        title: 'Agentic AI Systems & Architecture',
        filename: 'Agentic AI.pdf',
        pageCount: 46,
        fileSize: '6.8 MB',
        isFavorite: true,
        dayId: 'day-3',
        slides: [
          {
            pageNumber: 1,
            title: 'From Chatbots to Autonomous AI Agents',
            chapter: 'Chapter 1: The Agentic Paradigm',
            contentMarkdown: `# From Chatbots to Autonomous AI Agents\n\nTraditional chatbots respond reactively to individual prompts. **Agentic AI** systems autonomously reason, plan multi-step workflows, call external APIs, and reflect on their own outputs.\n\n### Core Differences\n- **Chatbot**: Static text input -> Single LLM completion -> Static text response.\n- **AI Agent**: Objective -> Reason & Plan -> Tool Execution -> Observation -> Loop -> Goal Completed.\n\n> "Agency is the ability of a system to pursue complex goals in dynamic environments by executing actions and adapting to feedback."`,
            keyPoints: [
              'Explains the evolution from chatbots to AI agents.',
              'Introduces Agentic AI architecture with feedback loops.',
              'Compares traditional chatbot workflows with autonomous agents.'
            ],
            visualType: 'comparison'
          },
          {
            pageNumber: 2,
            title: 'Agentic AI Architecture & Core Components',
            chapter: 'Chapter 1: The Agentic Paradigm',
            contentMarkdown: `# Agentic AI Architecture\n\nAn AI agent is built upon four foundational pillars that empower it to operate beyond a static language model:\n\n1. **LLM Core (Brain)**: Provides semantic reasoning, syntax understanding, and planning logic.\n2. **Memory System**:\n   - *Short-term Memory*: In-context conversation history and scratchpads.\n   - *Long-term Memory*: Vector database for persistent experience and user profiles.\n3. **Planning Engine**: Deconstructs complex tasks into sub-tasks (e.g., Tree-of-Thoughts, ReAct).\n4. **Tool Calling (Actuators)**: Executes external functions, APIs, database queries, and code interpreters.`,
            keyPoints: [
              'The four pillars: LLM Brain, Memory, Planning, and Tool Calling.',
              'Short-term vs long-term vector memory stores.',
              'Planning engines enable step-by-step reasoning before action.'
            ],
            visualType: 'architecture'
          },
          {
            pageNumber: 3,
            title: 'The ReAct Design Pattern (Reason + Act)',
            chapter: 'Chapter 2: Agent Workflows',
            contentMarkdown: `# The ReAct Design Pattern\n\n**ReAct** (Reasoning + Acting) is a fundamental paradigm where the agent alternates between generating reasoning traces and executing tool actions.\n\n\`\`\`text
[ User Request: "Find apartment & schedule visit" ]
       │
       ▼
┌──────────────────────────────────────────────┐
│ Thought: I need to search for 2-bed apartments.│
│ Action:  search_properties(bedrooms=2)       │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ Observation: Found 3 matching listings.      │
│ Thought: Now I should check availability...  │
└──────────────────────────────────────────────┘
\`\`\`\n\nThis pattern prevents hallucination by forcing the model to observe real-world API output before formulating its next conclusion.`,
            keyPoints: [
              'Discusses React (Reason + Act) design patterns.',
              'Alternates Thought, Action, and Observation cycles.',
              'Prevents hallucination by grounding conclusions in real tool outputs.'
            ],
            visualType: 'diagram'
          },
          {
            pageNumber: 4,
            title: 'Practical Implementation: Tool Calling Schema',
            chapter: 'Chapter 3: Tool Execution',
            contentMarkdown: `# Practical Implementation: Tool Calling Schema\n\nModern LLMs use JSON Schema tool declarations to know when and how to invoke external functions safely.\n\n\`\`\`json
{
  "name": "book_viewing_appointment",
  "description": "Books an apartment viewing appointment",
  "parameters": {
    "type": "object",
    "properties": {
      "property_id": { "type": "string" },
      "date_time": { "type": "string", "format": "date-time" }
    },
    "required": ["property_id", "date_time"]
  }
}
\`\`\`\n\nWhen the agent decides to invoke a tool, it outputs a structured JSON call which your backend executes before returning the result to the model.`,
            keyPoints: [
              'Demonstrates practical implementation concepts.',
              'JSON Schema defines parameter types and required fields.',
              'Backend executes safe function call and feeds observation back.'
            ],
            visualType: 'code'
          },
          {
            pageNumber: 5,
            title: 'Evaluating & Debugging Multi-Turn Agents',
            chapter: 'Chapter 4: Production Evaluation',
            contentMarkdown: `# Evaluating & Debugging Multi-Turn Agents\n\nEvaluating autonomous agents requires measuring more than just final answer similarity. You must assess:\n\n- **Trajectory Accuracy**: Did the agent call the correct tools in the logical order?\n- **Argument Precision**: Were tool arguments syntactically and factually valid?\n- **Loop Prevention**: Did the agent avoid redundant or infinite tool calls?\n- **Safety & Guardrails**: Did the agent refuse out-of-scope or destructive commands?`,
            keyPoints: [
              'Trajectory evaluation checks the sequence of tool invocations.',
              'Argument precision ensures correct parameter extraction.',
              'Guardrails prevent infinite loops and unsafe tool execution.'
            ],
            visualType: 'concept'
          }
        ]
      },
      {
        id: 'doc-302',
        title: 'Design Patterns for Multi-Agent Systems',
        filename: 'Design Pattern.pdf',
        pageCount: 28,
        fileSize: '4.1 MB',
        isFavorite: false,
        dayId: 'day-3',
        slides: [
          {
            pageNumber: 1,
            title: 'Orchestrator-Subagent Pattern',
            chapter: 'Chapter 1: Multi-Agent Workflows',
            contentMarkdown: `# Orchestrator-Subagent Pattern\n\nIn complex applications, a single LLM can become overloaded with instructions. The Orchestrator-Subagent pattern divides responsibilities across specialized worker agents.\n\n- **Lead Orchestrator**: Plans overarching strategy and delegates tasks.\n- **Researcher Agent**: Searches documentation and data sources.\n- **Coder Agent**: Writes and tests implementation scripts.\n- **Reviewer Agent**: Checks for security vulnerabilities and style compliance.`,
            keyPoints: [
              'Separation of concerns prevents prompt bloat and context degradation.',
              'Orchestrator manages state and synthesizes subagent reports.',
              'Specialized prompts improve accuracy per role.'
            ],
            visualType: 'architecture'
          }
        ]
      }
    ]
  },
  {
    id: 'day-4',
    dayNumber: 4,
    title: 'Production LLM Engineering',
    status: 'Active',
    documents: [
      {
        id: 'doc-401',
        title: 'Prompt Engineering & Evaluation Labs',
        filename: 'Prompt-Engineering-Labs.pdf',
        pageCount: 38,
        fileSize: '5.2 MB',
        isFavorite: false,
        dayId: 'day-4',
        slides: [
          {
            pageNumber: 1,
            title: 'System Prompts & Persona Guidelines',
            chapter: 'Chapter 1: System Prompts',
            contentMarkdown: `# System Prompts & Persona Guidelines\n\nA robust system prompt defines behavioral boundaries, tool instructions, and tone of voice. Use XML tags for structured prompt hierarchy.`,
            keyPoints: [
              'XML tags delineate clear instructions and context blocks.',
              'Specify fallback rules when tools fail.',
              'Always enforce safety guidelines.'
            ],
            visualType: 'concept'
          }
        ]
      }
    ]
  },
  {
    id: 'day-5',
    dayNumber: 5,
    title: 'Hackathon & Final Project',
    status: 'Active',
    documents: [
      {
        id: 'doc-501',
        title: 'Hackathon Guidelines & Rubric',
        filename: 'Hackathon-Rubric.pdf',
        pageCount: 14,
        fileSize: '2.1 MB',
        isFavorite: true,
        dayId: 'day-5',
        slides: [
          {
            pageNumber: 1,
            title: 'AI Product Hackathon Rubric (100 Points)',
            chapter: 'Chapter 1: Hackathon Overview',
            contentMarkdown: `# AI Product Hackathon Rubric\n\n- **R1: Evidence & Impact** (15 pts)\n- **R2: Solution Design & Slice** (15 pts)\n- **R3: Risk & Edge Cases** (11 pts)\n- **R4: Verification & Eval** (15 pts)\n- **R5: Prototype Execution** (8 pts)\n- **R6: User Validation** (8 pts)\n- **R7: Repo & Team Reflection** (3 pts)\n- **Checkpoints (CP1-CP5)**: 25 pts total`,
            keyPoints: [
              'Total 100 points: 25 checkpoint points + 75 graded artifact points.',
              'Focus on real pain evidence and functional AI calls.',
              'Ensure safety and ethical data use.'
            ],
            visualType: 'comparison'
          }
        ]
      }
    ]
  }
];

export const PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  { id: 'p1', label: 'Explain this slide', prompt: 'Explain the main concepts of this current slide in simple, intuitive terms.' },
  { id: 'p2', label: 'Simplify this topic', prompt: 'Can you simplify this topic for a beginner using an everyday analogy?' },
  { id: 'p3', label: 'Translate paragraph', prompt: 'Translate the selected paragraph into Vietnamese and highlight technical terms.' },
  { id: 'p4', label: 'Give real-world examples', prompt: 'Give 2 real-world enterprise software examples that use this architecture.' },
  { id: 'p5', label: 'Compare with previous chapter', prompt: 'How does this concept compare with the previous chapter we studied?' },
  { id: 'p6', label: 'Generate flashcards', prompt: 'Create 3 Q&A flashcards from this slide to help me memorize key points.' }
];

export const MOCK_LESSON_SUMMARIES: Record<'slide' | 'chapter' | 'lesson', LessonSummary> = {
  slide: {
    scope: 'slide',
    quickSummary: [
      'Explains the evolution from chatbots to AI agents.',
      'Introduces Agentic AI architecture with autonomous reasoning.',
      'Compares traditional chatbot workflows with autonomous agents.',
      'Discusses the ReAct (Reason + Act) design pattern.',
      'Demonstrates practical implementation concepts and JSON schema tool calling.'
    ],
    keyConcepts: [
      {
        title: 'Transformer',
        description: 'Self-attention architecture enabling parallel token processing and contextual understanding.',
        category: 'Architecture'
      },
      {
        title: 'Large Language Models',
        description: 'Deep neural networks trained on vast text data to generate human-like reasoning and responses.',
        category: 'Model'
      },
      {
        title: 'Retrieval-Augmented Gen.',
        description: 'Technique that retrieves real-time domain knowledge from vector databases before generating output.',
        category: 'Workflow'
      },
      {
        title: 'AI Agent',
        description: 'An autonomous AI system capable of planning, reasoning, executing tools, and observing feedback.',
        category: 'Core'
      },
      {
        title: 'Tool Calling',
        description: 'Structured JSON invocation allowing LLMs to interact with APIs, databases, and external code.',
        category: 'Pattern'
      }
    ],
    learningObjectives: [
      'Understand chatbot architecture and its limitations',
      'Explain Agentic AI architecture and the four core pillars',
      'Compare static chatbot workflows vs autonomous AI agents',
      'Understand ReAct (Reason + Act) implementation pattern',
      'Learn tool-calling workflow and JSON Schema declarations'
    ],
    importantTerms: [
      'LLM',
      'Prompt',
      'Embedding',
      'Memory',
      'Workflow',
      'RAG',
      'Agent',
      'Context Window'
    ],
    keyTakeaways: 'What you should remember after completing this lesson: AI Agents differ from standard chatbots by incorporating autonomous planning, short/long-term memory, and external tool calling to accomplish multi-step objectives without constant human intervention.',
    readingInfo: {
      estimatedTimeMinutes: 5,
      difficulty: 'Medium',
      wordCount: 1250,
      totalPages: 46
    }
  },
  chapter: {
    scope: 'chapter',
    quickSummary: [
      'Covers the shift from single-prompt completions to autonomous agent loops.',
      'Details the 4 pillars of Agentic AI: LLM Core, Memory, Planning, and Tool Calling.',
      'Explains how vector store memory allows persistent state across multi-turn interactions.',
      'Highlights Tree-of-Thoughts and ReAct as foundational reasoning techniques.'
    ],
    keyConcepts: [
      {
        title: 'ReAct Loop',
        description: 'Iterative cycle of Thought -> Action -> Observation that prevents hallucination.',
        category: 'Workflow'
      },
      {
        title: 'Vector Memory',
        description: 'Long-term embedding storage for recalling historical context and domain documents.',
        category: 'Architecture'
      },
      {
        title: 'Tool Schema',
        description: 'JSON Schema declaration defining required parameters and types for API invocation.',
        category: 'Pattern'
      }
    ],
    learningObjectives: [
      'Identify when an application requires an agent versus a simple RAG pipeline',
      'Design a ReAct loop with proper observation feedback',
      'Specify safe JSON schemas for external tool invocation'
    ],
    importantTerms: [
      'ReAct',
      'Observation',
      'Trajectory',
      'Tool Calling',
      'Agentic Loop',
      'Short-term Memory'
    ],
    keyTakeaways: 'Chapter Summary: The Agentic Paradigm replaces static prompt response with dynamic reasoning loops, allowing systems to verify real-world facts via tools before concluding.',
    readingInfo: {
      estimatedTimeMinutes: 12,
      difficulty: 'Medium',
      wordCount: 3400,
      totalPages: 15
    }
  },
  lesson: {
    scope: 'lesson',
    quickSummary: [
      'Comprehensive guide to building production Agentic AI systems.',
      'Traces evolution from Transformer self-attention to multi-agent orchestrators.',
      'Provides practical TypeScript & Python code patterns for tool calling.',
      'Establishes evaluation metrics for agent trajectory accuracy and loop prevention.'
    ],
    keyConcepts: [
      {
        title: 'Agentic AI',
        description: 'Systems capable of autonomous goal pursuit through reasoning and tool actuation.',
        category: 'Core'
      },
      {
        title: 'Orchestrator Pattern',
        description: 'Multi-agent architecture where a lead coordinator delegates tasks to specialized subagents.',
        category: 'Architecture'
      },
      {
        title: 'Trajectory Eval',
        description: 'Measuring whether an agent called the correct sequence of tools to complete an objective.',
        category: 'Workflow'
      },
      {
        title: 'Retrieval-Augmented Gen.',
        description: 'Grounding generative answers in real-time document chunks retrieved from a vector database.',
        category: 'Pattern'
      },
      {
        title: 'Tool Calling',
        description: 'JSON Schema declarations enabling LLMs to safely trigger backend functions.',
        category: 'Core'
      }
    ],
    learningObjectives: [
      'Master the full stack of Agentic AI from Prompt Engineering to Tool Calling',
      'Implement multi-agent Orchestrator-Subagent design patterns',
      'Evaluate agent trajectory, argument precision, and safety guardrails',
      'Deploy responsive AI learning assistants with context awareness'
    ],
    importantTerms: [
      'LLM',
      'Prompt',
      'Embedding',
      'Memory',
      'Workflow',
      'RAG',
      'Agent',
      'Context Window',
      'Orchestrator',
      'Trajectory'
    ],
    keyTakeaways: 'Full Lesson Mastery: Modern AI engineering combines high-performance LLMs with structured tool calling, vector retrieval, and multi-agent patterns to build reliable, autonomous enterprise applications.',
    readingInfo: {
      estimatedTimeMinutes: 25,
      difficulty: 'Advanced',
      wordCount: 8900,
      totalPages: 46
    }
  }
};

export const MOCK_QUIZZES: QuizItem[] = [
  {
    id: 'q1',
    type: 'multiple_choice',
    question: 'What is the primary difference between a chatbot and an AI agent?',
    options: [
      'A. Chatbots have memory.',
      'B. AI agents can autonomously plan and execute tasks.',
      'C. Chatbots use React.',
      'D. AI agents cannot call APIs.'
    ],
    correctAnswer: 'B. AI agents can autonomously plan and execute tasks.',
    explanation: 'AI agents can reason, plan, and execute multiple actions using tools, whereas traditional chatbots simply generate a single text completion per user prompt.',
    slideRef: 1
  },
  {
    id: 'q2',
    type: 'true_false',
    question: 'Traditional chatbots can autonomously perform multi-step planning.',
    correctAnswer: 'False',
    explanation: 'Traditional chatbots primarily respond to prompts without autonomous planning or multi-step tool execution.',
    slideRef: 1
  },
  {
    id: 'q3',
    type: 'fill_in_blank',
    question: 'Retrieval-Augmented Generation is commonly abbreviated as ______.',
    correctAnswer: 'RAG',
    explanation: 'RAG stands for Retrieval-Augmented Generation, which grounds LLM output in real-time retrieved documents.',
    slideRef: 2
  },
  {
    id: 'q4',
    type: 'multiple_choice',
    question: 'In the ReAct design pattern, what does the agent do immediately after executing an Action?',
    options: [
      'A. It shuts down immediately.',
      'B. It receives an Observation from the tool or environment.',
      'C. It ignores the result and guesses the answer.',
      'D. It clears its conversation memory.'
    ],
    correctAnswer: 'B. It receives an Observation from the tool or environment.',
    explanation: 'The ReAct cycle alternates between Thought, Action, and Observation so the model can ground its next thought in real-world tool output.',
    slideRef: 3
  },
  {
    id: 'q5',
    type: 'multiple_choice',
    question: 'What format is standard for declaring functions in LLM Tool Calling?',
    options: [
      'A. CSV spreadsheets',
      'B. JSON Schema',
      'C. Plain unstructured text',
      'D. Binary bytecode'
    ],
    correctAnswer: 'B. JSON Schema',
    explanation: 'JSON Schema provides an unambiguous, machine-readable specification of function names, parameter types, and required fields.',
    slideRef: 4
  }
];
