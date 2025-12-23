
import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { decode, decodeAudioData, createPcmBlob } from '../lib/audioUtils';
import { CaptionSegment } from '../types';

interface UseGeminiLiveProps {
  apiKey: string;
  enabled: boolean;
  sourceLang: string;
  targetLang: string;
  onCaption: (caption: CaptionSegment) => void;
  onAudioChunk?: (buffer: AudioBuffer) => void;
}

export function useGeminiLive({
  apiKey,
  enabled,
  sourceLang,
  targetLang,
  onCaption,
  onAudioChunk
}: UseGeminiLiveProps) {
  const [isConnected, setIsConnected] = useState(false);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputNodeRef = useRef<GainNode | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  
  const currentTranscriptionRef = useRef('');

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close?.();
      sessionRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
    }
    setIsConnected(false);
  }, []);

  const startSession = useCallback(async () => {
    if (!apiKey || !enabled) return;

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = audioCtx;
      outputAudioContextRef.current = outAudioCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioCtx.createMediaStreamSource(stream);
      const scriptProcessor = audioCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = scriptProcessor;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Gemini Live session opened');
            setIsConnected(true);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const b64Data = createPcmBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  media: {
                    data: b64Data,
                    mimeType: 'audio/pcm;rate=16000'
                  }
                });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle output transcription
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              currentTranscriptionRef.current += text;
            }

            if (message.serverContent?.turnComplete) {
              const fullText = currentTranscriptionRef.current.trim();
              if (fullText) {
                onCaption({
                  id: Date.now().toString(),
                  speakerId: 'gemini',
                  speakerName: 'Translator',
                  text: fullText,
                  timestamp: Date.now()
                });
              }
              currentTranscriptionRef.current = '';
            }

            // Handle audio output
            const audioDataB64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioDataB64 && onAudioChunk && outputAudioContextRef.current) {
              const audioBytes = decode(audioDataB64);
              const buffer = await decodeAudioData(audioBytes, outputAudioContextRef.current, 24000, 1);
              onAudioChunk(buffer);
            }
          },
          onerror: (err) => {
            console.error('Gemini Live error:', err);
            stopSession();
          },
          onclose: () => {
            console.log('Gemini Live session closed');
            setIsConnected(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          outputAudioTranscription: {},
          systemInstruction: `You are a real-time meeting interpreter.
          Translate audio from ${sourceLang} to ${targetLang}.
          Rules:
          - Translate faithfully, matching pace and tone.
          - No extra commentary or summaries.
          - Output only the translation.
          - Keep it short like a professional interpreter.`
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Failed to start Gemini Live:', err);
      setIsConnected(false);
    }
  }, [apiKey, enabled, sourceLang, targetLang, onCaption, onAudioChunk, stopSession]);

  useEffect(() => {
    if (enabled) {
      startSession();
    } else {
      stopSession();
    }
    return () => stopSession();
  }, [enabled, startSession, stopSession]);

  return { isConnected };
}
