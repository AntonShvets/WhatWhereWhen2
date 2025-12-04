import React from 'react';

interface ViewerDisplayProps {
  name: string;
  city: string | null;
  photoUrl: string | null;
}

/**
 * Компонент отображения информации о телезрителе
 */
export const ViewerDisplay: React.FC<ViewerDisplayProps> = ({
  name,
  city,
  photoUrl,
}) => {
  const photoUrlFull = photoUrl 
    ? (photoUrl.startsWith('http') 
        ? photoUrl 
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}${photoUrl}`)
    : null;

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 fade-in">
      {/* Фото телезрителя */}
      {photoUrlFull && (
        <div className="mb-12">
          <img
            src={photoUrlFull}
            alt={name}
            className="w-96 h-96 rounded-full object-cover border-8 border-tv-accent shadow-2xl"
          />
        </div>
      )}

      {/* Имя */}
      <div className="text-tv-3xl font-bold text-white mb-4 text-appear">
        {name}
      </div>

      {/* Город */}
      {city && (
        <div className="text-tv-xl font-semibold text-tv-accent text-appear">
          {city}
        </div>
      )}
    </div>
  );
};

