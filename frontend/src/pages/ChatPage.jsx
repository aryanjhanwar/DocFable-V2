import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  FileText, MessageSquare, Layers, Brain, Lightbulb,
  ChevronLeft, ChevronRight, Info,
} from 'lucide-react';
import UploadZone from '../components/UploadZone';
import ChatPanel from '../components/ChatPanel';
import SummaryPanel from '../components/SummaryPanel';
import FlashcardPanel from '../components/FlashcardPanel';
import QuizPanel from '../components/QuizPanel';
import InsightsPanel from '../components/InsightsPanel';

const TOOLS = [
  { id: 'chat', label: 'Chat', icon: MessageSquare, desc: 'Ask questions' },
  { id: 'summary', label: 'Summary', icon: FileText, desc: '4 summary types' },
  { id: 'flashcards', label: 'Flashcards', icon: Layers, desc: 'Study cards' },
  { id: 'quiz', label: 'Quiz', icon: Brain, desc: 'Test yourself' },
  { id: 'insights', label: 'Insights', icon: Lightbulb, desc: 'Key findings' },
];

export default function ChatPage() {
  const location = useLocation();
  const [uploadData, setUploadData] = useState(location.state?.uploadData || null);
  const [activeTool, setActiveTool] = useState('chat');
  const [leftCollapsed, setLeftCollapsed] = useState(false);

  const sessionId = uploadData?.sessionId;

  const ActivePanel = () => {
    if (!sessionId) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center py-20 px-6">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 animate-float"
            style={{ background: 'linear-gradient(135deg, rgba(100,112,241,0.2), rgba(52,211,153,0.1))' }}>
            <FileText className="w-10 h-10 text-brand-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Upload a PDF to begin</h2>
          <p className="text-gray-400 max-w-sm leading-relaxed">
            Upload a research paper or PDF document on the left panel to start analyzing it with AI.
          </p>
          <div className="flex items-center gap-2 mt-6 text-xs text-gray-500">
            <Info className="w-3.5 h-3.5" />
            Supports PDF files up to 20 MB
          </div>
        </div>
      );
    }

    switch (activeTool) {
      case 'chat':       return <ChatPanel sessionId={sessionId} />;
      case 'summary':    return <div className="p-4 overflow-y-auto h-full"><SummaryPanel sessionId={sessionId} /></div>;
      case 'flashcards': return <div className="p-4 overflow-y-auto h-full"><FlashcardPanel sessionId={sessionId} /></div>;
      case 'quiz':       return <div className="p-4 overflow-y-auto h-full"><QuizPanel sessionId={sessionId} /></div>;
      case 'insights':   return <div className="p-4 overflow-y-auto h-full"><InsightsPanel sessionId={sessionId} /></div>;
      default:           return <ChatPanel sessionId={sessionId} />;
    }
  };

  return (
    <div className="flex h-screen pt-16 overflow-hidden">
      {/* ── Left Panel ─────────────────────────────────────────────────── */}
      <aside className={`flex flex-col border-r transition-all duration-300 ease-in-out ${
        leftCollapsed ? 'w-0 overflow-hidden' : 'w-72 lg:w-80'
      }`}
        style={{ borderColor: 'rgba(100,112,241,0.15)', background: 'rgba(10,10,26,0.9)' }}>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* PDF Upload section */}
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Document</h2>
            <UploadZone
              onUploadSuccess={(data) => {
                setUploadData(data);
                if (data) setActiveTool('chat');
              }}
            />
          </div>

          {/* Document info */}
          {uploadData && (
            <div className="glass-card p-4 animate-fade-in space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Document Info</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">File</span>
                  <span className="text-white font-medium truncate ml-2 max-w-[140px]" title={uploadData.filename}>
                    {uploadData.filename}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pages</span>
                  <span className="text-white">{uploadData.pageCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Words</span>
                  <span className="text-white">{(uploadData.wordCount || 0).toLocaleString()}</span>
                </div>
                {uploadData.truncated && (
                  <p className="text-yellow-400/80 text-xs mt-1">⚠️ Document truncated for AI context</p>
                )}
              </div>
            </div>
          )}

          {/* Tool selector */}
          {sessionId && (
            <div>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">AI Tools</h2>
              <div className="space-y-1">
                {TOOLS.map(({ id, label, icon: Icon, desc }) => (
                  <button
                    key={id}
                    id={`tool-${id}`}
                    onClick={() => setActiveTool(id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                      activeTool === id
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                    style={activeTool === id ? {
                      background: 'rgba(100,112,241,0.15)',
                      border: '1px solid rgba(100,112,241,0.3)',
                    } : {}}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${activeTool === id ? 'text-brand-400' : ''}`} />
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{label}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </div>
                    {activeTool === id && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Collapse toggle */}
      <button
        onClick={() => setLeftCollapsed(!leftCollapsed)}
        className="hidden lg:flex flex-col items-center justify-center w-5 border-r border-brand-600/15
          text-gray-600 hover:text-gray-400 hover:bg-white/3 transition-all duration-200 flex-shrink-0 z-10"
        style={{ background: 'rgba(10,10,26,0.9)' }}
        title={leftCollapsed ? 'Show panel' : 'Hide panel'}
      >
        {leftCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* ── Right Panel (Main Content) ───────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden"
        style={{ background: 'rgba(16,16,43,0.4)' }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{ borderColor: 'rgba(100,112,241,0.12)' }}>
          <div className="flex items-center gap-2">
            {TOOLS.find(t => t.id === activeTool) && (() => {
              const Tool = TOOLS.find(t => t.id === activeTool);
              const Icon = Tool.icon;
              return (
                <>
                  <Icon className="w-4 h-4 text-brand-400" />
                  <h1 className="font-semibold text-white text-sm">{Tool.label}</h1>
                  <span className="text-gray-600">·</span>
                  <span className="text-gray-400 text-sm">{Tool.desc}</span>
                </>
              );
            })()}
          </div>
          {uploadData && (
            <span className="badge-green badge hidden sm:inline-flex">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
              {uploadData.filename?.slice(0, 20)}{uploadData.filename?.length > 20 ? '…' : ''}
            </span>
          )}
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-hidden">
          <ActivePanel />
        </div>
      </main>
    </div>
  );
}
