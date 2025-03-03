import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          US Stock Analysis Chatbot
        </h1>
        <div className="bg-white rounded-lg shadow-lg">
          <ChatInterface />
        </div>
      </div>
    </main>
  );
}
