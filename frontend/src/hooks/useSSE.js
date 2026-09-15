import { useState, useCallback, useRef } from 'react';
import { streamChat } from '../services/api';

/**
 * useSSE - Custom hook for managing streaming AI responses
 * Returns { content, isStreaming, error, startStream, stopStream, reset }
 */
export function useSSE() {
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const startStream = useCallback((payload, { onStart, onComplete } = {}) => {
    // Cancel any existing stream
    if (abortRef.current) abortRef.current();

    setContent('');
    setError(null);
    setIsStreaming(true);
    onStart?.();

    const abort = streamChat(
      payload,
      // onDelta
      (delta) => {
        setContent((prev) => prev + delta);
      },
      // onDone
      () => {
        setIsStreaming(false);
        abortRef.current = null;
        onComplete?.();
      },
      // onError
      (err) => {
        setError(err.message);
        setIsStreaming(false);
        abortRef.current = null;
      }
    );

    abortRef.current = abort;
  }, []);

  const stopStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  const reset = useCallback(() => {
    if (abortRef.current) abortRef.current();
    setContent('');
    setError(null);
    setIsStreaming(false);
    abortRef.current = null;
  }, []);

  return { content, isStreaming, error, startStream, stopStream, reset };
}
