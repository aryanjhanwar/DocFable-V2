import { Link } from 'react-router-dom';
import { Zap, Github, Globe, Server, Code2, Cpu, ArrowRight } from 'lucide-react';

const TECH_STACK = [
  {
    category: 'Frontend',
    color: '#6470f1',
    items: ['React 18', 'Vite', 'Tailwind CSS', 'React Router', 'React Markdown', 'Framer Motion', 'Lucide Icons'],
  },
  {
    category: 'Backend',
    color: '#34d399',
    items: ['Node.js', 'Express.js', 'Multer', 'pdf-parse', 'Google Generative AI SDK', 'Morgan', 'dotenv'],
  },
  {
    category: 'AI & Streaming',
    color: '#f59e0b',
    items: ['Google Gemini 1.5 Flash', 'Server-Sent Events (SSE)', 'Prompt Engineering', 'Context Window Management'],
  },
  {
    category: 'DevOps',
    color: '#ec4899',
    items: ['Docker', 'Docker Compose', 'AWS App Runner', 'Nginx', 'Environment Variables'],
  },
];

const OBJECTIVES = [
  { icon: '🎯', text: 'Simplify understanding of technical documents' },
  { icon: '⚡', text: 'Reduce reading time through intelligent summaries' },
  { icon: '💬', text: 'Enable conversational interaction with documents' },
  { icon: '🧠', text: 'Auto-generate study material (flashcards, quizzes)' },
  { icon: '🌊', text: 'Demonstrate real-time AI streaming with SSE' },
  { icon: '☁️', text: 'Production-ready Docker + AWS deployment' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16 animate-slide-up">
          <div className="badge mb-4 mx-auto w-fit">About the Project</div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            DocFable <span className="gradient-text">AIStackers</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            An AI-powered research assistant that lets you upload, analyze, and interact
            with PDF documents using state-of-the-art Large Language Models.
          </p>
        </div>

        {/* Problem + Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                style={{ background: 'rgba(239,68,68,0.15)' }}>🔴</div>
              <h2 className="text-lg font-bold text-white">The Problem</h2>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Research papers and lengthy PDFs are time-consuming and difficult to understand.
              Students, researchers, and professionals spend hours identifying key concepts,
              methodologies, and conclusions — often losing the big picture.
            </p>
          </div>
          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                style={{ background: 'rgba(52,211,153,0.15)' }}>🟢</div>
              <h2 className="text-lg font-bold text-white">The Solution</h2>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              DocFable extracts document text and feeds it to an LLM with carefully
              engineered prompts. Users can chat with the document, generate summaries,
              flashcards, quizzes, and key insights — all streamed in real time.
            </p>
          </div>
        </div>

        {/* Objectives */}
        <div className="glass-card p-6 mb-12 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-400" /> Project Objectives
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {OBJECTIVES.map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(100,112,241,0.05)', border: '1px solid rgba(100,112,241,0.1)' }}>
                <span className="text-xl">{icon}</span>
                <span className="text-gray-300 text-sm leading-relaxed">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Architecture */}
        <div className="glass-card p-6 mb-12 animate-fade-in" style={{ animationDelay: '250ms' }}>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Server className="w-5 h-5 text-brand-400" /> System Architecture
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            {[
              { label: 'User', bg: '#6470f1' },
              { label: '→', bg: 'transparent' },
              { label: 'React Frontend', bg: '#6470f120' },
              { label: '→', bg: 'transparent' },
              { label: 'Express API', bg: '#34d39920' },
              { label: '→', bg: 'transparent' },
              { label: 'pdf-parse', bg: '#f59e0b20' },
              { label: '→', bg: 'transparent' },
              { label: 'Prompt Builder', bg: '#8b5cf620' },
              { label: '→', bg: 'transparent' },
              { label: 'OpenAI GPT', bg: '#ec489920' },
              { label: '→', bg: 'transparent' },
              { label: 'SSE Stream', bg: '#06b6d420' },
              { label: '→', bg: 'transparent' },
              { label: 'UI Display', bg: '#6470f120' },
            ].map(({ label, bg }, i) => (
              label === '→' ? (
                <span key={i} className="text-gray-600 text-lg">→</span>
              ) : (
                <span key={i} className="px-3 py-1.5 rounded-lg text-white font-medium text-xs"
                  style={{ background: bg === '#6470f1' ? 'linear-gradient(135deg,#6470f1,#34d399)' : bg }}>
                  {label}
                </span>
              )
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mb-12 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-brand-400" /> Tech Stack
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TECH_STACK.map(({ category, color, items }) => (
              <div key={category} className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                  <h3 className="font-semibold text-white">{category}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {items.map((item) => (
                    <span key={item} className="px-2.5 py-1 rounded-lg text-xs font-medium"
                      style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Endpoints */}
        <div className="glass-card p-6 mb-12 animate-fade-in" style={{ animationDelay: '350ms' }}>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-brand-400" /> API Endpoints
          </h2>
          <div className="space-y-3">
            {[
              { method: 'POST', path: '/api/upload', desc: 'Upload and parse a PDF. Returns sessionId for subsequent calls.' },
              { method: 'POST', path: '/api/chat', desc: 'Send a request with mode (chat/summary/flashcards/quiz/insights). Streams SSE response.' },
              { method: 'GET', path: '/api/health', desc: 'Health check endpoint. Returns service status and model info.' },
            ].map(({ method, path, desc }) => (
              <div key={path} className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(100,112,241,0.05)', border: '1px solid rgba(100,112,241,0.1)' }}>
                <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono flex-shrink-0 ${
                  method === 'GET' ? 'text-green-400 bg-green-400/10' : 'text-blue-400 bg-blue-400/10'
                }`}>
                  {method}
                </span>
                <div>
                  <code className="text-brand-300 text-sm font-mono">{path}</code>
                  <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Developer info */}
        <div className="glass-card p-6 text-center animate-fade-in" style={{ animationDelay: '400ms' }}>
          <Cpu className="w-10 h-10 mx-auto mb-3 text-brand-400" />
          <h2 className="text-xl font-bold text-white mb-2">Built by AIStackers</h2>
          <p className="text-gray-400 text-sm max-w-lg mx-auto mb-6 leading-relaxed">
            DocFable is a demonstration of AI-assisted software development, showcasing
            seamless integration of OpenAI's GPT models with a modern React + Node.js stack,
            containerized with Docker and ready for AWS deployment.
          </p>
          <Link to="/chat" className="btn-primary inline-flex">
            <Zap className="w-4 h-4" />
            Try DocFable
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
