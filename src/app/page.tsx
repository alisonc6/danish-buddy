'use client';

import Link from 'next/link';

const topics = [
  { id: 'weather', title: 'Vejret', icon: '🌤️', englishTitle: 'Weather' },
  { id: 'sports', title: 'Sport', icon: '⚽', englishTitle: 'Sports' },
  { id: 'current-events', title: 'Aktuelle Begivenheder', icon: '📰', englishTitle: 'Current Events' },
  { id: 'vacation', title: 'Ferier', icon: '✈️', englishTitle: 'Vacations' },
  { id: 'shopping', title: 'Shopping', icon: '🛍️', englishTitle: 'Shopping' },
  { id: 'restaurants', title: 'Restauranter og Caféer', icon: '🍽️', englishTitle: 'Restaurants and Cafes' },
];

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Velkommen til Danish Buddy</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics.map((topic) => (
          <Link href={`/conversations/${topic.id}`} key={topic.id}>
            <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-4xl mb-4">{topic.icon}</div>
              <h2 className="text-xl font-semibold mb-2">{topic.title}</h2>
              <p className="text-gray-600">{topic.englishTitle}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}