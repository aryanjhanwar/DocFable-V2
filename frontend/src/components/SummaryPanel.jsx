import { useState } from 'react';
import { FileText, Loader2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSSE } from '../hooks/useSSE';

const SUMMARY_TYPES = [
  { id: 'executive', label: 'Executive', icon: '🎯', desc: 'Professional & concise' },
  { id: 'beginner', label: 'Beginner', icon: '🌱', desc: 'Simple & accessible' },
  { id: 'technical', label: 'Technical', icon: '⚙️', desc: 'Expert-level detail' },
  { id: 'bullets', label: 'Bullet Points', icon: '📌', desc: 'Quick scan format' },
];

export default function SummaryPanel({ sessionId }) {
  const [summaryType, setSummaryType] = useState('executive');
  const [generatedType, setGeneratedType] = useState(null);
  const { content, isStreaming, error, startStream, reset } = useSSE();

  const generate = () => {
    reset();
    setGeneratedType(summaryType);
    startStream({ sessionId, mode: 'summary', summaryType });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Type selector */}
      <div>
        <p className="text-sm text-gray-400 font-medium mb-3">Select summary type:</p>
        <div className="grid grid-cols-2 gap-2">
          {SUMMARY_TYPES.map((type) => (
            <button
              key={type.id}
              id={`summary-type-${type.id}`}
              onClick={() => setSummaryType(type.id)}
              className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                summaryType === type.id
                  ? 'border-brand-500/50 text-white'
                  : 'border-transparent text-gray-400 hover:border-brand-600/30 hover:text-gray-300'
              }`}
              style={{
                background: summaryType === type.id
                  ? 'rgba(100,112,241,0.15)'
                  : 'rgba(16,16,43,0.5)',
              }}
            >
              <div className="text-lg mb-1">{type.icon}</div>
              <div className="font-semibold text-sm">{type.label}</div>
              <div className="text-xs opacity-70">{type.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button
        id="generate-summary-btn"
        onClick={generate}
        disabled={isStreaming || !sessionId}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isStreaming ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
        ) : (
          <><FileText className="w-4 h-4" /> Generate Summary</>
        )}
      </button>

      {/* Output */}
      {(content || isStreaming) && (
        <div className="glass-card p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <span className="badge">
              {SUMMARY_TYPES.find(t => t.id === (generatedType || summaryType))?.icon}{' '}
              {SUMMARY_TYPES.find(t => t.id === (generatedType || summaryType))?.label} Summary
            </span>
            {!isStreaming && (
              <button onClick={generate} className="btn-secondary py-1 px-3 text-xs gap-1.5">
                <RefreshCw className="w-3 h-3" /> Regenerate
              </button>
            )}
          </div>
          <div className={`markdown-content text-sm ${isStreaming ? 'typing-cursor' : ''}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        </div>
      )}

      {error && (
        <div className="text-red-400 text-sm p-3 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
