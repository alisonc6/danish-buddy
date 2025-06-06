import Chat from '@/components/Chat';
import { Topic } from '@/types';

const defaultTopic: Topic = {
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
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8">
      <h1 className="text-3xl font-bold mb-4">My Danish Buddy</h1>
      <Chat topic={defaultTopic} />
    </main>
  );
}