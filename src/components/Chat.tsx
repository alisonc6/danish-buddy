'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Message } from '../types';
import { VoiceControls } from './VoiceControls';
import { 
  handleError, 
  AudioError, 
  PracticeModeError, 
  isNetworkError 
} from '../utils/errorHandling';

interface ChatProps {
  topic: string;
  isPracticeMode?: boolean;
  isMuted?: boolean;
}

export default function Chat({ topic, isPracticeMode = false, isMuted = false }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const playAudio = useCallback(async (audioUrl: string) => {
    try {
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setError(handleError(new AudioError('Failed to play audio')));
    }
  }, []);

  const startConversation = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: 'Start conversation',
          topic,
          isPracticeMode
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const data = await response.json();
      setMessages([{ 
        role: 'assistant', 
        content: data.danishResponse,
        audioUrl: data.audioUrl
      }]);

      if (!isMuted && data.audioUrl) {
        await playAudio(data.audioUrl);
      }
    } catch (error) {
      setError(handleError(error));
    }
  }, [topic, isPracticeMode, isMuted, playAudio]);

  useEffect(() => {
    // Start conversation when component mounts
    startConversation();
  }, [startConversation]);

  const getInitialMessage = (topic: string): string => {
    const topicMessages: Record<string, string> = {
      'weather': 'Hej! Lad os snakke om vejret. Hvordan er vejret i dag?',
      'sports': 'Hej! Lad os snakke om sport. Hvilken sport kan du lide?',
      'current-events': 'Hej! Lad os snakke om aktuelle begivenheder. Hvad interesserer dig?',
      'vacation': 'Hej! Lad os snakke om ferier. Hvor vil du gerne på ferie?',
      'shopping': 'Hej! Lad os snakke om shopping. Hvad kan du lide at købe?',
      'restaurants': 'Hej! Lad os snakke om restauranter og caféer. Hvilken type mad kan du lide?'
    };

    return topicMessages[topic] || 'Hej! Lad os begynde samtalen.';
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      setError(null);
      const userMessage = input.trim();
      setInput('');
      setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          topic,
          isPracticeMode
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.danishResponse,
        audioUrl: data.audioUrl
      }]);

      if (!isMuted && data.audioUrl) {
        await playAudio(data.audioUrl);
      }
    } catch (error) {
      setError(handleError(error));
    }
  }, [input, topic, isPracticeMode, isMuted, playAudio]);

  const handleRecordingComplete = async (audioBlob: Blob) => {
    try {
      setIsProcessing(true);
      setError(null);

      // Get transcription
      const transcriptionResponse = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: audioBlob,
      });

      if (!transcriptionResponse.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const { text } = await transcriptionResponse.json();
      setMessages(prev => [...prev, { role: 'user', content: text }]);

      // Get chat response
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text,
          topic,
          isPracticeMode
        }),
      });

      if (!chatResponse.ok) {
        throw new Error('Failed to get response');
      }

      const data = await chatResponse.json();
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.danishResponse,
        audioUrl: data.audioUrl
      }]);

      if (!isMuted && data.audioUrl) {
        await playAudio(data.audioUrl);
      }
    } catch (error) {
      setError(handleError(error));
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Beklager, der opstod en fejl. Prøv venligst igen.',
        audioUrl: undefined
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4">
          {error}
          {isNetworkError(error) && (
            <p className="text-sm mt-1">
              Please check your internet connection and try again.
            </p>
          )}
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p>{message.content}</p>
              {message.role === 'assistant' && message.audioUrl && !isMuted && (
                <button
                  onClick={() => playAudio(message.audioUrl!)}
                  className="mt-2 text-blue-500 hover:text-blue-700"
                >
                  🔊 Play
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <VoiceControls
            onRecordingComplete={handleRecordingComplete}
            isProcessing={isProcessing}
          />
          <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-2 border rounded-lg"
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={isProcessing}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
            >
              {isProcessing ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 