import { useState } from 'react';

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  return { isListening, setIsListening, transcript, setTranscript };
}
