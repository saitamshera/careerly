import { useState, useRef, useCallback, useEffect } from 'react';

const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const transcriptRef = useRef('');
  const lastRestartRef = useRef(0);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    setInterimText('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      setError('Speech Recognition is not supported in this browser.');
      return false;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setError('');
    isListeningRef.current = true;
    setIsListening(true);

    const initEngine = () => {
      if (!isListeningRef.current) return;
      try {
        if (recognitionRef.current) {
          const old = recognitionRef.current;
          recognitionRef.current = null;
          old.onend = null;
          old.onerror = null;
          old.onresult = null;
          try { old.abort(); } catch (_) {}
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          console.log('[SPEECH] onstart fired - mic engine live (lang: en-US)');
        };

        recognition.onresult = (event) => {
          let newFinal = '';
          let interim = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const res = event.results[i];
            const text = res[0]?.transcript || '';
            if (res.isFinal) {
              newFinal += (newFinal ? ' ' : '') + text.trim();
            } else {
              interim += (interim ? ' ' : '') + text.trim();
            }
          }

          if (newFinal) {
            const previous = transcriptRef.current.trim();
            console.log('[SPEECH] Previous accumulated:', previous, '| New incoming chunk:', newFinal);
            const combined = previous ? `${previous} ${newFinal}` : newFinal;
            transcriptRef.current = combined;
            setTranscript(combined);
          }

          setInterimText(interim);
        };

        recognition.onerror = (event) => {
          console.log('[SPEECH] onerror fired:', event.error);
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setError('Microphone access denied. Please allow microphone permissions in your browser URL bar.');
            stopListening();
          } else if (event.error === 'network') {
            setError('Voice recognition network error (Google Speech API unreachable). You can also type directly in the response box.');
            stopListening();
          }
        };

        recognition.onend = () => {
          console.log('[SPEECH] onend fired');
          // Only auto-reconnect if this is still the active instance and user hasn't stopped
          if (isListeningRef.current && recognitionRef.current === recognition) {
            const now = Date.now();
            if (now - lastRestartRef.current > 300) {
              lastRestartRef.current = now;
              setTimeout(() => {
                if (isListeningRef.current && recognitionRef.current === recognition) {
                  initEngine();
                }
              }, 150);
            }
          }
        };

        recognition.start();
        console.log('[SPEECH] start() called');
      } catch (err) {
        console.warn('[SPEECH] Recognition start error:', err);
      }
    };

    initEngine();
    return true;
  }, [stopListening]);

  const resetTranscript = useCallback(() => {
    transcriptRef.current = '';
    setTranscript('');
    setInterimText('');
  }, []);

  const setTranscriptManually = useCallback((text) => {
    transcriptRef.current = text;
    setTranscript(text);
  }, []);

  const speakText = useCallback(
    (text, onFinish) => {
      stopListening();
      if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) {
        if (onFinish) onFinish();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      let done = false;
      const finish = () => {
        if (!done) {
          done = true;
          if (onFinish) onFinish();
        }
      };
      utterance.onend = finish;
      utterance.onerror = finish;
      setTimeout(finish, Math.max(4000, text.length * 90));
      window.speechSynthesis.speak(utterance);
    },
    [stopListening]
  );

  useEffect(() => {
    return () => {
      stopListening();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [stopListening]);

  return {
    isListening,
    transcript,
    interimText,
    startListening,
    stopListening,
    resetTranscript,
    setTranscriptManually,
    speakText,
    error,
    setError
  };
}
