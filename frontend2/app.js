/**
 * =========================================================
 * AI PDF Learning Assistant - Main Application Script
 * Frontend Only (HTML5 + CSS3 + Vanilla JS)
 * =========================================================
 */

// ---------------------------------------------------------
// 1. Mock Chat Service (Ready for Future Backend Integration)
// ---------------------------------------------------------
async function sendMessage(message) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        message: "This is a mock AI response. Backend will be integrated later."
      });
    }, 800);
  });
}

// ---------------------------------------------------------
// 2. Application State
// ---------------------------------------------------------
const state = {
  pdfFile: null,
  pdfDoc: null,
  pageNumber: 1,
  numPages: 0,
  zoom: 1.0,
  isRendering: false,
  isChatLoading: false,
  lessonId: 'b1'
};

// ---------------------------------------------------------
// 3. Configure PDF.js Worker
// ---------------------------------------------------------
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// ---------------------------------------------------------
// 4. DOM Elements Reference
// ---------------------------------------------------------
const elements = {
  fileInput: document.getElementById('pdf-file-input'),
  uploadBtn: document.getElementById('upload-btn'),
  emptyUploadBtn: document.getElementById('empty-upload-btn'),
  fileNameDisplay: document.getElementById('file-name-display'),
  lessonSelect: document.getElementById('lesson-select'),
  apiStatusDot: document.getElementById('api-status-dot'),
  apiStatusText: document.getElementById('api-status-text'),

  emptyState: document.getElementById('empty-state'),
  loadingSpinner: document.getElementById('loading-spinner'),
  canvasContainer: document.getElementById('canvas-container'),
  pdfCanvas: document.getElementById('pdf-canvas'),
  viewerContent: document.getElementById('viewer-content'),

  prevBtn: document.getElementById('prev-page'),
  nextBtn: document.getElementById('next-page'),
  pageIndicator: document.getElementById('page-indicator'),
  zoomOutBtn: document.getElementById('zoom-out'),
  zoomInBtn: document.getElementById('zoom-in'),
  zoomIndicator: document.getElementById('zoom-indicator'),

  chatMessages: document.getElementById('chat-messages'),
  chatInput: document.getElementById('chat-input'),
  sendBtn: document.getElementById('send-btn'),
  toastContainer: document.getElementById('toast-container')
};

// ---------------------------------------------------------
// 5. Toast Notification System
// ---------------------------------------------------------
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    // Toast ở top center → trượt LÊN khi ẩn, cùng hướng với lúc xuất hiện
    toast.style.transform = 'translateY(-12px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 4000);
}

// ---------------------------------------------------------
// 6. PDF Loading & Rendering
// ---------------------------------------------------------
function setUiLoading(loading, text = 'Rendering PDF...') {
  if (loading) {
    elements.emptyState.style.display = 'none';
    elements.canvasContainer.style.display = 'none';
    elements.loadingSpinner.style.display = 'flex';
    const textSpan = elements.loadingSpinner.querySelector('.loading-text');
    if (textSpan) textSpan.textContent = text;
  } else {
    elements.loadingSpinner.style.display = 'none';
  }
}

function updateToolbarState() {
  const hasDoc = !!state.pdfDoc;

  elements.prevBtn.disabled = !hasDoc || state.pageNumber <= 1;
  elements.nextBtn.disabled = !hasDoc || state.pageNumber >= state.numPages;
  elements.zoomOutBtn.disabled = !hasDoc || state.zoom <= 0.5;
  elements.zoomInBtn.disabled = !hasDoc || state.zoom >= 3.0;

  if (hasDoc) {
    elements.pageIndicator.textContent = `Trang ${state.pageNumber} / ${state.numPages}`;
    elements.zoomIndicator.textContent = `${Math.round(state.zoom * 100)}%`;
  } else {
    elements.pageIndicator.textContent = 'Trang 0 / 0';
    elements.zoomIndicator.textContent = '100%';
  }
}

let slideObserver = null;

