import { useState } from 'react';
import { Loader2, Brain, CheckCircle, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSSE } from '../hooks/useSSE';

function parseMCQ(text) {
  const questions = [];
  // Split by **Q1:**, Q1:, **Q1.** etc
  const blocks = text.split(/\*\*Q\d+[:.]?\*\*|Q\d+[:.]/i).slice(1);

  blocks.forEach((block, idx) => {
    const options = {};
    let answer = '';
    let explanation = '';
    
    // Extract A), B), C), D) options using a global regex
    const optRegex = /[-*]?\s*\**([A-D])\)[*:\s]+([^\n]+)/gi;
    let match;
    while ((match = optRegex.exec(block)) !== null) {
      options[match[1].toUpperCase()] = match[2].trim();
    }
    
    // Extract Answer:
    const ansMatch = block.match(/\*\*?Answer:?\*\*?\s*\**([A-D])\**/i);
    if (ansMatch) answer = ansMatch[1].toUpperCase();
    
    // Extract Explanation:
    const expMatch = block.match(/\*\*?Explanation:?\*\*?\s*([\s\S]+)/i);
    if (expMatch) explanation = expMatch[1].trim();
    
    // Question text is everything before the first option
    let questionText = "";
    const firstOptIndex = block.search(/[-*]?\s*\**[A-D]\)[*:\s]+/i);
    if (firstOptIndex > 0) {
      questionText = block.slice(0, firstOptIndex).trim();
    } else {
      questionText = block.split('\n')[0].trim();
    }

    if (questionText && Object.keys(options).length > 0) {
      questions.push({ id: idx + 1, question: questionText, options, answer, explanation });
    }
  });

  return questions;
}

function MCQQuestion({ q, index }) {
  const [selected, setSelected] = useState(null);
  const showResult = selected !== null;

  return (
    <div className="glass-card p-4 space-y-3" id={`quiz-q-${index + 1}`}>
      <div className="flex gap-2">
        <span className="badge flex-shrink-0">{index + 1}</span>
        <p className="text-white font-medium text-sm leading-relaxed">{q.question}</p>
      </div>
      <div className="space-y-2">
        {Object.entries(q.options).map(([letter, text]) => {
          let style = 'border border-transparent bg-surface-700/50 text-gray-300';
          if (showResult) {
            if (letter === q.answer) {
              style = 'border border-green-500/40 bg-green-500/10 text-green-300';
            } else if (letter === selected) {
              style = 'border border-red-500/40 bg-red-500/10 text-red-300';
            }
          } else if (selected === null) {
            style = 'border border-brand-600/20 bg-surface-700/50 text-gray-300 hover:border-brand-500/40 hover:text-white cursor-pointer';
          }

          return (
            <button
              key={letter}
              onClick={() => !showResult && setSelected(letter)}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 text-sm flex items-center gap-2 ${style}`}
              disabled={showResult}
            >
              <span className="font-bold text-xs w-5 flex-shrink-0">{letter}</span>
              <span>{text}</span>
              {showResult && letter === q.answer && <CheckCircle className="w-4 h-4 ml-auto text-green-400" />}
              {showResult && letter === selected && letter !== q.answer && <XCircle className="w-4 h-4 ml-auto text-red-400" />}
            </button>
          );
        })}
      </div>
      {showResult && q.explanation && (
        <div className="text-xs text-gray-400 p-2 rounded-lg"
          style={{ background: 'rgba(100,112,241,0.08)', border: '1px solid rgba(100,112,241,0.15)' }}>
          💡 {q.explanation}
        </div>
      )}
    </div>
  );
}

export default function QuizPanel({ sessionId }) {
  const [quizType, setQuizType] = useState('mcq');
  const [count, setCount] = useState(5);
  const { content, isStreaming, error, startStream, reset } = useSSE();

  const generate = () => {
    reset();
    startStream({ sessionId, mode: 'quiz', quizType, count });
  };

  const mcqQuestions = !isStreaming && content && quizType === 'mcq' ? parseMCQ(content) : [];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Controls */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-400 font-medium block mb-1">Quiz type</label>
          <select
            id="quiz-type-select"
            value={quizType}
            onChange={(e) => setQuizType(e.target.value)}
            className="input-field py-2 text-sm"
          >
            <option value="mcq">Multiple Choice (MCQ)</option>
            <option value="short">Short Answer</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 font-medium block mb-1">Questions</label>
          <select
            id="quiz-count-select"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="input-field py-2 text-sm"
          >
            {[3, 5, 8, 10].map((n) => (
              <option key={n} value={n}>{n} questions</option>
            ))}
          </select>
        </div>
      </div>

      <button
        id="generate-quiz-btn"
        onClick={generate}
        disabled={isStreaming || !sessionId}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isStreaming ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
        ) : (
          <><Brain className="w-4 h-4" /> Generate Quiz</>
        )}
      </button>

      {isStreaming && (
        <div className="text-center py-8 text-gray-400 text-sm animate-pulse">
          <Brain className="w-8 h-8 mx-auto mb-2 text-brand-400" />
          <p>Generating {quizType === 'mcq' ? 'multiple choice' : 'short answer'} quiz…</p>
        </div>
      )}

      {/* MCQ rendered interactively */}
      {!isStreaming && content && quizType === 'mcq' && mcqQuestions.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">{mcqQuestions.length} questions · Click options to answer</p>
            <button onClick={generate} className="btn-secondary py-1 px-3 text-xs">Regenerate</button>
          </div>
          {mcqQuestions.map((q, i) => <MCQQuestion key={q.id} q={q} index={i} />)}
        </div>
      )}

      {/* Short answer rendered as markdown */}
      {!isStreaming && content && quizType === 'short' && (
        <div className="glass-card p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <span className="badge">📝 Short Answer Quiz</span>
            <button onClick={generate} className="btn-secondary py-1 px-3 text-xs">Regenerate</button>
          </div>
          <div className="markdown-content text-sm">
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
