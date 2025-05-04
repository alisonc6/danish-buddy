'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import debugLog from '../utils/debug'
import { GoogleSpeechService } from '../utils/googleSpeechService';
import { Message, ProcessingState, PerformanceMetrics } from '../types';
import AudioLevelIndicator from './AudioLevelIndicator';

export default function ChatInterface({ topic }: { topic: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    transcribing: false,
    thinking: false,
    speaking: false
  });
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [speechService] = useState<GoogleSpeechService>(() => new GoogleSpeechService());

  const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({
    audio: true,
    onStop: (blobUrl: string, blob: Blob) => handleAudioStop(blob),
  });

  const performanceMetrics = useRef<PerformanceMetrics>({
    recordingStart: 0,
    transcriptionStart: 0,
    chatStart: 0,
    responseStart: 0
  });

  const setupAudioAnalyser = (stream: MediaStream): void => {
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

  const updateAudioLevel = (): void => {
    if (audioAnalyserRef.current && isRecording) {
      const dataArray = new Uint8Array(audioAnalyserRef.current.frequencyBinCount);
      audioAnalyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const normalizedLevel = Math.min(average / 128, 1);
      setAudioLevel(normalizedLevel);
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  };

  const handleRecordingToggle = (): void => {
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

  const handleAudioStop = async (audioBlob: Blob): Promise<void> => {
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

  const speakDanish = async (text: string, translation?: string): Promise<void> => {
    try {
      setIsSpeaking(true);
      
      const audioContent = await speechService.synthesizeSpeech(text);
      await playAudio(audioContent);

      if (translation) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const translationAudio = await speechService.synthesizeSpeech(
          translation,
          `en_${translation}`
        );
        await playAudio(translationAudio);
      }
    } catch (error) {
      console.error('Speech failed:', error);
      debugLog.error(error, 'Speech synthesis failed');
    } finally {
      setIsSpeaking(false);
    }
  };

  const playAudio = async (audioContent: ArrayBuffer): Promise<void> => {
    const blob = new Blob([audioContent], { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    
    try {
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve();
        audio.onerror = () => reject();
        audio.play();
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const sendMessage = async (content: string): Promise<void> => {
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
              <p>{message.content}</p>
              {message.translation && (
                <p className="text-sm mt-2 opacity-80">{message.translation}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRecordingToggle}
            className={`p-2 rounded-full ${
              isRecording
                ? 'bg-red-500 text-white'
                : 'bg-blue-500 text-white'
            }`}
            disabled={processingState.transcribing || processingState.thinking}
          >
            {isRecording ? '⏹️' : '🎤'}
          </button>
          {isRecording && <AudioLevelIndicator level={audioLevel} />}
          {(processingState.transcribing || processingState.thinking) && (
            <span className="text-gray-500">Processing...</span>
          )}
        </div>
      </div>
    </div>
  );
}