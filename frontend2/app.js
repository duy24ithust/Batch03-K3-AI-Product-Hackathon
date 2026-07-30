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
  lessonId: 'lesson-01'
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
    toast.style.transform = 'translateY(12px)';
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
    if (nameLower.includes(`b${i}`) || nameLower.includes(`lesson-${i}`) || nameLower.includes(`lesson0${i}`)) {
      state.lessonId = `lesson-0${i}`;
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
elements.uploadBtn.addEventListener('click', () => {
  elements.fileInput.click();
});

elements.emptyUploadBtn.addEventListener('click', () => {
  elements.fileInput.click();
});

elements.fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    loadPdfFile(file);
  }
});

if (elements.lessonSelect) {
  elements.lessonSelect.addEventListener('change', (e) => {
    state.lessonId = e.target.value;
    showToast(`Switched RAG lesson context to ${e.target.options[e.target.selectedIndex].text}`, 'success');
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
const BACKEND_URL = 'http://localhost:8000';
const DEFAULT_SESSION_ID = 'user-vlearn-01';
const DEFAULT_LESSON_ID = 'lesson-01';
const DEFAULT_SLIDE_ID = 'slide-abc123';

function scrollToBottom() {
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function formatMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.*$)/gim, '<strong>$1</strong><br>')
    .replace(/^## (.*$)/gim, '<strong>$1</strong><br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^- (.*$)/gim, '• $1<br>')
    .replace(/^\* (.*$)/gim, '• $1<br>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

function createChatBubble(sender, text = '') {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;

  const header = document.createElement('div');
  header.className = 'bubble-header';
  header.textContent = sender === 'user' ? 'You' : 'Trợ lý AI';

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

  const badge = document.createElement('button');
  badge.className = 'citation-badge';
  badge.type = 'button';
  const confidencePercent = citation.confidence ? Math.round(citation.confidence * 100) : 95;
  badge.innerHTML = `📄 Page ${citation.page} <span class="citation-conf">${confidencePercent}%</span>`;
  badge.title = `Source: ${citation.source || 'transcript-01-clean.md'}`;

  badge.addEventListener('click', () => {
    if (citation.page && citation.page >= 1 && citation.page <= state.numPages) {
      scrollToSlide(citation.page);
      showToast(`Jumped to Slide Page ${citation.page}`, 'success');
    } else {
      showToast(`Citation refers to Page ${citation.page}`, 'success');
    }
  });

  badgeContainer.appendChild(badge);
}

function appendSuggestedQuestions(bubbleElem, questions) {
  if (!questions || questions.length === 0) return;

  let suggestionsContainer = bubbleElem.querySelector('.suggestions-container');
  if (!suggestionsContainer) {
    suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'suggestions-container';
    const label = document.createElement('div');
    label.className = 'suggestions-label';
    label.textContent = '💡 Suggested follow-ups:';
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
async function sendChatMessageSSE(messageText, onToken, onCitation, onSuggestions) {
  try {
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: DEFAULT_SESSION_ID,
        message: messageText,
        lesson_id: state.lessonId || DEFAULT_LESSON_ID,
        slide_id: "slide-" + String(state.pageNumber || 1).padStart(3, '0'),
        page: state.pageNumber || 1
      })
    });

    if (!response.ok || !response.body) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');

      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i];
        if (line.startsWith('event: ')) {
          const eventType = line.replace('event: ', '').trim();
          const dataLine = lines[++i];

          if (dataLine && dataLine.startsWith('data: ')) {
            try {
              const data = JSON.parse(dataLine.replace('data: ', ''));

              if (eventType === 'token') {
                onToken(data.text);
              } else if (eventType === 'citation') {
                onCitation(data);
              } else if (eventType === 'suggestions') {
                onSuggestions(data.questions);
              } else if (eventType === 'error') {
                console.error('SSE Error Event:', data);
                if (data.error_type === 'no_grounding') {
                  onToken('\n\n❌ *This topic is not covered in the current materials.*');
                } else {
                  onToken(`\n\n❌ *${data.message || 'Error processing response.'}*`);
                }
              }
            } catch (err) {
              console.warn('Could not parse SSE data JSON:', err);
            }
          }
        }
      }
      buffer = lines[lines.length - 1];
    }
  } catch (error) {
    console.warn('Backend server offline or unreachable, falling back to local simulation:', error);
    // Smooth demo fallback
    await new Promise((resolve) => setTimeout(resolve, 600));
    const fallbackText = `### AI Tutor Response 💬\n\nI analyzed your question regarding slide page ${state.pageNumber || 1}.\n\n- **Answer**: Modern LLM systems use grounded RAG and schema-based tool calling to ensure verifiable accuracy.\n- **Slide Context**: You are viewing slide ${state.pageNumber || 1}.`;

    // Simulate token streaming
    const words = fallbackText.split(' ');
    for (const word of words) {
      onToken(word + ' ');
      await new Promise((r) => setTimeout(r, 45));
    }

    onCitation({
      chunk_id: 'T01-042',
      source: 'transcript-01-clean.md',
      page: state.pageNumber || 1,
      confidence: 0.95
    });

    onSuggestions([
      'Làm thế nào để train ML model?',
      'Sự khác biệt giữa supervised và unsupervised là gì?',
      'Feature engineering quan trọng như thế nào?'
    ]);
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

  try {
    await sendChatMessageSSE(
      text,
      // onToken callback
      (tokenText) => {
        const existingIndicator = document.getElementById('typing-indicator');
        if (existingIndicator) existingIndicator.remove();

        if (!assistantBubbleObj) {
          assistantBubbleObj = createChatBubble('assistant', '');
          assistantBubbleObj.rawText = '';
          elements.chatMessages.appendChild(assistantBubbleObj.bubble);
        }
        assistantBubbleObj.rawText += tokenText;
        assistantBubbleObj.content.innerHTML = formatMarkdown(assistantBubbleObj.rawText);
        scrollToBottom();
      },
      // onCitation callback
      (citationData) => {
        if (assistantBubbleObj) {
          appendCitationBadge(assistantBubbleObj.bubble, citationData);
          scrollToBottom();
        }
      },
      // onSuggestions callback
      (suggestionsList) => {
        if (assistantBubbleObj) {
          appendSuggestedQuestions(assistantBubbleObj.bubble, suggestionsList);
          scrollToBottom();
        }
      }
    );
  } catch (error) {
    console.error('Error in chat service:', error);
    const existingIndicator = document.getElementById('typing-indicator');
    if (existingIndicator) existingIndicator.remove();

    const errBubble = createChatBubble(
      'assistant',
      'Sorry, an error occurred while processing your message.'
    );
    elements.chatMessages.appendChild(errBubble.bubble);
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
      <span>✨ Curious about Slide ${state.pageNumber || 1}? Ask the AI Tutor:</span>
      <button class="idle-close" type="button" title="Close">&times;</button>
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
    // If backend offline, show simulated deep questions after idle
    showIdleSuggestionsChip([
      'Bạn có thể giải thích tại sao feature engineering quan trọng?',
      'Sự khác biệt giữa supervised và unsupervised là gì?',
      'Làm thế nào để lựa chọn model phù hợp?'
    ]);
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
