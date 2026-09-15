import axios from 'axios';

const BASE_URL = '/api';

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// ─── Upload PDF ───────────────────────────────────────────────────────────────
export async function uploadPDF(file, onProgress) {
  const formData = new FormData();
  formData.append('pdf', file);

  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded * 100) / evt.total));
      }
    },
  });

  return response.data;
}

// ─── SSE Streaming Chat ───────────────────────────────────────────────────────
/**
 * Opens an SSE connection to stream AI responses.
 * @param {object} payload - { sessionId, mode, question?, summaryType?, quizType?, count? }
 * @param {function} onDelta - called with each text chunk
 * @param {function} onDone  - called when stream completes
 * @param {function} onError - called on error
 * @returns {function} - cleanup function to abort the stream
 */
export function streamChat(payload, onDelta, onDone, onError) {
  const controller = new AbortController();

  (async () => {
    try {
      const response = await fetch(`${BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          try {
            const event = JSON.parse(raw);
            if (event.type === 'delta' && event.content) {
              onDelta(event.content);
            } else if (event.type === 'done') {
              onDone();
            } else if (event.type === 'error') {
              onError(new Error(event.message));
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        onError(err);
      }
    }
  })();

  return () => controller.abort();
}

// ─── Health Check ─────────────────────────────────────────────────────────────
export async function checkHealth() {
  const response = await api.get('/health');
  return response.data;
}

export default api;
