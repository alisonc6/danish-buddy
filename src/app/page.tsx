'use client';

import Link from 'next/link';

const topics = [
  { id: 'weather', title: 'Vejret', icon: '🌤️', englishTitle: 'Weather', color: 'from-blue-400 to-blue-600' },
  { id: 'sports', title: 'Sport', icon: '⚽', englishTitle: 'Sports', color: 'from-green-400 to-green-600' },
  { id: 'current-events', title: 'Aktuelle Begivenheder', icon: '📰', englishTitle: 'Current Events', color: 'from-purple-400 to-purple-600' },
  { id: 'vacation', title: 'Ferier', icon: '✈️', englishTitle: 'Vacations', color: 'from-yellow-400 to-yellow-600' },
  { id: 'shopping', title: 'Shopping', icon: '🛍️', englishTitle: 'Shopping', color: 'from-pink-400 to-pink-600' },
  { id: 'restaurants', title: 'Restauranter og Caféer', icon: '🍽️', englishTitle: 'Restaurants and Cafes', color: 'from-red-400 to-red-600' },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-12 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
          Velkommen til Danish Buddy
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {topics.map((topic) => (
            <Link href={/conversations/} key={topic.id}>
              <div className={g-white rounded-2xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-100 hover:border-gray-200 group}>
                <div className={	ext-6xl mb-6 bg-gradient-to-r  p-4 rounded-xl group-hover:scale-110 transition-transform duration-300 w-fit}>
                  {topic.icon}
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                    {topic.title}
                  </h2>
                  <p className="text-gray-600">
                    {topic.englishTitle}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
