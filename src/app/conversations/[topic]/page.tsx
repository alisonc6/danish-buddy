'use client';

import { useParams } from 'next/navigation';
import { Topic } from '../../../types';
import Chat from '../../../components/Chat';

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

  if (!topic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-2xl text-gray-600">Topic not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">{topic.title}</h1>
          <p className="text-gray-600">{topic.englishTitle}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <Chat topic={topicId} />
        </div>
      </div>
    </div>
  );
}