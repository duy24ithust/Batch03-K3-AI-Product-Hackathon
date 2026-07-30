import { LessonSummary, QuizItem, SummaryScope } from '../types';
import { MOCK_LESSON_SUMMARIES, MOCK_QUIZZES } from '../data/mockCourseData';

export interface AskTutorParams {
  prompt: string;
  docTitle: string;
  pageNumber: number;
  chapter: string;
  selectedText?: string;
  apiKey?: string;
}

export const aiService = {
  async askTutor({
    prompt,
    docTitle,
    pageNumber,
    chapter,
    selectedText,
    apiKey
  }: AskTutorParams): Promise<{ text: string; citation?: { pageNumber: number; title: string } }> {
    // Check if user provided an API Key (for future live LLM integration)
    const activeApiKey = apiKey || (typeof window !== 'undefined' ? localStorage.getItem('vlearn_api_key') : '');
    
    if (activeApiKey && activeApiKey.startsWith('sk-')) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeApiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are an AI Tutor for the VLearn AI Learning Platform. You are assisting a student reading "${docTitle}", Chapter "${chapter}", on slide/page ${pageNumber}. ${
                  selectedText ? `The student highlighted this text on the slide: "${selectedText}".` : ''
                } Provide a concise, clear, and helpful answer in Markdown.`
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7
          })
        });

        if (response.ok) {
          const data = await response.json();
          return {
            text: data.choices[0].message.content,
            citation: { pageNumber, title: docTitle }
          };
        }
      } catch (error) {
        console.warn('API call failed, falling back to simulation engine:', error);
      }
    }

    // Intelligent simulation engine (works out-of-the-box)
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulating natural streaming delay

    const pLower = prompt.toLowerCase();
    if (pLower.includes('explain') || pLower.includes('what is') || pLower.includes('slide')) {
      return {
        text: `### Explanation for Slide ${pageNumber}: **${docTitle}**\n\nIn this section of **${chapter}**, the main focus is understanding how **Agentic AI** operates beyond simple language completions:\n\n1. **Autonomy**: Unlike static chatbots, agents initiate tool calls to fetch data or execute tasks.\n2. **Reasoning Loop**: The agent evaluates observations before selecting the next action.\n3. **Practical Context**: ${
          selectedText ? `You highlighted: *"${selectedText}"*. This concept is essential for building production pipelines that require verifiable accuracy.` : `This slide bridges theoretical LLM concepts with real-world software engineering.`
        }\n\n*Tip: Try asking for a real-world code example or test your understanding in the Quiz tab!*`,
        citation: { pageNumber, title: docTitle }
      };
    }

    if (pLower.includes('simplify') || pLower.includes('analogy') || pLower.includes('easy')) {
      return {
        text: `### Simplified Analogy 💡\n\nThink of a **traditional chatbot** as an encyclopedic chef who can only recite recipes from memory. If you ask if they have eggs in the fridge, they can only guess.\n\nAn **AI Agent**, on the other hand, is a chef with hands and a kitchen: they open the fridge (**Tool Calling**), check the egg carton (**Observation**), and if it's empty, order eggs from the grocery app (**Action**).\n\nThat is why Agentic AI is so transformative for software automation!`,
        citation: { pageNumber, title: docTitle }
      };
    }

    if (pLower.includes('translate') || pLower.includes('vietnamese') || pLower.includes('dịch')) {
      return {
        text: `### Bản Dịch & Giải Thích Thuật Ngữ 🇻🇳\n\n${
          selectedText
            ? `> *" ${selectedText} "*\n\n**Dịch nghĩa:** *"Hệ thống AI Tác vụ (Agentic AI) có thể tự chủ suy luận, lập kế hoạch thực hiện các quy trình nhiều bước, gọi API bên ngoài và tự kiểm chứng kết quả."*`
            : `**Tóm tắt nội dung trang ${pageNumber}:**\nSự tiến hoá từ Chatbot truyền thống sang AI Agent (Trợ lý AI Tự chủ). Khác biệt cốt lõi nằm ở khả năng lập kế hoạch (**Planning**), bộ nhớ (**Memory**) và gọi công cụ (**Tool Calling**).`
        }\n\n**Thuật ngữ quan trọng:**\n- **Agentic AI**: AI có tính tự chủ và khả năng thực thi tác vụ.\n- **Reasoning Trace**: Chuỗi suy luận từng bước.`,
        citation: { pageNumber, title: docTitle }
      };
    }

    if (pLower.includes('example') || pLower.includes('real-world')) {
      return {
        text: `### Real-World Enterprise Examples 🚀\n\n1. **Customer Support Resolution Agent**: Instead of telling a user "how to reset a password", an Agentic AI checks the billing DB via API, verifies identity, and sends a secure reset token directly.\n2. **Data Science Analyst Agent**: Takes a natural language query, generates Python SQL scripts, runs them in a sandboxed interpreter, and generates a visual chart for the dashboard.`,
        citation: { pageNumber, title: docTitle }
      };
    }

    return {
      text: `### AI Tutor Response 💬\n\nI analyzed your question regarding **${docTitle}** (Page ${pageNumber}).\n\nHere is what you need to know:\n- **Core Concept**: Modern LLM systems rely on structured tool calling and vector retrieval (RAG) to ensure accuracy and prevent hallucination.\n- **Your Context**: You are currently studying **${chapter}**. ${
        selectedText ? `Regarding your highlighted note (*"${selectedText}"*), remember that proper schema declaration is critical for reliable tool execution.` : ''
      }\n\nWould you like me to generate a 3-question quiz on this topic to test your mastery?`,
      citation: { pageNumber, title: docTitle }
    };
  },

  async getLessonSummary(scope: SummaryScope): Promise<LessonSummary> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return MOCK_LESSON_SUMMARIES[scope] || MOCK_LESSON_SUMMARIES.lesson;
  },

  async getQuizzes(scope: SummaryScope): Promise<QuizItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    if (scope === 'slide') {
      return MOCK_QUIZZES.slice(0, 3);
    }
    return MOCK_QUIZZES;
  }
};
