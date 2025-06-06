import Chat from '@/components/Chat';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8">
      <h1 className="text-3xl font-bold mb-4">My Danish Buddy</h1>
      <Chat topic="Introduktion" />
    </main>
  );
}