async function renderAllSlides() {
  if (!state.pdfDoc || state.isRendering) return;
  state.isRendering = true;

  try {
    const container = elements.canvasContainer;
    container.innerHTML = ''; // Clear previous slides
    container.style.display = 'flex';
    elements.emptyState.style.display = 'none';
    elements.loadingSpinner.style.display = 'none';
    elements.viewerContent.scrollTop = 0; // Ensure scroll is at the very top (Slide 1)

    // Disconnect old observer if existing
    if (slideObserver) {
      slideObserver.disconnect();
    }

    // Setup IntersectionObserver for auto page tracking as user scrolls up/down
    slideObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const pageNum = parseInt(entry.target.getAttribute('data-page'), 10);
          if (pageNum && pageNum !== state.pageNumber) {
            state.pageNumber = pageNum;
            updateToolbarState();
          }
        }
      });
    }, {
      root: elements.viewerContent,
      threshold: 0.4 // trigger when at least 40% of a slide is visible
    });

    // Render all PDF pages as stacked slide cards inside the scrolling container
    for (let num = 1; num <= state.numPages; num++) {
      const page = await state.pdfDoc.getPage(num);
      const viewport = page.getViewport({ scale: 2.0 }); // High-resolution HiDPI scale for sharp text at any zoom

      const slideCard = document.createElement('div');
      slideCard.className = 'slide-card';
      slideCard.id = `slide-page-${num}`;
      slideCard.setAttribute('data-page', num);

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const footer = document.createElement('div');
      footer.className = 'slide-footer';
      footer.textContent = `Trang ${num} / ${state.numPages}`;

      slideCard.appendChild(canvas);
      slideCard.appendChild(footer);
      container.appendChild(slideCard);

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      slideObserver.observe(slideCard);
    }
  } catch (error) {
    console.error('Error rendering PDF slides:', error);
    showToast('Error rendering PDF slides', 'error');
  } finally {
    state.isRendering = false;
    updateToolbarState();
  }
}

function scrollToSlide(num) {
  if (!state.pdfDoc) return;
  const targetNum = Math.max(1, Math.min(state.numPages, num));
  const card = document.getElementById(`slide-page-${targetNum}`);
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    state.pageNumber = targetNum;
    updateToolbarState();
  }
}

/**
 * Nạp slide của một bài giảng từ slide/{lessonId}.pdf.
 *
 * lessonId trùng mã bài backend dùng (b1..b5), nên trang trên UI và trang agent
 * đang đọc luôn là cùng một trang — citation "[Trang 60]" nhảy đúng chỗ.
 */
