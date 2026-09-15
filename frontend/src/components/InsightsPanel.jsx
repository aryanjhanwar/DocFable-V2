import { Loader2, Lightbulb, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSSE } from '../hooks/useSSE';

export default function InsightsPanel({ sessionId }) {
  const { content, isStreaming, error, startStream, reset } = useSSE();

  const generate = () => {
    reset();
    startStream({ sessionId, mode: 'insights' });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="text-sm text-gray-400">
        <p>Extract structured insights: contributions, advantages, limitations, future scope, statistics, and key terminology.</p>
      </div>

      <button
        id="generate-insights-btn"
        onClick={generate}
        disabled={isStreaming || !sessionId}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isStreaming ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Extracting Insights…</>
        ) : (
          <><Lightbulb className="w-4 h-4" /> Extract Key Insights</>
        )}
      </button>

      {isStreaming && !content && (
        <div className="text-center py-8 text-gray-400 text-sm animate-pulse">
          <Lightbulb className="w-8 h-8 mx-auto mb-2 text-brand-400" />
          <p>Analyzing document for key insights…</p>
        </div>
      )}

      {(content || isStreaming) && (
        <div className="glass-card p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <span className="badge">💡 Key Insights</span>
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
