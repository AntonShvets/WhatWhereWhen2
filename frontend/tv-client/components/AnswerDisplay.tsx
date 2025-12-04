import React from 'react';

interface AnswerDisplayProps {
  answer: string;
}

/**
 * Компонент отображения ответа
 */
export const AnswerDisplay: React.FC<AnswerDisplayProps> = ({ answer }) => {
  return (
    <div className="flex items-center justify-center h-full px-8 fade-in">
      <div className="text-center max-w-6xl">
        <div className="text-tv-sm font-bold text-tv-accent mb-8 uppercase tracking-wider">
          Правильный ответ:
        </div>
        <div className="text-tv-3xl font-black text-green-400 text-appear drop-shadow-[0_0_20px_rgba(74,222,128,0.8)]">
          {answer}
        </div>
      </div>
    </div>
  );
};

