import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { decode } from '../lib/audioUtils';
import { PCMPlayer } from '../lib/PCMPlayer';

interface CaptionTranslatorOptions {
  apiKey: string;
  enabled: boolean;
  sourceLang: string;
  targetLang: string;
  voiceName?: string;
}

export function useCaptionTranslator({
  apiKey,
  enabled,
  sourceLang,
  targetLang,
  voiceName = 'Kore'
}: CaptionTranslatorOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const sessionRef = useRef<any>(null);
  const pcmPlayerRef = useRef<PCMPlayer | null>(null);
  const queueRef = useRef<string[]>([]);
  const isSendingRef = useRef(false);

  const stopSession = useCallback(() => {
    if (sessionRef.current?.close) {
      sessionRef.current.close();
    }
    sessionRef.current = null;
    isSendingRef.current = false;
    queueRef.current = [];
    pcmPlayerRef.current?.stop();
    setIsConnected(false);
  }, []);

  const sendNext = useCallback(() => {
    const session = sessionRef.current;
    if (!session || isSendingRef.current) return;
    const nextText = queueRef.current.shift();
    if (!nextText) return;
    isSendingRef.current = true;

    if (typeof session.sendRealtimeInput === 'function') {
      session.sendRealtimeInput({ text: nextText });
    } else if (typeof session.send === 'function') {
      session.send({ text: nextText });
    }
  }, []);

  const enqueueCaption = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    queueRef.current.push(trimmed);
    sendNext();
  }, [sendNext]);

  const startSession = useCallback(async () => {
    if (!apiKey || !enabled) return;

    try {
      const ai = new GoogleGenAI({ apiKey });
      if (!pcmPlayerRef.current) {
        pcmPlayerRef.current = new PCMPlayer(24000);
      }

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            sendNext();
          },
          onmessage: (message: LiveServerMessage) => {
            const parts = message.serverContent?.modelTurn?.parts || [];
            parts.forEach((part) => {
              const audioDataB64 = part.inlineData?.data;
              if (audioDataB64 && pcmPlayerRef.current) {
                const audioBytes = decode(audioDataB64);
                void pcmPlayerRef.current.playRaw(audioBytes, 1);
              }
            });

            if (message.serverContent?.turnComplete) {
              isSendingRef.current = false;
              sendNext();
            }
          },
          onerror: (err) => {
            console.error('Caption translator error:', err);
            stopSession();
          },
          onclose: () => {
            setIsConnected(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } }
          },
          systemInstruction: `You are a real-time meeting interpreter.
Translate the incoming caption text from ${sourceLang} to ${targetLang}.
If the text is already in ${targetLang}, preserve meaning and speak it naturally.
Rules:
- Output spoken audio only.
- Keep responses short and aligned to the incoming caption.
- Do not add commentary or summaries.`
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Failed to start caption translator:', err);
      setIsConnected(false);
    }
  }, [apiKey, enabled, sourceLang, targetLang, voiceName, sendNext, stopSession]);

  useEffect(() => {
    if (enabled) {
      startSession();
    } else {
      stopSession();
    }
    return () => stopSession();
  }, [enabled, startSession, stopSession]);

  return { isConnected, enqueueCaption };
}
