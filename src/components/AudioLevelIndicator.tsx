interface AudioLevelIndicatorProps {
  level: number;
}

export default function AudioLevelIndicator({ level }: AudioLevelIndicatorProps) {
  return (
    <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
      <div 
        className="h-full bg-blue-500 transition-all duration-100"
        style={{ width: `${level * 100}%` }}
      />
    </div>
  );
} 