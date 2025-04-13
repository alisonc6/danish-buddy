'use client';

import { useState, useEffect, useRef } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  translation?: string;
}

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

  const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({
    audio: true,
    onStop: (blobUrl, blob) => handleAudioStop(blob),
  });

  useEffect(() => {
    if (messages.length === 0) {
      sendMessage('Start conversation');
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAudioStop = async (audioBlob: Blob) => {
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result;
      try {
        const response = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audio: base64Audio }),
        });
        const { text } = await response.json();
        if (text) {
          sendMessage(text);
        }
      } catch (error) {
        console.error('Error transcribing audio:', error);
      }
    };
  };

  const sendMessage = async (content: string) => {
    try {
      setProcessingState(prev => ({ ...prev, thinking: true }));
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, topic }),
      });
      
      const data = await response.json();
      setMessages(prev => [...prev, 
        { role: 'user', content: content },
        data.message
      ]);

      // Speak the assistant's Danish response
      if (data.message.role === 'assistant') {
        setProcessingState(prev => ({ ...prev, speaking: true }));
        await speakDanish(data.message.content);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setProcessingState(prev => ({ 
        ...prev, 
        thinking: false,
        speaking: false 
      }));
    }
  };

  const speakDanish = (text: string) => {
    // Implement text-to-speech functionality here
  };

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
              onClick={() => speakDanish(message.content)}
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
          <button
            onClick={() => {
              if (isRecording) {
                stopRecording();
                setIsRecording(false);
              } else {
                startRecording();
                setIsRecording(true);
              }
            }}
            className={`p-2 rounded-full ${
              isRecording ? 'bg-red-500' : 'bg-gray-200'
            }`}
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
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
          </button>
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
  );
}