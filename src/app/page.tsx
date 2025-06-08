'use client';

import Chat from '@/components/Chat';
import { Topic } from '@/types';
import { useState } from 'react';

const topics: Topic[] = [
  {
    id: 'weather',
    title: 'Vejret',
    englishTitle: 'Weather',
    icon: '🌤️',
    color: 'from-blue-400 to-blue-600',
    description: 'Learn to discuss weather in Danish',
    difficulty: 'beginner',
    duration: 15,
    commonPhrases: [
      'Hvordan er vejret?',
      'Det regner',
      'Det er solskin',
      'Hvad er temperaturen?'
    ]
  },
  {
    id: 'sports',
    title: 'Sport',
    englishTitle: 'Sports',
    icon: '⚽',
    color: 'from-green-400 to-green-600',
    description: 'Talk about sports and activities',
    difficulty: 'beginner',
    duration: 15,
    commonPhrases: [
      'Hvilken sport kan du lide?',
      'Jeg spiller fodbold',
      'Hvem vandt kampen?',
      'Lad os dyrke motion'
    ]
  },
  {
    id: 'current-events',
    title: 'Aktuelle Begivenheder',
    englishTitle: 'Current Events',
    icon: '📰',
    color: 'from-purple-400 to-purple-600',
    description: 'Discuss current events and news',
    difficulty: 'intermediate',
    duration: 20,
    commonPhrases: [
      'Har du hørt nyheden?',
      'Hvad synes du om det?',
      'Det er interessant',
      'Jeg er uenig'
    ]
  },
  {
    id: 'vacations',
    title: 'Ferier',
    englishTitle: 'Vacations',
    icon: '✈️',
    color: 'from-yellow-400 to-yellow-600',
    description: 'Plan and discuss vacations',
    difficulty: 'beginner',
    duration: 15,
    commonPhrases: [
      'Hvor skal du på ferie?',
      'Jeg elsker at rejse',
      'Hvornår rejser du?',
      'Hvor længe bliver du?'
    ]
  },
  {
    id: 'shopping',
    title: 'Shopping',
    englishTitle: 'Shopping',
    icon: '🛍️',
    color: 'from-pink-400 to-pink-600',
    description: 'Learn shopping vocabulary and phrases',
    difficulty: 'beginner',
    duration: 15,
    commonPhrases: [
      'Hvor meget koster det?',
      'Jeg vil gerne købe...',
      'Har du det i en anden størrelse?',
      'Kan jeg prøve det?'
    ]
  },
  {
    id: 'restaurants',
    title: 'Restauranter og Caféer',
    englishTitle: 'Restaurants and Cafes',
    icon: '🍽️',
    color: 'from-red-400 to-red-600',
    description: 'Order food and drinks in Danish',
    difficulty: 'beginner',
    duration: 15,
    commonPhrases: [
      'Jeg vil gerne bestille',
      'Hvad kan du anbefale?',
      'Regningen, tak',
      'Må jeg bede om...'
    ]
  }
];

export default function Home() {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-12">
          Velkommen til Danish Buddy
        </h1>
        
        {!selectedTopic ? (
          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic)}
                  className={`p-6 rounded-xl text-white bg-gradient-to-r ${topic.color} hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1`}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-3xl">{topic.icon}</span>
                    <div>
                      <h2 className="text-xl font-semibold">{topic.title}</h2>
                      <p className="text-sm opacity-90">{topic.englishTitle}</p>
                    </div>
                  </div>
                  <p className="text-sm opacity-90">{topic.description}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => setSelectedTopic(null)}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-2 font-medium transition-colors"
              >
                ← Back to Topics
              </button>
              <label className="flex items-center gap-2 text-gray-700">
                <input
                  type="checkbox"
                  checked={isMuted}
                  onChange={(e) => setIsMuted(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span>Mute Audio</span>
              </label>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <Chat 
                topic={selectedTopic} 
                isMuted={isMuted}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}