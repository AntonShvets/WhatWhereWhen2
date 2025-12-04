import React from 'react';

interface QuestionDisplayProps {
  text: string;
  type: string;
  mediaUrl: string | null;
  showTimer?: boolean;
  timerSeconds?: number;
}

/**
 * Компонент отображения вопроса
 * Крупный текст и встроенный плеер для медиа
 */
export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  text,
  type,
  mediaUrl,
  showTimer = false,
  timerSeconds = 0,
}) => {
  const renderMedia = () => {
    if (!mediaUrl) return null;

    const mediaUrlFull = mediaUrl.startsWith('http') 
      ? mediaUrl 
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}${mediaUrl}`;

    if (type === 'video') {
      return (
        <div className="w-full max-w-6xl mx-auto mb-8">
          <video
            src={mediaUrlFull}
            controls
            autoPlay
            className="w-full h-auto rounded-lg shadow-2xl"
            style={{ maxHeight: '60vh' }}
          >
            Ваш браузер не поддерживает видео.
          </video>
        </div>
      );
    }

    if (type === 'image') {
      return (
        <div className="w-full max-w-6xl mx-auto mb-8">
          <img
            src={mediaUrlFull}
            alt="Question media"
            className="w-full h-auto rounded-lg shadow-2xl"
            style={{ maxHeight: '60vh', objectFit: 'contain' }}
          />
        </div>
      );
    }

    if (type === 'audio') {
      return (
        <div className="w-full max-w-4xl mx-auto mb-8">
          <audio
            src={mediaUrlFull}
            controls
            autoPlay
            className="w-full"
          >
            Ваш браузер не поддерживает аудио.
          </audio>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center fade-in">
      {/* Таймер */}
      {showTimer && timerSeconds !== undefined && (
        <div className="mb-8">
          <div className="text-tv-2xl font-bold text-red-500 animate-pulse">
            {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
          </div>
        </div>
      )}

      {/* Медиа */}
      {renderMedia()}

      {/* Текст вопроса */}
      <div className="max-w-7xl">
        <p className="text-tv-xl font-bold text-white leading-tight text-appear drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]">
          {text}
        </p>
      </div>
    </div>
  );
};

