'use client';

import { Topic } from '@/types';
import TopicSelection from '@/components/TopicSelection';
import { useState } from 'react';
import Chat from '@/components/Chat';

const topics: Topic[] = [
  {
    id: 'introduction',
    title: 'Introduktion',
    englishTitle: 'Introduction',
    icon: '👋',
    color: 'from-blue-400 to-blue-600',
    description: 'A friendly introduction to Danish language learning',
    difficulty: 'beginner',
    duration: 15,
    commonPhrases: [
      'Hej!',
      'Hvordan har du det?',
      'Jeg hedder...',
      'Hvor kommer du fra?'
    ],
    culturalNotes: [
      'Danes are known for their direct communication style',
      'It\'s common to use first names even in professional settings',
      'Danish people value equality and informality'
    ]
  },
  {
    id: 'food',
    title: 'Mad & Drikke',
    englishTitle: 'Food & Drink',
    icon: '🍽️',
    color: 'from-green-400 to-green-600',
    description: 'Learn about Danish cuisine and dining customs',
    difficulty: 'beginner',
    duration: 20,
    commonPhrases: [
      'Må jeg bede om...',
      'Tak for mad',
      'Skål!',
      'Det smager godt'
    ],
    culturalNotes: [
      'Danish cuisine is known for its focus on fresh, local ingredients',
      'Lunch is often a cold meal with open-faced sandwiches (smørrebrød)',
      'Danes take their coffee breaks (kaffepause) very seriously'
    ]
  },
  {
    id: 'travel',
    title: 'Rejse',
    englishTitle: 'Travel',
    icon: '✈️',
    color: 'from-purple-400 to-purple-600',
    description: 'Essential phrases for traveling in Denmark',
    difficulty: 'beginner',
    duration: 25,
    commonPhrases: [
      'Hvor er...',
      'Hvordan kommer jeg til...',
      'Hvad koster...',
      'Jeg vil gerne bestille...'
    ],
    culturalNotes: [
      'Denmark has an excellent public transportation system',
      'Cycling is a very popular mode of transportation',
      'Many Danes speak English, but appreciate when visitors try Danish'
    ]
  }
];

export default function Home() {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [isPracticeMode, setIsPracticeMode] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <h1 className="text-4xl font-bold mb-8 text-center">My Danish Buddy</h1>
      
      {!selectedTopic ? (
        <div className="w-full max-w-4xl">
          <TopicSelection 
            topics={topics} 
            onSelectTopic={setSelectedTopic}
            onPracticeModeChange={setIsPracticeMode}
          />
        </div>
      ) : (
        <div className="w-full max-w-4xl">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setSelectedTopic(null)}
              className="text-blue-500 hover:text-blue-700"
            >
              ← Back to Topics
            </button>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isPracticeMode}
                  onChange={(e) => setIsPracticeMode(e.target.checked)}
                  className="form-checkbox"
                />
                <span>Practice Mode</span>
              </label>
            </div>
          </div>
          <Chat 
            topic={selectedTopic} 
            isPracticeMode={isPracticeMode}
          />
        </div>
      )}
    </main>
  );
}