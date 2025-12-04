import React, { useState } from 'react';
import { getSocket } from '../lib/socket';

interface SoundEffectsProps {
  gameId: string;
}

/**
 * Компонент управления звуковыми эффектами
 * Отправляет команды через Socket.io на ТВ-клиент
 */
export const SoundEffects: React.FC<SoundEffectsProps> = ({ gameId }) => {
  const [playing, setPlaying] = useState<string | null>(null);
  const socket = getSocket();

  // Список доступных звуков (используем загруженные файлы)
  const sounds = [
    { id: 'gong', name: 'Гонг', file: 'gong-1.mp3', icon: '🔔' },
    { id: 'intro', name: 'Интро', file: 'intro.mp3', icon: '🎵' },
    { id: 'pause', name: 'Пауза', file: 'pause1.mp3', icon: '⏸️' },
    { id: 'volchok', name: 'Волчок', file: 'volchok.mp3', icon: '🎯' },
    { id: 'winners', name: 'Музыка Победителей', file: 'winners_music.mp3', icon: '🏆' },
  ];

  /**
   * Обработчик проигрывания звука
   * Отправляет команду через Socket.io на ТВ-клиент
   */
  const handlePlaySound = (soundFile: string) => {
    if (!gameId) {
      alert('Сначала выберите активную игру');
      return;
    }

    setPlaying(soundFile);

    // Отправляем команду через Socket.io немедленно (без задержек)
    socket.emit('play_sound', {
      gameId,
      file: soundFile,
      volume: 1.0,
    }, (response: any) => {
      // Обработка ответа от сервера (опционально)
      if (response && response.success) {
        console.log('Sound play command sent successfully');
      }
    });

    // Сбрасываем состояние через 1 секунду (для визуальной обратной связи)
    setTimeout(() => {
      setPlaying(null);
    }, 1000);
  };

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg shadow-lg p-6 mb-6 border-2 border-yellow-300">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
        <span className="mr-2">🔊</span>
        Звуковые Эффекты
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Нажмите на кнопку для проигрывания звука на ТВ-клиенте
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {sounds.map((sound) => (
          <button
            key={sound.id}
            onClick={() => handlePlaySound(sound.file)}
            disabled={playing === sound.file}
            className={`
              px-4 py-4 rounded-lg font-semibold text-white transition-all transform
              ${playing === sound.file
                ? 'bg-gray-400 cursor-not-allowed scale-95'
                : 'bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 hover:scale-105 active:scale-95 shadow-lg'
              }
            `}
          >
            <div className="text-3xl mb-2">{sound.icon}</div>
            <div className="text-sm">{sound.name}</div>
            {playing === sound.file && (
              <div className="text-xs mt-1 opacity-75">Воспроизведение...</div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 p-3 bg-yellow-100 rounded-lg border border-yellow-300">
        <p className="text-xs text-yellow-800">
          <strong>Примечание:</strong> Звуковые файлы должны быть загружены в папку /uploads на сервере.
          ТВ-клиент будет воспроизводить звуки по URL: /uploads/{'{filename}'}
        </p>
      </div>
    </div>
  );
};

