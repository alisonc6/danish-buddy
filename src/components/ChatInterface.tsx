'use client';

import { useState, useEffect, useRef } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import { debugLog } from '../utils/debug';
import '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  translation?: string;
}

const AudioLevelIndicator = ({ level }: { level: number }) => (
  <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
    <div 
      className="h-full bg-blue-500 transition-all duration-100"
      style={{ width: `${level * 100}%` }}
    />
  </div>
);

export default function ChatInterface({ topic }: { topic: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [processingState, setProcessingState] = useState({
    transcribing: false,
    thinking: false,
    speaking: false
  });
  const [currentWord, setCurrentWord] = useState<number | null>(null);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [danishVoice, setDanishVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({
    audio: true,
    onStop: (blobUrl, blob) => handleAudioStop(blob),
  });

  const performanceMetrics = useRef({
    recordingStart: 0,
    transcriptionStart: 0,
    chatStart: 0,
    responseStart: 0
  });

  // Utility function to write strings to DataView
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // WAV header writing utility
  const writeWavHeader = (view: DataView, length: number, channels: number, sampleRate: number) => {
    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(view, 8, 'WAVE');
    
    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * 2, true);
    view.setUint16(32, channels * 2, true);
    view.setUint16(34, 16, true);
    
    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, length * 2, true);
  };

  // Audio compression utility
  const compressAudioBlob = async (blob: Blob): Promise<Blob> => {
    if (blob.size < 1024 * 1024) return blob;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (!audioContext || !e.target?.result) {
          resolve(blob);
          return;
        }

        const arrayBuffer = e.target.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const offlineContext = new OfflineAudioContext(
          1,
          audioBuffer.length,
          16000
        );

        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineContext.destination);
        source.start();

        const renderedBuffer = await offlineContext.startRendering();
        
        const wavBlob = await new Promise<Blob>((resolve) => {
          const channels = renderedBuffer.numberOfChannels;
          const length = renderedBuffer.length * channels * 2;
          const buffer = new ArrayBuffer(44 + length);
          const view = new DataView(buffer);
          
          writeWavHeader(view, renderedBuffer.length, renderedBuffer.numberOfChannels, renderedBuffer.sampleRate);
          
          const offset = 44;
          for (let i = 0; i < renderedBuffer.length; i++) {
            for (let channel = 0; channel < channels; channel++) {
              const sample = renderedBuffer.getChannelData(channel)[i];
              view.setInt16(offset + (i * channels + channel) * 2, sample * 0x7FFF, true);
            }
          }
          
          resolve(new Blob([buffer], { type: 'audio/wav' }));
        });

        resolve(wavBlob);
      };
      reader.readAsArrayBuffer(blob);
    });
  };

  // Retry mechanism for transcription
  const retryTranscription = async (audioBlob: Blob, retryCount = 0): Promise<string | null> => {
    if (retryCount >= 3) {
      debugLog.error(new Error('Max retry attempts reached'), 'Transcription retry limit');
      return null;
    }

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ audio: audioBlob }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const { text } = await response.json();
      return text;
    } catch (error: unknown) {
      debugLog.error(error, `Transcription attempt ${retryCount + 1} failed`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return retryTranscription(audioBlob, retryCount + 1);
    }
  };

  // Speech synthesis implementation
  const speakDanish = async (text: string, translation?: string) => {
    if (!speechSynthesis || !danishVoice) {
      debugLog.error(new Error('Speech synthesis not available'), 'Speech Synthesis');
      return;
    }

    // Fix for Chrome's speech synthesis pause bug
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
    }

    speechSynthesis.cancel();

    console.log('Speaking text:', { text, translation }); // Debug log

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = danishVoice;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.lang = danishVoice.lang;
    
    debugLog.speech('Speaking Danish', { text, translation });
    
    return new Promise<void>((resolve) => {
      utterance.onend = () => {
        setIsSpeaking(false);
        debugLog.speech('Speech completed');
        
        // If there's a translation, speak it after a pause
        if (translation) {
          setTimeout(() => {
            const translationUtterance = new SpeechSynthesisUtterance(translation);
            translationUtterance.lang = 'en-US';
            speechSynthesis.speak(translationUtterance);
          }, 1000);
        }
        
        resolve();
      };
      
      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        console.error('Speech error:', event); // Debug log
        debugLog.error(event, 'Speech synthesis error');
        setIsSpeaking(false);
        resolve();
      };

      setIsSpeaking(true);
      speechSynthesis.speak(utterance);
    });
  };

  // Message sending implementation
  const sendMessage = async (content: string) => {
    performanceMetrics.current.chatStart = Date.now();
    debugLog.chat('Sending message', { content, topic });

    try {
      setProcessingState(prev => ({ ...prev, thinking: true }));
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, topic }),
      });
      
      const data = await response.json();
      console.log('Bot response received:', data); // Debug log

      debugLog.timing(
        performanceMetrics.current.chatStart,
        'Chat Response Duration'
      );

      setMessages(prev => [...prev, 
        { role: 'user', content: content },
        data.message
      ]);

      // Debug log before checking assistant role
      console.log('Checking assistant response:', {
        role: data.message.role,
        content: data.message.content
      });

      if (data.message.role === 'assistant') {
        console.log('Assistant message received:', data.message); // Debug log
        performanceMetrics.current.responseStart = Date.now();
        
        debugLog.speech('Starting speech', { 
          content: data.message.content,
          translation: data.message.translation 
        });
        
        setProcessingState(prev => ({ ...prev, speaking: true }));
        try {
          await speakDanish(data.message.content, data.message.translation);
        } catch (error) {
          console.error('Speech failed:', error);
          debugLog.error(error, 'Speech synthesis failed');
        }
        
        debugLog.timing(
          performanceMetrics.current.responseStart,
          'Speech Duration'
        );
      } else {
        console.log('Non-assistant message, skipping speech'); // Debug log
      }
    } catch (error: unknown) {
      console.error('Chat request failed:', error); // Debug log
      debugLog.error(error, 'Chat Request Failed');
    } finally {
      setProcessingState(prev => ({ 
        ...prev, 
        thinking: false,
        speaking: false 
      }));
    }
  };

  // Audio setup
  const setupAudioAnalyser = (stream: MediaStream) => {
    if (!audioContext) return;
    
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    audioAnalyserRef.current = analyser;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const updateAudioLevel = () => {
      if (!isRecording) {
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        setAudioLevel(0);
        return;
      }

      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
      const normalizedLevel = Math.min(average / 128, 1);
      setAudioLevel(normalizedLevel);
      
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    };

    updateAudioLevel();
  };

  // Recording handler
  const handleRecordingToggle = () => {
    if (!mediaRecorder) {
      debugLog.error(new Error('MediaRecorder not initialized'), 'Recording');
      return;
    }

    if (isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      debugLog.transcription('Recording stopped');
    } else {
      performanceMetrics.current.recordingStart = Date.now();
      mediaRecorder.start();
      setIsRecording(true);
      debugLog.transcription('Recording started');
    }
  };

  // Audio stop handler
  const handleAudioStop = async (audioBlob: Blob) => {
    setProcessingState(prev => ({ ...prev, transcribing: true }));
    performanceMetrics.current.transcriptionStart = Date.now();
    debugLog.transcription('Starting transcription', { 
      blobSize: audioBlob.size,
      type: audioBlob.type
    });

    try {
      const optimizedBlob = await compressAudioBlob(audioBlob);
      const text = await retryTranscription(optimizedBlob);
      
      if (text) {
        debugLog.transcription('Transcription received', { text });
        await sendMessage(text);
      }
    } catch (error: unknown) {
      debugLog.error(error, 'Transcription Failed');
    } finally {
      setProcessingState(prev => ({ ...prev, transcribing: false }));
    }
  };

  // Effect for initial message
  useEffect(() => {
    if (messages.length === 0) {
      sendMessage('Start conversation');
    }
  }, []);

  // Effect for chat scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Effect for speech synthesis setup
  useEffect(() => {
    const checkVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const synth = window.speechSynthesis;
        setSpeechSynthesis(synth);
        
        const voices = synth.getVoices();
        console.log('Available voices:', voices.map(v => ({
          name: v.name,
          lang: v.lang,
          default: v.default
        })));
        
        const daVoice = voices.find(voice => 
          voice.lang.startsWith('da') || 
          voice.lang.startsWith('nb') || 
          voice.lang.startsWith('sv')    
        );
        
        if (daVoice) {
          setDanishVoice(daVoice);
          debugLog.speech('Danish voice loaded', { voice: daVoice.name });
        }
      }
    };

    // Check immediately if speechSynthesis is available
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      checkVoices();

      // Also check when voices are loaded
      window.speechSynthesis.onvoiceschanged = checkVoices;

      return () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
    }
  }, []);

  // Effect for audio setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initAudio = async () => {
        try {
          const context = new (window.AudioContext || (window as any).webkitAudioContext)();
          setAudioContext(context);
          
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const recorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm',
            audioBitsPerSecond: 16000
          });
          
          setMediaRecorder(recorder);
          setupAudioAnalyser(stream);
          debugLog.transcription('Audio system initialized');
        } catch (error: unknown) {
          debugLog.error(error, 'Audio initialization failed');
        }
      };

      initAudio();

      return () => {
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContext) {
          audioContext.close();
        }
      };
    }
  }, []);

  return (
    <div className="flex flex-col h-[80vh]">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 ${
              message.role === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <div className={`inline-block p-3 rounded-lg ${
              message.role === 'user' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200'
            }`}>
              <div>
                <p>{message.content}</p>
                {message.translation && (
                  <p className="text-sm text-gray-600">({message.translation})</p>
                )}
              </div>
            </div>
            <button
              onClick={() => speakDanish(message.content, message.translation)}
              className={`ml-2 p-1 rounded-full ${isSpeaking ? 'text-blue-500' : 'text-gray-500'} hover:text-blue-600`}
              title="Listen"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.343 9.657a4 4 0 105.657 5.657M8.464 8.464a5 5 0 017.072 0"
                />
              </svg>
            </button>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 border rounded-lg px-4 py-2"
            placeholder="Skriv din besked..."
          />
          <div className="flex gap-2 items-center">
            <button
              onClick={handleRecordingToggle}
              className={`p-2 rounded-full relative ${
                isRecording ? 'bg-red-500' : 'bg-gray-200'
              }`}
              title={isRecording ? 'Stop Recording' : 'Start Recording'}
              disabled={processingState.transcribing}
            >
              <svg
                className={`w-6 h-6 ${isRecording ? 'text-white' : 'text-gray-600'}`}
                fill="none"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
              {processingState.transcribing && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500" />
                </div>
              )}
            </button>
            {isRecording && (
              <div className="flex-1 max-w-[200px]">
                <AudioLevelIndicator level={audioLevel} />
              </div>
            )}
            <button
              onClick={() => {
                if (input.trim()) {
                  sendMessage(input);
                  setInput('');
                }
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}