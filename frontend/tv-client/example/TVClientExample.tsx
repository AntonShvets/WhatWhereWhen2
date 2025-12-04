import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * Пример ТВ-клиента для обработки команды play_sound
 * Этот компонент демонстрирует, как ТВ-клиент должен принимать
 * команды через Socket.io и воспроизводить звуки
 */
export const TVClientExample: React.FC<{ gameId: string }> = ({ gameId }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [currentSound, setCurrentSound] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002';

  useEffect(() => {
    // Инициализация Socket.io подключения
    const newSocket = io(`${SOCKET_URL}/game`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('TV Client connected to Socket.io server');
      setConnected(true);

      // Присоединяемся к комнате игры
      newSocket.emit('game:join', { gameId });
    });

    newSocket.on('disconnect', () => {
      console.log('TV Client disconnected');
      setConnected(false);
    });

    /**
     * Обработчик команды play_sound
     * При получении команды от админки, воспроизводим звук
     */
    newSocket.on('play_sound', (data: { file: string; volume?: number; timestamp: number }) => {
      console.log('Received play_sound command:', data);
      playSound(data.file, data.volume || 1.0);
    });

    setSocket(newSocket);

    return () => {
      newSocket.off('play_sound');
      newSocket.disconnect();
    };
  }, [gameId, SOCKET_URL]);

  /**
   * Функция воспроизведения звука
   * Использует HTML5 Audio API для проигрывания файла
   */
  const playSound = (filename: string, volume: number = 1.0) => {
    if (!audioRef.current) return;

    // Формируем URL к звуковому файлу
    // Файлы должны быть доступны по пути /uploads/{filename}
    const soundUrl = `${SOCKET_URL}/uploads/${filename}`;

    // Устанавливаем источник и громкость
    audioRef.current.src = soundUrl;
    audioRef.current.volume = Math.max(0, Math.min(1, volume)); // Ограничиваем от 0 до 1

    // Воспроизводим звук
    audioRef.current
      .play()
      .then(() => {
        console.log(`Playing sound: ${filename}`);
        setCurrentSound(filename);
      })
      .catch((error) => {
        console.error('Error playing sound:', error);
        // Если файл не найден, можно попробовать альтернативный путь
        console.warn(`Sound file not found: ${soundUrl}`);
      });
  };

  /**
   * Обработчик окончания воспроизведения
   */
  const handleSoundEnded = () => {
    setCurrentSound(null);
  };

  /**
   * Обработчик ошибки воспроизведения
   */
  const handleSoundError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.error('Audio error:', e);
    setCurrentSound(null);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">ТВ-Клиент</h1>
        
        <div className="mb-8">
          <div className={`inline-block px-4 py-2 rounded-lg ${
            connected ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {connected ? '✓ Подключено' : '✗ Отключено'}
          </div>
        </div>

        {currentSound && (
          <div className="mb-4 p-4 bg-blue-900 rounded-lg">
            <p className="text-lg">🔊 Воспроизведение: {currentSound}</p>
          </div>
        )}

        <div className="text-sm text-gray-400 mt-8">
          <p>Game ID: {gameId}</p>
          <p>Ожидание команд от админки...</p>
        </div>
      </div>

      {/* 
        HTML5 Audio элемент для воспроизведения звуков
        Скрыт, но используется для проигрывания звуков
      */}
      <audio
        ref={audioRef}
        onEnded={handleSoundEnded}
        onError={handleSoundError}
        preload="auto"
        style={{ display: 'none' }}
      />

      {/* 
        Альтернативный способ: использование нескольких audio элементов
        для предзагрузки популярных звуков
      */}
      <div style={{ display: 'none' }}>
        <audio preload="auto" src={`${SOCKET_URL}/uploads/gong.mp3`} />
        <audio preload="auto" src={`${SOCKET_URL}/uploads/minute_start.mp3`} />
        <audio preload="auto" src={`${SOCKET_URL}/uploads/siren.mp3`} />
        <audio preload="auto" src={`${SOCKET_URL}/uploads/correct.mp3`} />
        <audio preload="auto" src={`${SOCKET_URL}/uploads/incorrect.mp3`} />
      </div>
    </div>
  );
};

/**
 * Альтернативная реализация с использованием нескольких audio элементов
 * для каждого звука (более производительная для частых звуков)
 */
export const TVClientWithMultipleAudio: React.FC<{ gameId: string }> = ({ gameId }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [currentSound, setCurrentSound] = useState<string | null>(null);

  // Создаем refs для каждого звука
  const gongRef = useRef<HTMLAudioElement>(null);
  const minuteStartRef = useRef<HTMLAudioElement>(null);
  const sirenRef = useRef<HTMLAudioElement>(null);
  const correctRef = useRef<HTMLAudioElement>(null);
  const incorrectRef = useRef<HTMLAudioElement>(null);

  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002';

  useEffect(() => {
    const newSocket = io(`${SOCKET_URL}/game`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      newSocket.emit('game:join', { gameId });
    });

    newSocket.on('play_sound', (data: { file: string; volume?: number }) => {
      playSound(data.file, data.volume || 1.0);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [gameId, SOCKET_URL]);

  const playSound = (filename: string, volume: number) => {
    let audioRef: React.RefObject<HTMLAudioElement> | null = null;

    // Выбираем соответствующий audio элемент
    switch (filename) {
      case 'gong.mp3':
        audioRef = gongRef;
        break;
      case 'minute_start.mp3':
        audioRef = minuteStartRef;
        break;
      case 'siren.mp3':
        audioRef = sirenRef;
        break;
      case 'correct.mp3':
        audioRef = correctRef;
        break;
      case 'incorrect.mp3':
        audioRef = incorrectRef;
        break;
      default:
        console.warn(`Unknown sound file: ${filename}`);
        return;
    }

    if (audioRef?.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
      audioRef.current
        .play()
        .then(() => {
          setCurrentSound(filename);
        })
        .catch((error) => {
          console.error('Error playing sound:', error);
        });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">ТВ-Клиент (Множественные Audio)</h1>
      
      <div className={`px-4 py-2 rounded-lg ${
        connected ? 'bg-green-600' : 'bg-red-600'
      }`}>
        {connected ? '✓ Подключено' : '✗ Отключено'}
      </div>

      {currentSound && (
        <div className="mt-4 p-4 bg-blue-900 rounded-lg">
          <p>🔊 Воспроизведение: {currentSound}</p>
        </div>
      )}

      {/* Множественные audio элементы для каждого звука */}
      <div style={{ display: 'none' }}>
        <audio
          ref={gongRef}
          src={`${SOCKET_URL}/uploads/gong.mp3`}
          preload="auto"
          onEnded={() => setCurrentSound(null)}
        />
        <audio
          ref={minuteStartRef}
          src={`${SOCKET_URL}/uploads/minute_start.mp3`}
          preload="auto"
          onEnded={() => setCurrentSound(null)}
        />
        <audio
          ref={sirenRef}
          src={`${SOCKET_URL}/uploads/siren.mp3`}
          preload="auto"
          onEnded={() => setCurrentSound(null)}
        />
        <audio
          ref={correctRef}
          src={`${SOCKET_URL}/uploads/correct.mp3`}
          preload="auto"
          onEnded={() => setCurrentSound(null)}
        />
        <audio
          ref={incorrectRef}
          src={`${SOCKET_URL}/uploads/incorrect.mp3`}
          preload="auto"
          onEnded={() => setCurrentSound(null)}
        />
      </div>
    </div>
  );
};

