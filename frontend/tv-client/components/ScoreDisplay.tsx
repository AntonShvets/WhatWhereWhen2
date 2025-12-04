import React from 'react';

interface ScoreDisplayProps {
  expertsScore: number;
  viewersScore: number;
  show: boolean;
}

/**
 * Компонент отображения счета
 * Постоянно видимый в верхней части экрана
 */
export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ 
  expertsScore, 
  viewersScore, 
  show 
}) => {
  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-black bg-opacity-90 border-b-4 border-tv-accent">
      <div className="flex justify-around items-center py-6 px-8">
        {/* Счет Знатоков */}
        <div className="flex flex-col items-center">
          <div className="text-tv-sm font-bold text-blue-400 mb-2">ЗНАТОКИ</div>
          <div className="text-tv-3xl font-black text-blue-300 drop-shadow-[0_0_20px_rgba(96,165,250,0.8)]">
            {expertsScore}
          </div>
        </div>

        {/* Разделитель */}
        <div className="text-tv-2xl font-bold text-tv-accent mx-12">:</div>

        {/* Счет Телезрителей */}
        <div className="flex flex-col items-center">
          <div className="text-tv-sm font-bold text-purple-400 mb-2">ТЕЛЕЗРИТЕЛИ</div>
          <div className="text-tv-3xl font-black text-purple-300 drop-shadow-[0_0_20px_rgba(196,181,253,0.8)]">
            {viewersScore}
          </div>
        </div>
      </div>
    </div>
  );
};

