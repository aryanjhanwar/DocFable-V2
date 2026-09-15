import { Link } from 'react-router-dom';
import { Zap, ArrowRight, Upload, Star } from 'lucide-react';
import FeatureCards from '../components/FeatureCards';
import UploadZone from '../components/UploadZone';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const STATS = [
  { value: '20MB', label: 'Max file size' },
  { value: '4', label: 'Summary styles' },
  { value: 'SSE', label: 'Real-time streaming' },
  { value: 'Gemini', label: 'Powered by' },
];

export default function HomePage() {
  const [uploadData, setUploadData] = useState(null);
  const navigate = useNavigate();

  const handleUpload = (data) => {
    if (data) {
      setUploadData(data);
    }
  };

  const handleStart = () => {
    if (uploadData) {
      navigate('/chat', { state: { uploadData } });
    }
  };

  return (
    <div className="min-h-screen">
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6470f1, transparent)' }} />
        <div className="absolute top-40 right-1/4 w-72 h-72 rounded-full opacity-8 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #34d399, transparent)' }} />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 border animate-fade-in"
            style={{ background: 'rgba(100,112,241,0.1)', borderColor: 'rgba(100,112,241,0.25)' }}>
            <Zap className="w-4 h-4 text-brand-400" fill="currentColor" />
            <span className="text-sm text-brand-300 font-medium">AI-Powered PDF Research Assistant</span>
            <Star className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" />
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6 animate-slide-up text-balance">
            Understand any
            <br />
            <span className="gradient-text">research paper</span>
            <br />
            instantly
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '100ms' }}>
            Upload a PDF, ask questions in plain English, get AI-powered summaries,
            flashcards, quizzes, and deep insights — all in real time.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-12 animate-fade-in" style={{ animationDelay: '200ms' }}>
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold gradient-text">{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Upload Zone */}
          <div className="max-w-xl mx-auto mb-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
            <UploadZone onUploadSuccess={handleUpload} />
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap justify-center gap-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
            {uploadData ? (
              <button
                id="start-analyzing-btn"
                onClick={handleStart}
                className="btn-primary text-base px-8 py-4 animate-pulse-glow"
              >
                <Zap className="w-5 h-5" />
                Start Analyzing
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <>
                <Link to="/chat" className="btn-primary text-base px-8 py-4">
                  <Upload className="w-5 h-5" />
                  Try Without Uploading
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="#features" className="btn-secondary text-base px-8 py-4">
                  See Features
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── How it Works ──────────────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="glow-divider mb-16" />
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">How it works</h2>
            <p className="text-gray-400">Three simple steps to unlock any document</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', icon: '📤', title: 'Upload PDF', desc: 'Drag & drop or browse to upload your research paper (up to 20 MB).' },
              { step: '02', icon: '🤖', title: 'AI Processes It', desc: 'Our AI extracts the full text and prepares it for intelligent Q&A.' },
              { step: '03', icon: '💬', title: 'Ask & Explore', desc: 'Chat, summarize, quiz yourself, or extract insights — all in real time.' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="glass-card p-6 text-center relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="badge font-mono font-bold">{step}</span>
                </div>
                <div className="text-4xl mt-3 mb-4">{icon}</div>
                <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <FeatureCards />

      {/* ── CTA Section ──────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass-card p-12 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20"
              style={{ background: 'radial-gradient(circle at 50% 50%, #6470f1, transparent 70%)' }} />
            <div className="relative z-10">
              <h2 className="text-4xl font-extrabold text-white mb-4">
                Ready to supercharge your research?
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                Upload your first PDF and experience the future of document understanding.
              </p>
              <Link to="/chat" className="btn-primary text-base px-10 py-4 inline-flex">
                <Zap className="w-5 h-5" />
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 text-center" style={{ borderColor: 'rgba(100,112,241,0.12)' }}>
        <p className="text-gray-500 text-sm">
          © 2025 DocFable · Created by AIStackers · Built with React, Node.js & Google Gemini
        </p>
      </footer>
    </div>
  );
}
