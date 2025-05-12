import React from 'react';

interface AudioLevelIndicatorProps {
  level: number;
  isSilent: boolean;
}

export const AudioLevelIndicator: React.FC<AudioLevelIndicatorProps> = ({ level, isSilent }) => {
  // Calculate color based on level
  const getColor = () => {
    if (isSilent) return 'bg-gray-300';
    if (level > 0.7) return 'bg-red-500';
    if (level > 0.4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className={`h-full transition-all duration-100 ${getColor()}`}
        style={{ width: `${Math.max(5, Math.min(100, level * 100))}%` }}
      />
    </div>
  );
}; 