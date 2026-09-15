import { Zap, FileText, Layers, Brain, Lightbulb, MessageSquare, TrendingUp, Clock } from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    color: '#6470f1',
    title: 'Ask Anything',
    desc: 'Chat directly with your document. Ask questions in plain English and get precise, contextual answers.',
  },
  {
    icon: FileText,
    color: '#34d399',
    title: '4 Summary Styles',
    desc: 'Choose from Executive, Beginner-Friendly, Technical, or Bullet-Point summaries.',
  },
  {
    icon: Layers,
    color: '#f59e0b',
    title: 'Smart Flashcards',
    desc: 'Auto-generate interactive flashcard decks for efficient revision and memorization.',
  },
  {
    icon: Brain,
    color: '#ec4899',
    title: 'Quiz Generator',
    desc: 'Test your understanding with AI-generated MCQ and short answer quizzes.',
  },
  {
    icon: Lightbulb,
    color: '#8b5cf6',
    title: 'Key Insights',
    desc: 'Extract main contributions, limitations, future scope, and key statistics at a glance.',
  },
  {
    icon: Zap,
    color: '#06b6d4',
    title: 'Streaming Responses',
    desc: 'Watch AI responses appear in real time — no waiting for the complete output.',
  },
  {
    icon: TrendingUp,
    color: '#f97316',
    title: 'Markdown Rich Output',
    desc: 'Beautifully formatted responses with tables, code blocks, headings, and bullet lists.',
  },
  {
    icon: Clock,
    color: '#a78bfa',
    title: 'Save Hours of Reading',
    desc: 'Understand a 40-page research paper in minutes, not hours.',
  },
];

export default function FeatureCards() {
  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="badge mb-4 mx-auto w-fit">Everything you need</div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Supercharge your research workflow
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            DocFable gives you a full suite of tools to understand, analyze, and learn from any PDF document.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(({ icon: Icon, color, title, desc }, i) => (
            <div
              key={title}
              className="glass-card-hover p-5 animate-slide-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${color}1a`, border: `1px solid ${color}33` }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
