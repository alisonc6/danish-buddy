'use client';

import { useState, useEffect, useRef } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import { debugLog } from '../utils/debug';
import { GoogleSpeechService } from '../utils/googleSpeechService';
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
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [speechService] = useState(() => new GoogleSpeechService());

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

  const setupAudioAnalyser = (stream: MediaStream) => {
    if (!audioContext) {
      const newAudioContext = new AudioContext();
      setAudioContext(newAudioContext);
      const analyser = newAudioContext.createAnalyser();
      const source = newAudioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      audioAnalyserRef.current = analyser;
      updateAudioLevel();
    }
  };

  const updateAudioLevel = () => {
    if (audioAnalyserRef.current && isRecording) {
      const dataArray = new Uint8Array(audioAnalyserRef.current.frequencyBinCount);
      audioAnalyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const normalizedLevel = Math.min(average / 128, 1);
      setAudioLevel(normalizedLevel);
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  };

  const handleRecordingToggle = () => {
    if (!isRecording) {
      performanceMetrics.current.recordingStart = Date.now();
      setIsRecording(true);
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          setupAudioAnalyser(stream);
          startRecording();
        })
        .catch(error => {
          debugLog.error(error, 'Failed to get audio stream');
          setIsRecording(false);
        });
    } else {
      setIsRecording(false);
      stopRecording();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setAudioLevel(0);
    }
  };

  const handleAudioStop = async (audioBlob: Blob) => {
    if (!audioBlob) return;
    
    performanceMetrics.current.transcriptionStart = Date.now();
    setProcessingState(prev => ({ ...prev, transcribing: true }));
    
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const text = await speechService.transcribeSpeech(arrayBuffer);
      
      if (text) {
        debugLog.transcription('Transcription received', { text });
        await sendMessage(text);
      }
    } catch (error) {
      debugLog.error(error, 'Transcription Failed');
    } finally {
      setProcessingState(prev => ({ ...prev, transcribing: false }));
    }
  };

  const speakDanish = async (text: string, translation?: string) => {
    try {
      setIsSpeaking(true);
      
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, translation }),
      });

      if (!response.ok) throw new Error('TTS failed');
      
      const audioContent = await response.arrayBuffer();
      await playAudio(audioContent);

      if (translation) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const translationResponse = await fetch('/api/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: translation }),
        });
        
        if (!translationResponse.ok) throw new Error('Translation TTS failed');
        
        const translationAudio = await translationResponse.arrayBuffer();
        await playAudio(translationAudio);
      }
    } catch (error) {
      console.error('Speech failed:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const playAudio = async (audioContent: ArrayBuffer) => {
    const blob = new Blob([audioContent], { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    
    try {
      await new Promise((resolve, reject) => {
        audio.onended = resolve;
        audio.onerror = reject;
        audio.play();
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const sendMessage = async (content: string) => {
    performanceMetrics.current.chatStart = Date.now();
    debugLog.chat('Sending message', { content, topic });

    try {
      setProcessingState(prev => ({ ...prev, thinking: true }));
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content, topic }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      performanceMetrics.current.responseStart = Date.now();
      
      const newMessages: Message[] = [
        { role: 'user', content },
        { role: 'assistant', content: data.content, translation: data.translation }
      ];
      
      setMessages(prev => [...prev, ...newMessages]);
      
      if (data.content) {
        await speakDanish(data.content, data.translation);
      }
      
    } catch (error) {
      console.error('Failed to send message:', error);
      debugLog.error(error, 'Chat API call failed');
    } finally {
      setProcessingState(prev => ({ ...prev, thinking: false }));
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p>{message.content}</p>
                  {message.translation && (
                    <p className="text-sm mt-2 opacity-80">{message.translation}</p>
                  )}
                </div>
                {message.role === 'assistant' && (
                  <button
                    onClick={() => speakDanish(message.content, message.translation)}
                    className="ml-2 p-2 text-gray-600 hover:text-blue-500"
                    disabled={isSpeaking}
                  >
                    🔊
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t">
        <form onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage(input);
            setInput('');
          }
        }} className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-2 border rounded-lg"
            placeholder="Type your message..."
            disabled={processingState.thinking}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
            disabled={!input.trim() || processingState.thinking}
          >
            Send
          </button>
          <button
            onClick={handleRecordingToggle}
            type="button"
            className={`p-2 rounded-full ${
              isRecording ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
            }`}
            disabled={processingState.transcribing || processingState.thinking}
          >
            {isRecording ? '⏹️' : '🎤'}
          </button>
          {isRecording && <AudioLevelIndicator level={audioLevel} />}
          {(processingState.transcribing || processingState.thinking) && (
            <span className="text-gray-500">Processing...</span>
          )}
        </form>
      </div>
    </div>
  );
}