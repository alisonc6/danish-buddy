'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowLeft, Bookmark, BookmarkCheck, Volume2, VolumeX } from 'lucide-react';
import { categories } from '../../../data/categories';
import Chat from '../../../components/Chat';
import { handleError, PracticeModeError } from '../../../utils/errorHandling';

export default function ConversationPage() {
  const params = useParams();
  const topicId = params.topic as string;
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Find the topic in our categories
  const topic = categories
    .flatMap(category => category.topics)
    .find(t => t.id === topicId);

  // Load saved preferences
  useEffect(() => {
    try {
      const savedMute = localStorage.getItem('isMuted');
      const savedBookmark = localStorage.getItem(`bookmark_${topicId}`);
      const savedPracticeMode = localStorage.getItem(`practiceMode_${topicId}`);
      
      if (savedMute) setIsMuted(savedMute === 'true');
      if (savedBookmark) setIsBookmarked(savedBookmark === 'true');
      if (savedPracticeMode) setIsPracticeMode(savedPracticeMode === 'true');
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }, [topicId]);

  // Save preferences
  useEffect(() => {
    try {
      localStorage.setItem('isMuted', isMuted.toString());
      localStorage.setItem(`bookmark_${topicId}`, isBookmarked.toString());
      localStorage.setItem(`practiceMode_${topicId}`, isPracticeMode.toString());
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }, [isMuted, isBookmarked, isPracticeMode, topicId]);

  if (!topic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-gray-600 mb-4">Topic not found</p>
          <Link 
            href="/"
            className="text-blue-500 hover:text-blue-700"
          >
            Return to topics
          </Link>
        </div>
      </div>
    );
  }

  const handlePracticeModeToggle = () => {
    try {
      setIsPracticeMode(!isPracticeMode);
      setError(null);
    } catch (error) {
      setError(handleError(new PracticeModeError('Failed to toggle practice mode')));
    }
  };

  const handleBookmarkToggle = () => {
    try {
      setIsBookmarked(!isBookmarked);
      setError(null);
    } catch (error) {
      setError(handleError(error));
    }
  };

  const handleMuteToggle = () => {
    try {
      setIsMuted(!isMuted);
      setError(null);
    } catch (error) {
      setError(handleError(error));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto p-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Back button and controls */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to topics
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={handleMuteToggle}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button
              onClick={handleBookmarkToggle}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title={isBookmarked ? "Remove bookmark" : "Bookmark topic"}
            >
              {isBookmarked ? <BookmarkCheck className="w-5 h-5 text-blue-500" /> : <Bookmark className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Topic header */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`text-4xl bg-gradient-to-r ${topic.color} p-3 rounded-xl`}>
              {topic.icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{topic.title}</h1>
              <p className="text-gray-600">{topic.englishTitle}</p>
            </div>
          </div>
          
          <p className="text-gray-600 mb-6">{topic.description}</p>
          
          <div className="flex items-center gap-4 mb-6">
            <span className={`px-3 py-1 rounded-full text-sm ${
              topic.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
              topic.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {topic.difficulty}
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-600">{topic.duration} minutes</span>
            <span className="text-gray-500">•</span>
            <button
              onClick={handlePracticeModeToggle}
              className={`px-3 py-1 rounded-full text-sm ${
                isPracticeMode ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {isPracticeMode ? 'Practice Mode: On' : 'Practice Mode: Off'}
            </button>
          </div>

          {/* Quick phrases */}
          {topic.commonPhrases && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Quick Phrases</h2>
              <div className="flex flex-wrap gap-2">
                {topic.commonPhrases.map((phrase, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      try {
                        // TODO: Implement phrase insertion into chat
                        console.log('Insert phrase:', phrase);
                      } catch (error) {
                        setError(handleError(error));
                      }
                    }}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm transition-colors"
                  >
                    {phrase}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cultural notes */}
          {topic.culturalNotes && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Cultural Notes</h2>
              <ul className="space-y-2">
                {topic.culturalNotes.map((note, index) => (
                  <li 
                    key={index}
                    className="flex items-start gap-2 text-gray-600"
                  >
                    <span className="text-blue-500">•</span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Practice mode info */}
          {isPracticeMode && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">Practice Mode Active</h2>
              <p className="text-blue-700">
                In practice mode, you&apos;ll receive more detailed feedback and corrections on your Danish.
                The conversation will focus on helping you improve your language skills.
              </p>
            </div>
          )}
        </div>

        {/* Chat interface */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <Chat 
            topic={topic} 
            isPracticeMode={isPracticeMode}
            isMuted={isMuted}
          />
        </div>
      </div>
    </div>
  );
}