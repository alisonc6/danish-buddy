'use client';

import React, { useState, useEffect, useCallback, FormEvent, ChangeEvent } from 'react';
import type { Message, ChatProps } from '@/types';
import dynamic from 'next/dynamic';

const VoiceControls = dynamic(() => import('./VoiceControls').then(mod => mod.VoiceControls), {
  ssr: false
});

export default function Chat({ topic, isPracticeMode = false, isMuted = false }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const playAudio = useCallback(async (audioUrl: string) => {
    try {
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setError('Failed to play audio');
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
          topic: topic.id,
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
        translation: data.englishTranslation,
        audioUrl: data.audioUrl
      }]);

      if (!isMuted && data.audioUrl) {
        await playAudio(data.audioUrl);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  }, [topic.id, isPracticeMode, isMuted, playAudio]);

  useEffect(() => {
    startConversation();
  }, [startConversation]);

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      setError(null);
      const userMessage = input.trim();
      setInput('');
      setMessages((prev: Message[]) => [...prev, { role: 'user', content: userMessage }]);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          topic: topic.id,
          isPracticeMode
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setMessages((prev: Message[]) => [...prev, { 
        role: 'assistant', 
        content: data.danishResponse,
        translation: data.englishTranslation,
        audioUrl: data.audioUrl
      }]);

      if (!isMuted && data.audioUrl) {
        await playAudio(data.audioUrl);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  }, [input, topic.id, isPracticeMode, isMuted, playAudio]);

  const handleRecordingComplete = async (audioBlob: Blob) => {
    try {
      setIsProcessing(true);
      setError(null);

      // Get transcription
      const transcriptionResponse = await fetch('/api/speech-to-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'audio/webm',
        },
        body: audioBlob,
      });

      if (!transcriptionResponse.ok) {
        const errorData = await transcriptionResponse.json();
        throw new Error(errorData.error || 'Failed to transcribe audio');
      }

      const { text } = await transcriptionResponse.json();
      setMessages((prev: Message[]) => [...prev, { role: 'user', content: text }]);

      // Get chat response
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text,
          topic: topic.id,
          isPracticeMode
        }),
      });

      if (!chatResponse.ok) {
        const errorData = await chatResponse.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await chatResponse.json();
      setMessages((prev: Message[]) => [...prev, { 
        role: 'assistant', 
        content: data.danishResponse,
        translation: data.englishTranslation,
        audioUrl: data.audioUrl
      }]);

      if (!isMuted && data.audioUrl) {
        await playAudio(data.audioUrl);
      }
    } catch (error) {
      console.error('Recording error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      setMessages((prev: Message[]) => [...prev, {
        role: 'assistant',
        content: 'Beklager, der opstod en fejl. Prøv venligst igen.',
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
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message: Message, index: number) => (
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
              {message.translation && (
                <p className="mt-2 text-sm text-gray-600">{message.translation}</p>
              )}
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
              onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
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