'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { VoiceControls } from './VoiceControls';

interface ChatProps {
  topic: string;
}

export default function Chat({ topic }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Start conversation when component mounts
    startConversation();
  }, [topic]);

  const startConversation = async () => {
    setIsLoading(true);
    try {
      const initialMessage = getInitialMessage(topic);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: initialMessage,
          topic: topic
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const data = await response.json();
      const newMessage: Message = {
        role: 'assistant',
        content: data.danishResponse,
        translation: data.englishTranslation
      };

      setMessages([newMessage]);
      await playAudio(data.danishResponse);
    } catch (error) {
      console.error('Error starting conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const playAudio = async (text: string) => {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get audio: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          URL.revokeObjectURL(audioUrl);
        };
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          topic: topic
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const newMessage: Message = {
        role: 'assistant',
        content: data.danishResponse,
        translation: data.englishTranslation
      };

      setMessages(prev => [...prev, newMessage]);
      await playAudio(data.danishResponse);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setIsLoading(true);
    try {
      // Create FormData and append the audio blob
      const formData = new FormData();
      formData.append('audio', audioBlob);

      // Send audio to speech-to-text API
      const response = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const { text } = await response.json();
      
      // Add user's transcribed message to the chat
      const userMessage: Message = {
        role: 'user',
        content: text,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, userMessage]);

      // Send the transcribed text to the chatbot
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          topic: topic
        }),
      });

      if (!chatResponse.ok) {
        throw new Error('Failed to get response from chatbot');
      }

      const data = await chatResponse.json();
      const newMessage: Message = {
        role: 'assistant',
        content: data.danishResponse,
        translation: data.englishTranslation
      };

      setMessages(prev => [...prev, newMessage]);
      await playAudio(data.danishResponse);
    } catch (error) {
      console.error('Error processing audio:', error);
      // Add error message to chat
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
                {message.role === 'assistant' && (
                  <button
                    onClick={() => playAudio(message.content)}
                    className="text-gray-600 hover:text-gray-800"
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
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <VoiceControls
            onRecordingComplete={handleRecordingComplete}
            onPlaybackComplete={() => {}}
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
              Send
            </button>
          </form>
        </div>
      </div>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
} 