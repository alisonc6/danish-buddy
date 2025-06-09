'use client';

import React, { useState, useEffect, useCallback, FormEvent, ChangeEvent, useRef } from 'react';
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

  const hasStartedConversation = useRef(false);
  const lastPlayedIndex = useRef(-1);

  const playAudio = useCallback(async (audioUrl: string) => {
    try {
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setError('Failed to play audio');
    }
  }, []);

  const sendMessage = useCallback(async (message: string, customHistory?: {role: string, content: string}[]) => {
    try {
      setError(null);
      setIsProcessing(true);

      // Use customHistory if provided, otherwise use messages
      const conversationHistory = customHistory ?? messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message,
          topic: topic.id,
          isPracticeMode,
          conversationHistory
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { 
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
    } finally {
      setIsProcessing(false);
    }
  }, [messages, topic.id, isPracticeMode, isMuted, playAudio]);

  const startConversation = useCallback(async () => {
    try {
      setError(null);
      await sendMessage('Start conversation');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  }, [sendMessage]);

  useEffect(() => {
    console.log('[Chat] useEffect triggered. messages.length:', messages.length, 'topic:', topic.id, 'hasStartedConversation:', hasStartedConversation.current);
    if (messages.length === 0 && !hasStartedConversation.current) {
      hasStartedConversation.current = true;
      startConversation();
    }
    // Only run when topic changes or on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (
      lastMsg.role === 'assistant' &&
      lastMsg.audioUrl &&
      !isMuted &&
      lastPlayedIndex.current !== messages.length - 1
    ) {
      // Play the Danish audio
      const audio = new Audio(lastMsg.audioUrl);
      audio.play();
      lastPlayedIndex.current = messages.length - 1;
    }
  }, [messages, isMuted]);

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    // Build the new conversation history including the new user message
    const newHistory = [...messages, { role: 'user', content: userMessage }].map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    await sendMessage(userMessage, newHistory);
  }, [input, messages, sendMessage]);

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
      // Build the new conversation history including the new user message
      const newHistory = [...messages, { role: 'user', content: text }].map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      setMessages(prev => [...prev, { role: 'user', content: text }]);
      await sendMessage(text, newHistory);
    } catch (error) {
      console.error('Recording error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Beklager, der opstod en fejl. Prøv venligst igen.',
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Status bar with topic and mute status */}
      <div className="status-bar mb-2">
        <span className="status-badge">{topic.title}</span>
        {isMuted && <span className="status-badge">🔇 Muted</span>}
      </div>
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
              className={
                message.role === 'user'
                  ? 'chat-bubble-user'
                  : 'chat-bubble-bot'
              }
            >
              <p>{message.content}</p>
              {/* Only show English translation as text, never spoken */}
              {message.translation && (
                <p className="mt-2 text-sm text-gray-600">{message.translation}</p>
              )}
              {/* Play button for Danish audio only */}
              {message.role === 'assistant' && message.audioUrl && (
                <button
                  onClick={() => {
                    const audio = new Audio(message.audioUrl!);
                    audio.play();
                  }}
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