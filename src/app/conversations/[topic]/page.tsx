'use client';

import { useParams } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';

export default function ConversationPage() {
  const params = useParams();
  const topic = params.topic as string;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {getTitleForTopic(topic)}
      </h1>
      <ChatInterface topic={topic} />
    </div>
  );
}

function getTitleForTopic(topic: string): string {
  const topics: Record<string, { danish: string, english: string }> = {
    'weather': { danish: 'Vejret', english: 'Weather' },
    'sports': { danish: 'Sport', english: 'Sports' },
    'current-events': { danish: 'Aktuelle Begivenheder', english: 'Current Events' },
    'vacation': { danish: 'Ferier', english: 'Vacations' },
    'shopping': { danish: 'Shopping', english: 'Shopping' },
    'restaurants': { danish: 'Restauranter og Caféer', english: 'Restaurants and Cafes' },
  };

  return `${topics[topic]?.danish} (${topics[topic]?.english})`;
}