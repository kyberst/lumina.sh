import { useState, useRef, useEffect, useCallback } from 'react';
import { getLanguage } from '../services/i18n';

interface UseVoiceInputReturn {
  isListening: boolean;
  toggleListening: () => void;
  transcript: string;
  resetTranscript: () => void;
  error: string | null;
}

export const useVoiceInput = (): UseVoiceInputReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Stop after one sentence/pause for better UX in chat
      recognition.interimResults = true;
      recognition.lang = getLanguage() === 'es' ? 'es-ES' : 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        setError(event.error);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setError("Browser does not support Speech Recognition");
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        setError(null);
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        setIsListening(false);
      }
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => setTranscript(''), []);

  return { isListening, toggleListening, transcript, resetTranscript, error };
};