import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div 
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
      role="article"
      aria-label={`Message from ${message.role === 'user' ? 'you' : 'Danish Buddy'}`}
    >
      <div 
        className={`max-w-[80%] rounded-lg p-4 ${
          message.role === 'user' 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        <p className="text-sm font-medium mb-1">
          {message.role === 'user' ? 'You' : 'Danish Buddy'}
        </p>
        <p className="text-base">{message.content}</p>
        {message.translation && (
          <p 
            className="text-sm mt-2 text-gray-500"
            aria-label="English translation"
          >
            {message.translation}
          </p>
        )}
      </div>
    </div>
  );
} 