async function loadLessonPdf(lessonId) {
  if (typeof pdfjsLib === 'undefined') {
    showToast('pdf.js chưa nạp được, kiểm tra kết nối mạng', 'error');
    return;
  }

  state.lessonId = lessonId;
  currentSessionId = generateSessionId(); // Reset chat history per lesson
  if (elements.lessonSelect) elements.lessonSelect.value = lessonId;

  const label = elements.lessonSelect
    ? elements.lessonSelect.options[elements.lessonSelect.selectedIndex].text
    : lessonId;

  elements.fileNameDisplay.textContent = `${lessonId}.pdf`;
  elements.fileNameDisplay.style.display = 'inline-block';
  setUiLoading(true, `Đang nạp ${label}…`);

  const url = `slide/${lessonId}.pdf`;
  try {
    // Truyền dạng object (không phải string) cho nhất quán với nhánh upload,
    // và fetch trước để phân biệt lỗi mạng/404 với lỗi parse PDF.
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} khi tải ${url}`);

    const buf = await res.arrayBuffer();
    state.pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
    state.numPages = state.pdfDoc.numPages;
    state.pageNumber = 1;
    state.pdfFile = null;

    await renderAllSlides();
    showToast(`${label} — ${state.numPages} trang`, 'success');
  } catch (err) {
    console.error(`Không nạp được ${url}:`, err);
    setUiLoading(false);
    elements.emptyState.style.display = 'block';

    // file:// chặn fetch vì CORS — đây là nguyên nhân phổ biến nhất, nên nói rõ
    const hint =
      window.location.protocol === 'file:'
        ? 'Đang mở bằng file:// nên trình duyệt chặn đọc PDF. Chạy: cd frontend2 && python3 -m http.server 3000 rồi mở http://localhost:3000'
        : err.message || 'Lỗi không rõ';
    showToast(`Không nạp được ${url}. ${hint}`, 'error');
  }
}

function loadPdfFile(file) {
  if (!file || file.type !== 'application/pdf') {
    showToast('Please upload a valid .pdf file', 'error');
    return;
  }

  state.pdfFile = file;
  elements.fileNameDisplay.textContent = file.name;
  elements.fileNameDisplay.style.display = 'inline-block';

  const nameLower = file.name.toLowerCase();
  for (let i = 1; i <= 5; i++) {
    if (nameLower.includes(`b${i}`)) {
      state.lessonId = `b${i}`;
      if (elements.lessonSelect) elements.lessonSelect.value = state.lessonId;
      break;
    }
  }

  setUiLoading(true, `Loading "${file.name}"...`);

  const reader = new FileReader();
  reader.onload = async function (e) {
    const typedarray = new Uint8Array(e.target.result);

    try {
      const loadingTask = pdfjsLib.getDocument({ data: typedarray });
      state.pdfDoc = await loadingTask.promise;
      state.numPages = state.pdfDoc.numPages;
      state.pageNumber = 1;

      await renderAllSlides();
      showToast('PDF uploaded successfully!', 'success');
    } catch (err) {
      console.error('Failed to load PDF:', err);
      setUiLoading(false);
      elements.emptyState.style.display = 'block';
      showToast('Could not parse PDF document.', 'error');
    }
  };

  reader.readAsArrayBuffer(file);
}

// ---------------------------------------------------------
// 7. Event Listeners - Upload & Drag/Drop
// ---------------------------------------------------------
// Nút tải lên ở header đã bỏ (slide tự nạp theo bài), nên các listener này là
// tuỳ chọn — dùng `?.` để app không chết nếu phần tử không tồn tại.
elements.uploadBtn?.addEventListener('click', () => {
  elements.fileInput.click();
});

elements.emptyUploadBtn?.addEventListener('click', () => {
  elements.fileInput.click();
});

elements.fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    loadPdfFile(file);
  }
});

if (elements.lessonSelect) {
  // Đổi bài → nạp luôn slide của bài đó, để nội dung trên màn hình và nội dung
  // agent đang đọc không bao giờ lệch nhau
  elements.lessonSelect.addEventListener('change', (e) => {
    loadLessonPdf(e.target.value);
  });
}

// Drag & Drop
['dragenter', 'dragover'].forEach((eventName) => {
  elements.viewerContent.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    elements.emptyState.classList.add('drag-over');
  });
});

['dragleave', 'drop'].forEach((eventName) => {
  elements.viewerContent.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    elements.emptyState.classList.remove('drag-over');
  });
});

elements.viewerContent.addEventListener('drop', (e) => {
  const dt = e.dataTransfer;
  const files = dt.files;
  if (files && files.length > 0) {
    loadPdfFile(files[0]);
  }
});

// ---------------------------------------------------------
// 8. Event Listeners - PDF Toolbar Controls & Smooth Jump
// ---------------------------------------------------------
elements.prevBtn.addEventListener('click', () => {
  if (state.pageNumber <= 1) return;
  scrollToSlide(state.pageNumber - 1);
});

elements.nextBtn.addEventListener('click', () => {
  if (state.pageNumber >= state.numPages) return;
  scrollToSlide(state.pageNumber + 1);
});

function applyZoom() {
  if (elements.canvasContainer) {
    elements.canvasContainer.style.setProperty('--zoom-level', state.zoom);
  }
  elements.zoomIndicator.textContent = `${Math.round(state.zoom * 100)}%`;
  updateToolbarState();
}

elements.zoomOutBtn.addEventListener('click', () => {
  if (state.zoom <= 0.5) return;
  state.zoom = Math.max(0.5, state.zoom - 0.25);
  applyZoom();
});

elements.zoomInBtn.addEventListener('click', () => {
  if (state.zoom >= 3.0) return;
  state.zoom = Math.min(3.0, state.zoom + 0.25);
  applyZoom();
});

elements.zoomIndicator.addEventListener('click', () => {
  if (state.zoom !== 1.0 && state.pdfDoc) {
    state.zoom = 1.0;
    applyZoom();
  }
});

// ---------------------------------------------------------
// 8.1. Continuous Vertical Slide Scrolling & Keyboard Navigation
// ---------------------------------------------------------
// Note: Normal mouse wheel, trackpad scrolling, and touch swiping work natively
// on the vertical scrolling container without flashing or stuttering!

window.addEventListener('keydown', (e) => {
  if (!state.pdfDoc || state.isRendering) return;
  if (document.activeElement === elements.chatInput) return; // don't intercept typing in chat

  if ((e.key === 'ArrowDown' || e.key === 'PageDown') && state.pageNumber < state.numPages) {
    e.preventDefault();
    scrollToSlide(state.pageNumber + 1);
  } else if ((e.key === 'ArrowUp' || e.key === 'PageUp') && state.pageNumber > 1) {
    e.preventDefault();
    scrollToSlide(state.pageNumber - 1);
  }
});

// ---------------------------------------------------------
// ---------------------------------------------------------
// 9. AI Chat Functionality & Real SSE Streaming Backend Integration
// ---------------------------------------------------------
// Cấu hình qua window.BACKEND_URL (đặt trong <script> trước app.js) hoặc mặc định localhost:8000
function generateSessionId() {
  return 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
}
let currentSessionId = generateSessionId();

const BACKEND_URL = window.BACKEND_URL || 'http://localhost:8000';
const DEFAULT_LESSON_ID = 'b1';
const DEFAULT_SLIDE_ID = 'slide-abc123';

function scrollToBottom() {
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function formatMarkdown(text) {
  if (!text) return '';
  const html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.*$)/gim, '<strong>$1</strong><br>')
    .replace(/^## (.*$)/gim, '<strong>$1</strong><br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // [Trang N] trong câu trả lời → chip bấm được để nhảy tới đúng trang đó.
    // Backend đã lọc bỏ trang model bịa, nên số trang ở đây luôn tồn tại thật.
    .replace(
      /\[Trang (\d+)\]/g,
      (_m, p) =>
        `<button type="button" class="page-ref" data-page="${p}" ` +
        `title="Xem trang ${p}">Trang ${p}</button>`
    )
    // Danh sách thật thay vì ký tự '•' — trình đọc màn hình hiểu đúng cấu trúc
    .replace(/^[-*] (.*$)/gim, '<li>$1</li>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');

  // Gom các <li> liền nhau vào một <ul>, dọn <br> dư quanh chúng
  return html
    .replace(/(?:<br>\s*)*(<li>[\s\S]*?<\/li>)(?:\s*<br>)*/g, (m) => {
      const items = m.match(/<li>[\s\S]*?<\/li>/g) || [];
      return `<ul>${items.join('')}</ul>`;
    })
    .replace(/<\/ul>\s*<ul>/g, '');
}

// Chip [Trang N] được sinh liên tục trong lúc stream, nên bắt click ở container
// thay vì gắn listener cho từng chip.
elements.chatMessages.addEventListener('click', (e) => {
  const chip = e.target.closest('.page-ref');
  if (!chip) return;
  const page = parseInt(chip.getAttribute('data-page'), 10);
  if (!page) return;

  if (state.pdfDoc && page >= 1 && page <= state.numPages) {
    scrollToSlide(page);
  } else {
    showToast(`Trang ${page} không có trong bài đang mở`, 'error');
  }
});

function createChatBubble(sender, text = '') {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;

  const header = document.createElement('div');
  header.className = 'bubble-header';
  header.textContent = sender === 'user' ? 'Bạn' : 'Trợ lý AI';

  const content = document.createElement('div');
  content.className = 'bubble-content';
  if (sender === 'assistant' && text) {
    content.innerHTML = formatMarkdown(text);
  } else {
    content.textContent = text;
  }

  bubble.appendChild(header);
  bubble.appendChild(content);
  return { bubble, content };
}

function createTypingIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'chat-bubble assistant typing-indicator';
  indicator.id = 'typing-indicator';
  indicator.innerHTML = `
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
  `;
  return indicator;
}

function appendCitationBadge(bubbleElem, citation) {
  let badgeContainer = bubbleElem.querySelector('.citation-container');
  if (!badgeContainer) {
    badgeContainer = document.createElement('div');
    badgeContainer.className = 'citation-container';
    bubbleElem.appendChild(badgeContainer);
  }

  // Tránh badge trùng khi agent trích cùng một trang nhiều lần
  if (badgeContainer.querySelector(`[data-page="${citation.page}"]`)) return;

  const badge = document.createElement('button');
  badge.className = 'citation-badge';
  badge.type = 'button';
  badge.setAttribute('data-page', citation.page);
  // Không còn confidence score: backend đã lọc bỏ trang model bịa ra, nên mọi
  // trang tới đây đều tồn tại thật — không có gì để "ước lượng độ tin".
  badge.textContent = `Trang ${citation.page}`;
  if (citation.title) badge.title = citation.title;

  badge.addEventListener('click', () => {
    if (citation.page && citation.page >= 1 && citation.page <= state.numPages) {
      scrollToSlide(citation.page);
      showToast(`Đã nhảy tới trang ${citation.page}`, 'success');
    } else {
      showToast(`Trích dẫn trỏ tới trang ${citation.page}`, 'success');
    }
  });

  badgeContainer.appendChild(badge);
}

const TOOL_LABELS = {
  search_web: 'Đang tra thêm ngoài bài giảng…',
  create_check_question: 'Đang soạn câu hỏi kiểm tra hiểu…'
};

/** Badge tạm khi agent gọi tool. Phần lớn turn không có — bài giảng đã trong
 *  context nên agent trả lời trực tiếp, không phải đi tìm. */
function showToolBadge(bubbleElem, toolName) {
  removeToolBadge(bubbleElem);
  const badge = document.createElement('div');
  badge.className = 'tool-badge';
  badge.textContent = TOOL_LABELS[toolName] || `Đang chạy ${toolName}…`;
  bubbleElem.appendChild(badge);
}

function removeToolBadge(bubbleElem) {
  const badge = bubbleElem.querySelector('.tool-badge');
  if (badge) badge.remove();
}

/** Số đo của turn: llm_calls = 1 nghĩa là agent trả lời thẳng từ bài giảng. */
function appendTurnStats(bubbleElem, stats) {
  if (!stats) return;
  const line = document.createElement('div');
  line.className = 'turn-stats';
  const tools =
    stats.tools_used && stats.tools_used.length
      ? stats.tools_used.join(', ')
      : 'không dùng tool';
  line.textContent =
    `Chữ đầu ${stats.ttft_ms}ms · tổng ${stats.total_ms}ms · ` +
    `${stats.llm_calls} lượt gọi mô hình · ${tools}`;
  bubbleElem.appendChild(line);
}

function appendSuggestedQuestions(bubbleElem, questions) {
  if (!questions || questions.length === 0) return;

  let suggestionsContainer = bubbleElem.querySelector('.suggestions-container');
  if (!suggestionsContainer) {
    suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'suggestions-container';
    const label = document.createElement('div');
    label.className = 'suggestions-label';
    label.textContent = 'Đào sâu thêm';
    suggestionsContainer.appendChild(label);
    bubbleElem.appendChild(suggestionsContainer);
  }

  questions.forEach((qText) => {
    const pill = document.createElement('button');
    pill.className = 'suggestion-pill';
    pill.type = 'button';
    pill.textContent = qText;
    pill.addEventListener('click', () => {
      elements.chatInput.value = qText;
      handleSendMessage();
    });
    suggestionsContainer.appendChild(pill);
  });
  scrollToBottom();
}

/**
 * SSE Streaming chat service with fallback to mock simulation if server is offline
 */
async function sendChatMessageSSE(messageText, handlers) {
  const { onToken, onCitation, onSuggestions, onToolUse, onDone } = handlers;

  let response;
  try {
    response = await fetch(`${BACKEND_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: currentSessionId,
        message: messageText,
        lesson_id: state.lessonId || DEFAULT_LESSON_ID,
        slide_id: 'slide-' + String(state.pageNumber || 1).padStart(3, '0'),
        page: state.pageNumber || 1
      })
    });
  } catch (error) {
    // Không giả lập câu trả lời khi backend chết: một câu trả lời trông-như-thật
    // nhưng bịa còn tệ hơn báo lỗi, vì học viên tin nó.
    throw new Error(
      `Không kết nối được AI Tutor (${BACKEND_URL}). ` +
        'Chạy backend: cd agent && python main.py'
    );
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Backend trả về HTTP ${response.status}. ${detail}`.trim());
  }
  if (!response.body) {
    throw new Error('Backend không trả về stream.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  // Tách theo '\n\n' (ranh giới block SSE) thay vì '\n', để không phụ thuộc
  // vào việc event/data có nằm liền nhau trong cùng một chunk mạng hay không.
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop();

    for (const block of blocks) {
      if (!block.trim()) continue;

      let eventType = 'message';
      let raw = '';
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) eventType = line.slice(6).trim();
        else if (line.startsWith('data:')) raw = line.slice(5).trim();
      }
      if (!raw) continue;

      let data;
      try {
        data = JSON.parse(raw);
      } catch (err) {
        console.warn('Không parse được data SSE:', raw);
        continue;
      }

      switch (eventType) {
        case 'token':
          onToken(data.text);
          break;
        case 'citation':
          onCitation(data);
          break;
        case 'suggestions':
          onSuggestions(data.questions || []);
          break;
        case 'tool_use':
          // Agent tự quyết định tra web — phần lớn turn không có event này
          if (onToolUse) onToolUse(data.name);
          break;
        case 'done':
          if (onDone) onDone(data);
          break;
        case 'error':
          console.error('SSE error event:', data);
          onToken(`\n\n**Lỗi:** ${data.message || 'Không xử lý được câu trả lời.'}`);
          break;
      }
    }
  }
}

async function handleSendMessage() {
  const text = elements.chatInput.value.trim();
  if (!text || state.isChatLoading) return;

  // 1. Append user message
  const userBubbleObj = createChatBubble('user', text);
  elements.chatMessages.appendChild(userBubbleObj.bubble);
  elements.chatInput.value = '';
  elements.sendBtn.disabled = true;
  state.isChatLoading = true;
  scrollToBottom();

  // 2. Append typing indicator
  const typingIndicator = createTypingIndicator();
  elements.chatMessages.appendChild(typingIndicator);
  scrollToBottom();

  // 3. Create Assistant bubble container ready for streaming
  let assistantBubbleObj = null;

  /** Tạo bubble AI khi có tín hiệu đầu tiên (token hoặc tool call). */
  const ensureBubble = () => {
    const existingIndicator = document.getElementById('typing-indicator');
    if (existingIndicator) existingIndicator.remove();

    if (!assistantBubbleObj) {
      assistantBubbleObj = createChatBubble('assistant', '');
      assistantBubbleObj.rawText = '';
      elements.chatMessages.appendChild(assistantBubbleObj.bubble);
    }
    return assistantBubbleObj;
  };

  try {
    await sendChatMessageSSE(text, {
      onToken: (tokenText) => {
        const bubbleObj = ensureBubble();
        removeToolBadge(bubbleObj.bubble);
        bubbleObj.rawText += tokenText;
        bubbleObj.content.innerHTML = formatMarkdown(bubbleObj.rawText);
        scrollToBottom();
      },

      onToolUse: (toolName) => {
        showToolBadge(ensureBubble().bubble, toolName);
        scrollToBottom();
      },

      onCitation: (citationData) => {
        if (assistantBubbleObj) {
          appendCitationBadge(assistantBubbleObj.bubble, citationData);
          scrollToBottom();
        }
      },

      onSuggestions: (suggestionsList) => {
        if (assistantBubbleObj) {
          appendSuggestedQuestions(assistantBubbleObj.bubble, suggestionsList);
          scrollToBottom();
        }
      },

      onDone: (stats) => {
        if (assistantBubbleObj) {
          removeToolBadge(assistantBubbleObj.bubble);
          appendTurnStats(assistantBubbleObj.bubble, stats);
          scrollToBottom();
        }
      }
    });
  } catch (error) {
    console.error('Lỗi khi gọi AI Tutor:', error);
    const existingIndicator = document.getElementById('typing-indicator');
    if (existingIndicator) existingIndicator.remove();

    // Nêu đúng lỗi thật để biết đường sửa, thay vì câu chung chung
    const message = error && error.message ? error.message : 'Lỗi không rõ.';
    if (assistantBubbleObj) {
      assistantBubbleObj.rawText += `\n\n**Lỗi:** ${message}`;
      assistantBubbleObj.content.innerHTML = formatMarkdown(assistantBubbleObj.rawText);
    } else {
      const errBubble = createChatBubble('assistant', `**Lỗi:** ${message}`);
      elements.chatMessages.appendChild(errBubble.bubble);
    }
    showToast(message, 'error');
  } finally {
    state.isChatLoading = false;
    elements.sendBtn.disabled = elements.chatInput.value.trim().length === 0;
    scrollToBottom();
  }
}

elements.sendBtn.addEventListener('click', handleSendMessage);

elements.chatInput.addEventListener('input', () => {
  elements.sendBtn.disabled =
    elements.chatInput.value.trim().length === 0 || state.isChatLoading;
});

elements.chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSendMessage();
  }
});

// ---------------------------------------------------------
// 10. Idle Suggestion Detection (POST /suggest/idle)
// ---------------------------------------------------------
let idleTimer;
const IDLE_THRESHOLD_SECONDS = 45;

function showIdleSuggestionsChip(questions, keywords = []) {
  if (!questions || questions.length === 0) return;

  // Remove any existing idle banner
  const oldBanner = document.getElementById('idle-suggestions-banner');
  if (oldBanner) oldBanner.remove();

  const banner = document.createElement('div');
  banner.id = 'idle-suggestions-banner';
  banner.className = 'idle-suggestion-box';
  banner.innerHTML = `
    <div class="idle-header">
      <span>✨ Gợi ý câu hỏi chủ động cho Trang ${state.pageNumber || 1}:</span>
      <button class="idle-close" type="button" title="Đóng">&times;</button>
    </div>
    <div class="idle-pills"></div>
  `;

  const pillsContainer = banner.querySelector('.idle-pills');
  questions.forEach((qText) => {
    const btn = document.createElement('button');
    btn.className = 'suggestion-pill idle-pill';
    btn.type = 'button';
    btn.textContent = qText;
    btn.addEventListener('click', () => {
      elements.chatInput.value = qText;
      banner.remove();
      handleSendMessage();
    });
    pillsContainer.appendChild(btn);
  });

  if (keywords && keywords.length > 0) {
    const kwContainer = document.createElement('div');
    kwContainer.className = 'idle-keywords-container';
    keywords.forEach(kw => {
      const pill = document.createElement('span');
      pill.className = 'idle-keyword-pill';
      pill.textContent = `#${kw}`;
      kwContainer.appendChild(pill);
    });
    banner.appendChild(kwContainer);
  }

  banner.querySelector('.idle-close').addEventListener('click', () => {
    banner.remove();
  });

  elements.chatMessages.appendChild(banner);
  scrollToBottom();
}

async function triggerIdleSuggestion() {
  try {
    const response = await fetch(`${BACKEND_URL}/suggest/idle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: DEFAULT_SESSION_ID,
        lesson_id: state.lessonId || DEFAULT_LESSON_ID,
        slide_id: "slide-" + String(state.pageNumber || 1).padStart(3, '0'),
        idle_seconds: IDLE_THRESHOLD_SECONDS
      })
    });

    if (response.ok) {
      const data = await response.json();
      showIdleSuggestionsChip(data.questions, data.keywords || []);
    }
  } catch (error) {
    // Backend chết thì im lặng — gợi ý bịa còn tệ hơn không gợi ý
    console.warn('Không lấy được gợi ý idle:', error);
  }
}

function resetIdleTimer() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    triggerIdleSuggestion();
  }, IDLE_THRESHOLD_SECONDS * 1000);
}

['mousemove', 'keydown', 'click'].forEach((event) => {
  document.addEventListener(event, resetIdleTimer);
});

// Initialize UI & start Idle timer
updateToolbarState();
resetIdleTimer();

// Nạp sẵn bài 1 — slide có trong repo nên không cần user upload gì
loadLessonPdf(state.lessonId);
