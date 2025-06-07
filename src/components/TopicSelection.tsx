'use client';

import { Topic } from '@/types';

interface TopicSelectionProps {
  topics: Topic[];
  onSelectTopic: (topic: Topic) => void;
  onPracticeModeChange: (isPracticeMode: boolean) => void;
}

export default function TopicSelection({ topics, onSelectTopic, onPracticeModeChange }: TopicSelectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            onChange={(e) => onPracticeModeChange(e.target.checked)}
            className="form-checkbox"
          />
          <span>Practice Mode</span>
        </label>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => onSelectTopic(topic)}
            className={`p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br ${topic.color} text-white`}
          >
            <div className="text-4xl mb-2">{topic.icon}</div>
            <h2 className="text-xl font-bold mb-2">{topic.title}</h2>
            <p className="text-sm opacity-90 mb-4">{topic.englishTitle}</p>
            <p className="text-sm opacity-80">{topic.description}</p>
            
            {topic.difficulty && (
              <div className="mt-4 text-sm">
                <span className="opacity-80">Difficulty: </span>
                <span className="capitalize">{topic.difficulty}</span>
              </div>
            )}
            
            {topic.duration && (
              <div className="text-sm">
                <span className="opacity-80">Duration: </span>
                <span>{topic.duration} minutes</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
} 