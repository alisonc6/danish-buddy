'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Topic, Message, ChatResponse } from '../../../types';
import ChatMessage from '../../../components/ChatMessage';
import ChatInput from '../../../components/ChatInput';

const topics: Topic[] = [
  { id: 'weather', title: 'Vejret', icon: '🌤️', englishTitle: 'Weather', color: 'from-blue-400 to-blue-600' },
  { id: 'sports', title: 'Sport', icon: '⚽', englishTitle: 'Sports', color: 'from-green-400 to-green-600' },
  { id: 'current-events', title: 'Aktuelle Begivenheder', icon: '📰', englishTitle: 'Current Events', color: 'from-purple-400 to-purple-600' },
  { id: 'vacation', title: 'Ferier', icon: '✈️', englishTitle: 'Vacations', color: 'from-yellow-400 to-yellow-600' },
  { id: 'shopping', title: 'Shopping', icon: '🛍️', englishTitle: 'Shopping', color: 'from-pink-400 to-pink-600' },
  { id: 'restaurants', title: 'Restauranter og Caféer', icon: '🍽️', englishTitle: 'Restaurants and Cafes', color: 'from-red-400 to-red-600' },
];

export default function ConversationPage() {
  const params = useParams();
  const topicId = params.topic as string;
  const topic = topics.find(t => t.id === topicId);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = async (content: string) => {
    setError(null);
    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    setMessages((prev: Message[]) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          topic: topicId
        }),
      });

      const data: ChatResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const botMessage: Message = {
        role: 'assistant',
        content: data.danishResponse,
        translation: data.englishTranslation,
        timestamp: new Date().toISOString()
      };

      setMessages((prev: Message[]) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!topic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Topic Not Found</h1>
          <p className="text-gray-600">The requested topic does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className={`text-4xl bg-gradient-to-r ${topic.color} p-3 rounded-lg`}>
                {topic.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{topic.title}</h1>
                <p className="text-gray-600">{topic.englishTitle}</p>
              </div>
            </div>
          </div>
          
          <div className="h-[60vh] overflow-y-auto p-4">
            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-100 rounded-lg p-4">
                  <p className="text-gray-600">Danish Buddy is typing...</p>
                </div>
              </div>
            )}
            {error && (
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 text-red-800 rounded-lg p-4">
                  <p>{error}</p>
                </div>
              </div>
            )}
          </div>

          <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}