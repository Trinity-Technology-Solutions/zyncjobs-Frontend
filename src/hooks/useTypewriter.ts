import { useState, useRef, useCallback } from 'react';

// Streams full text word-by-word for perceived speed
export function useTypewriter() {
  const [streamingText, setStreamingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const typeText = useCallback((fullText: string, onDone?: () => void) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStreamingText('');
    setIsTyping(true);
    const words = fullText.split(' ');
    let i = 0;
    const step = () => {
      if (i >= words.length) {
        setIsTyping(false);
        onDone?.();
        return;
      }
      setStreamingText(words.slice(0, i + 1).join(' '));
      i++;
      // Faster for longer texts to avoid feeling slow
      const delay = fullText.length > 300 ? 12 : 20;
      timerRef.current = setTimeout(step, delay);
    };
    step();
  }, []);

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsTyping(false);
  }, []);

  return { streamingText, isTyping, typeText, cancel };
}
