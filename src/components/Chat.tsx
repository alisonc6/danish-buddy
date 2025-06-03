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
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const startConversation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const initialMessage = getInitialMessage(topic);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: initialMessage,
          topic: topic,
          isPracticeMode: isPracticeMode
        }),
      });

      if (!response.ok) {
        throw new PracticeModeError('Failed to start conversation');
      }

      const data = await response.json();
      const newMessage: Message = {
        role: 'assistant',
        content: data.danishResponse,
        translation: data.englishTranslation
      };

      setMessages([newMessage]);
      if (!isMuted) {
        await playAudio(data.danishResponse);
      }
    } catch (error) {
      const errorMessage = handleError(error);
      setError(errorMessage);
      setMessages([{
        role: 'assistant',
        content: 'Beklager, der opstod en fejl. Prøv venligst igen.',
        translation: 'Sorry, an error occurred. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [topic, isPracticeMode, isMuted]);

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

  const playAudio = async (text: string) => {
    if (isMuted) return;
    
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        throw new AudioError('Failed to get audio response');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Clean up the URL when audio finishes playing
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (error) {
      if (!isMuted) {
        console.error('Error playing audio:', error);
        setError(handleError(error));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const userMessage: Message = {
        role: 'user',
        content: input,
        translation: input
      };
      setMessages(prev => [...prev, userMessage]);
      setInput('');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          topic: topic,
          isPracticeMode: isPracticeMode
        }),
      });

      if (!response.ok) {
        throw new PracticeModeError('Failed to get response from chatbot');
      }

      const data = await response.json();
      const newMessage: Message = {
        role: 'assistant',
        content: data.danishResponse,
        translation: data.englishTranslation
      };

      setMessages(prev => [...prev, newMessage]);
      if (!isMuted) {
        await playAudio(data.danishResponse);
      }
    } catch (error) {
      const errorMessage = handleError(error);
      setError(errorMessage);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Beklager, der opstod en fejl. Prøv venligst igen.',
        translation: 'Sorry, an error occurred. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const response = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process speech');
      }

      const { text } = await response.json();
      setInput(text);
      
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          topic: topic,
          isPracticeMode: isPracticeMode
        }),
      });

      if (!chatResponse.ok) {
        throw new PracticeModeError('Failed to get response from chatbot');
      }

      const data = await chatResponse.json();
      const newMessage: Message = {
        role: 'assistant',
        content: data.danishResponse,
        translation: data.englishTranslation
      };

      setMessages(prev => [...prev, newMessage]);
      if (!isMuted) {
        await playAudio(data.danishResponse);
      }
    } catch (error) {
      const errorMessage = handleError(error);
      setError(errorMessage);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Beklager, der opstod en fejl. Prøv venligst igen.',
        translation: 'Sorry, an error occurred. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
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
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <p>{message.content}</p>
                {message.role === 'assistant' && !isMuted && (
                  <button
                    onClick={() => playAudio(message.content)}
                    className="text-gray-600 hover:text-gray-800"
                    title="Play audio"
                  >
                    🔊
                  </button>
                )}
              </div>
              {message.translation && (
                <p className="text-sm mt-2 text-gray-500">
                  ({message.translation})
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <VoiceControls
            onRecordingComplete={handleRecordingComplete}
            isProcessing={isLoading}
          />
          <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-2 border rounded-lg"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 