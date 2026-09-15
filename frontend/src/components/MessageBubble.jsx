import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User } from 'lucide-react';

export default function MessageBubble({ role, content, isStreaming = false, mode = 'chat' }) {
  const isUser = role === 'user';

  const modeLabels = {
    chat: null,
    summary: '📋 Summary',
    flashcards: '🃏 Flashcards',
    quiz: '🧠 Quiz',
    insights: '💡 Key Insights',
  };

  return (
    <div className={`flex gap-3 animate-slide-up ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
        isUser
          ? 'bg-brand-600/30 border border-brand-500/30'
          : 'border border-brand-600/20'
      }`}
        style={!isUser ? { background: 'linear-gradient(135deg, #6470f1, #34d399)' } : {}}>
        {isUser
          ? <User className="w-4 h-4 text-brand-300" />
          : <Bot className="w-4 h-4 text-white" />
        }
      </div>

      {/* Bubble */}
      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {/* Mode badge */}
        {!isUser && modeLabels[mode] && (
          <span className="badge text-xs mb-1">{modeLabels[mode]}</span>
        )}

        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? 'rounded-tr-sm text-white text-sm leading-relaxed'
            : 'rounded-tl-sm'
        }`}
          style={isUser
            ? { background: 'linear-gradient(135deg, #6470f1, #4541ca)', boxShadow: '0 4px 20px rgba(100,112,241,0.3)' }
            : { background: 'rgba(16,16,43,0.8)', border: '1px solid rgba(100,112,241,0.15)' }
          }>
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
          ) : (
            <div className={`markdown-content text-sm ${isStreaming ? 'typing-cursor' : ''}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content || (isStreaming ? '' : '_No response_')}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
