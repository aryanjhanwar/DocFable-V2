import { useState } from 'react';
import { Loader2, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { useSSE } from '../hooks/useSSE';

function parseFlashcards(text) {
  const cards = [];
  // Split by **Q1:**, **Q1.**, Q1: etc
  const blocks = text.split(/\*\*Q\d+[:.]?\*\*|Q\d+[:.]/i).slice(1);
  
  blocks.forEach((block, idx) => {
    // Split the block into question and answer using **A1:**, **Answer:** etc
    const parts = block.split(/\*\*A\d*[:.]?\*\*|\*\*Answer[:.]?\*\*|Answer:/i);
    if (parts.length >= 2) {
      cards.push({
        id: idx + 1,
        question: parts[0].trim(),
        answer: parts.slice(1).join('').trim(),
      });
    }
  });
  return cards;
}

function FlashCard({ card, index }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      id={`flashcard-${index + 1}`}
      onClick={() => setFlipped(!flipped)}
      className="cursor-pointer rounded-xl p-4 border transition-all duration-300 min-h-[100px] flex flex-col justify-between group"
      style={{
        background: flipped ? 'rgba(52,211,153,0.08)' : 'rgba(100,112,241,0.08)',
        borderColor: flipped ? 'rgba(52,211,153,0.25)' : 'rgba(100,112,241,0.2)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-bold text-gray-500">Q{card.id}</span>
        <span className="text-xs text-gray-500">{flipped ? 'Answer' : 'Question'} · Click to flip</span>
      </div>
      <div className="mt-2 text-sm leading-relaxed">
        {flipped ? (
          <div>
            <p className="text-accent-400 font-semibold text-xs mb-1">Answer:</p>
            <p className="text-gray-200">{card.answer}</p>
          </div>
        ) : (
          <p className="text-white font-medium">{card.question}</p>
        )}
      </div>
      <div className="flex justify-center mt-2">
        {flipped
          ? <ChevronUp className="w-3 h-3 text-gray-500 group-hover:text-gray-400" />
          : <ChevronDown className="w-3 h-3 text-gray-500 group-hover:text-gray-400" />
        }
      </div>
    </div>
  );
}

export default function FlashcardPanel({ sessionId }) {
  const [count, setCount] = useState(10);
  const [cards, setCards] = useState([]);
  const { content, isStreaming, error, startStream, reset } = useSSE();

  const generate = () => {
    reset();
    setCards([]);
    startStream(
      { sessionId, mode: 'flashcards', count },
      {
        onComplete: () => {
          // Will be parsed from final content
        },
      }
    );
  };

  // Parse cards when streaming stops
  const displayCards = !isStreaming && content ? parseFlashcards(content) : [];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-xs text-gray-400 font-medium block mb-1">Number of cards</label>
          <select
            id="flashcard-count-select"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="input-field py-2 text-sm"
          >
            {[5, 8, 10, 15, 20].map((n) => (
              <option key={n} value={n}>{n} cards</option>
            ))}
          </select>
        </div>
        <button
          id="generate-flashcards-btn"
          onClick={generate}
          disabled={isStreaming || !sessionId}
          className="btn-primary mt-5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isStreaming ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
          ) : (
            <><Layers className="w-4 h-4" /> Generate</>
          )}
        </button>
      </div>

      {/* Loading state */}
      {isStreaming && (
        <div className="text-center py-8 text-gray-400 text-sm animate-pulse">
          <Layers className="w-8 h-8 mx-auto mb-2 text-brand-400" />
          <p>Generating {count} flashcards…</p>
          <p className="text-xs mt-1">Click on each card to reveal the answer</p>
        </div>
      )}

      {/* Cards grid */}
      {displayCards.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">{displayCards.length} cards · Click to flip</p>
            <button onClick={generate} className="btn-secondary py-1 px-3 text-xs">Regenerate</button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {displayCards.map((card, i) => (
              <FlashCard key={card.id} card={card} index={i} />
            ))}
          </div>
        </div>
      )}

      {!isStreaming && content && displayCards.length === 0 && (
        <div className="glass-card p-4 text-sm text-gray-300">
          <p className="text-yellow-400 mb-2">⚠️ Could not parse structured cards. Raw output:</p>
          <pre className="text-xs text-gray-400 whitespace-pre-wrap">{content}</pre>
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
