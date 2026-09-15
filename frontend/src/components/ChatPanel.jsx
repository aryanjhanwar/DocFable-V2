import { useState, useRef, useEffect } from 'react';
import { Send, Square, MessageSquare, Sparkles, Bot } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { useSSE } from '../hooks/useSSE';

const SUGGESTED_QUESTIONS = [
  'Summarize this paper in simple terms',
  'What is the main methodology used?',
  'What are the key findings?',
  'What are the limitations of this study?',
  'What datasets were used?',
  'What future work is suggested?',
  'Explain the results section',
  'What problem does this paper solve?',
];

export default function ChatPanel({ sessionId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const { content, isStreaming, error, startStream, stopStream, reset } = useSSE();

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, content]);

  // Add AI message when stream completes
  const streamingMsgRef = useRef(null);

  const sendMessage = (question = input.trim()) => {
    if (!question || isStreaming || !sessionId) return;

    const userMsg = { id: Date.now(), role: 'user', content: question, mode: 'chat' };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    reset();

    startStream(
      { sessionId, mode: 'chat', question },
      {
        onComplete: () => {
          // Content is captured via ref since state updates are async
        },
      }
    );
  };

  // When streaming stops, commit the streamed message
  useEffect(() => {
    if (!isStreaming && content) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: 'assistant', content, mode: 'chat' },
      ]);
      reset();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isEmpty = messages.length === 0 && !isStreaming;

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {isEmpty ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full text-center py-12 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #6470f1, #34d399)' }}>
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Ask anything about your paper</h3>
            <p className="text-gray-400 text-sm max-w-sm mb-8">
              I've read your document and I'm ready to answer questions, explain concepts, or discuss findings.
            </p>
            {/* Suggested questions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTED_QUESTIONS.slice(0, 6).map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-left px-3 py-2.5 rounded-xl text-sm text-gray-300 transition-all duration-200
                    hover:text-white border"
                  style={{
                    background: 'rgba(100,112,241,0.05)',
                    borderColor: 'rgba(100,112,241,0.15)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(100,112,241,0.12)';
                    e.currentTarget.style.borderColor = 'rgba(100,112,241,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(100,112,241,0.05)';
                    e.currentTarget.style.borderColor = 'rgba(100,112,241,0.15)';
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5 inline mr-2 text-brand-400" />
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                mode={msg.mode}
              />
            ))}
            {/* Live streaming bubble */}
            {isStreaming && content && (
              <MessageBubble
                role="assistant"
                content={content}
                isStreaming={true}
                mode="chat"
              />
            )}
            {isStreaming && !content && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #6470f1, #34d399)' }}>
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="glass-card px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">Thinking…</span>
                </div>
              </div>
            )}
            {error && (
              <div className="text-center py-3 px-4 rounded-xl text-red-400 text-sm"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                ⚠️ {error}
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t p-4" style={{ borderColor: 'rgba(100,112,241,0.15)' }}>
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={sessionId ? 'Ask a question about your paper… (Enter to send)' : 'Upload a PDF first to start chatting'}
              disabled={!sessionId || isStreaming}
              rows={1}
              className="input-field resize-none min-h-[48px] max-h-32 py-3 pr-12 text-sm leading-relaxed"
              style={{
                height: 'auto',
                overflowY: input.split('\n').length > 3 ? 'auto' : 'hidden',
              }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
              }}
            />
          </div>
          <button
            id={isStreaming ? 'stop-stream-btn' : 'send-message-btn'}
            onClick={isStreaming ? stopStream : () => sendMessage()}
            disabled={!sessionId || (!isStreaming && !input.trim())}
            className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
              isStreaming
                ? 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30'
                : 'btn-primary p-0 w-12 h-12'
            } disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none`}
          >
            {isStreaming
              ? <Square className="w-4 h-4" fill="currentColor" />
              : <Send className="w-4 h-4" />
            }
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2 text-center">
          <MessageSquare className="w-3 h-3 inline mr-1" />
          Shift+Enter for newline · Enter to send
        </p>
      </div>
    </div>
  );
}
