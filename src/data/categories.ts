export interface Topic {
  id: string;
  title: string;
  englishTitle: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  icon: string;
  color: string;
  commonPhrases?: string[];
  culturalNotes?: string[];
}

export interface Category {
  id: string;
  title: string;
  description: string;
  topics: Topic[];
}

export const categories: Category[] = [
  {
    id: 'daily-life',
    title: 'Dagligdag',
    description: 'Learn Danish for everyday situations',
    topics: [
      {
        id: 'weather',
        title: 'Vejret',
        englishTitle: 'Weather',
        description: 'Learn to talk about weather conditions and forecasts in Danish',
        difficulty: 'beginner',
        duration: 15,
        icon: '🌤️',
        color: 'from-blue-400 to-blue-600',
        commonPhrases: [
          'Hvordan er vejret i dag?',
          'Det regner',
          'Det er solskin',
          'Hvad er temperaturen?'
        ],
        culturalNotes: [
          'Danes often start conversations by talking about the weather',
          'Weather forecasts are a common topic in Danish media'
        ]
      },
      {
        id: 'shopping',
        title: 'Shopping',
        englishTitle: 'Shopping',
        description: 'Essential phrases for shopping in Denmark',
        difficulty: 'beginner',
        duration: 20,
        icon: '🛍️',
        color: 'from-green-400 to-green-600',
        commonPhrases: [
          'Hvor meget koster det?',
          'Jeg vil gerne købe...',
          'Har I det i en anden størrelse?',
          'Kan jeg betale med kort?'
        ],
        culturalNotes: [
          'Most shops accept credit cards',
          'Many shops close early on Saturdays and are closed on Sundays'
        ]
      }
    ]
  },
  {
    id: 'culture',
    title: 'Kultur',
    description: 'Explore Danish culture and traditions',
    topics: [
      {
        id: 'hygge',
        title: 'Hygge',
        englishTitle: 'Hygge',
        description: 'Understanding the Danish concept of hygge',
        difficulty: 'intermediate',
        duration: 25,
        icon: '🕯️',
        color: 'from-yellow-400 to-yellow-600',
        commonPhrases: [
          'Lad os hygge os',
          'Det er hyggeligt',
          'Skal vi have en hyggelig aften?',
          'Hvad gør det hyggeligt?'
        ],
        culturalNotes: [
          'Hygge is a central part of Danish culture',
          'Candles are often used to create a hyggelig atmosphere'
        ]
      },
      {
        id: 'holidays',
        title: 'Helligdage',
        englishTitle: 'Holidays',
        description: 'Learn about Danish holidays and celebrations',
        difficulty: 'intermediate',
        duration: 30,
        icon: '🎉',
        color: 'from-red-400 to-red-600',
        commonPhrases: [
          'Glædelig jul',
          'God påske',
          'Tillykke med fødselsdagen',
          'Godt nytår'
        ],
        culturalNotes: [
          'Christmas is celebrated on December 24th in Denmark',
          'Danish birthdays often involve the Danish flag (Dannebrog)'
        ]
      }
    ]
  },
  {
    id: 'general',
    title: 'Generelt',
    description: 'General conversation topics',
    topics: [
      {
        id: 'current-events',
        title: 'Aktuelle Begivenheder',
        englishTitle: 'Current Events',
        description: 'Discuss current events and news in Danish',
        difficulty: 'advanced',
        duration: 30,
        icon: '📰',
        color: 'from-purple-400 to-purple-600',
        commonPhrases: [
          'Har du hørt om...?',
          'Hvad synes du om...?',
          'Jeg læste i dag at...',
          'Hvad mener du om situationen?'
        ],
        culturalNotes: [
          'Danes are generally well-informed about current events',
          'Political discussions are common in social settings'
        ]
      },
      {
        id: 'sports',
        title: 'Sport',
        englishTitle: 'Sports',
        description: 'Talk about sports and physical activities',
        difficulty: 'intermediate',
        duration: 20,
        icon: '⚽',
        color: 'from-orange-400 to-orange-600',
        commonPhrases: [
          'Hvilken sport kan du lide?',
          'Jeg spiller fodbold',
          'Skal vi se kampen?',
          'Hvem vandt?'
        ],
        culturalNotes: [
          'Football (soccer) is the most popular sport in Denmark',
          'Handball is also very popular, especially during major tournaments'
        ]
      }
    ]
  }
];

// Keep existing topics for backward compatibility
export const topics: Topic[] = categories.flatMap(category => category.topics); 