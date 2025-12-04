import React, { useRef, useEffect, useState } from 'react';

interface SoundPlayerProps {
  soundFile: string | null;
  volume: number;
  onEnded?: () => void;
}

// Глобальное состояние разблокировки аудио
let audioUnlocked = false;
const unlockAudio = () => {
  if (audioUnlocked) return;
  audioUnlocked = true;
  console.log('✓ Audio unlocked globally');
};

// Функция для проверки разблокировки через реальную попытку воспроизведения
const checkAudioUnlocked = async (audioElement: HTMLAudioElement): Promise<boolean> => {
  if (audioUnlocked) return true;
  
  try {
    // Пытаемся воспроизвести и сразу останавливаем
    await audioElement.play();
    audioElement.pause();
    audioElement.currentTime = 0;
    unlockAudio();
    return true;
  } catch (error: any) {
    if (error.name === 'NotAllowedError') {
      return false;
    }
    // Для других ошибок считаем, что разблокировано
    unlockAudio();
    return true;
  }
};

/**
 * Компонент для проигрывания звуков
 * Скрытый audio элемент для воспроизведения звуков по команде
 */
export const SoundPlayer: React.FC<SoundPlayerProps> = ({
  soundFile,
  volume,
  onEnded,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isUnlocked, setIsUnlocked] = useState(audioUnlocked);
  const pendingSoundRef = useRef<{ file: string; volume: number } | null>(null);
  const unlockAttemptedRef = useRef(false);

  // Разблокировка аудио при первом взаимодействии
  useEffect(() => {
    const unlock = async () => {
      // Если уже разблокировано, не делаем ничего
      if (audioUnlocked) return;
      
      if (audioRef.current) {
        const unlocked = await checkAudioUnlocked(audioRef.current);
        if (unlocked) {
          setIsUnlocked(true);
          unlockAttemptedRef.current = true;
          
          // Если был отложенный звук, воспроизводим его
          if (pendingSoundRef.current && audioRef.current) {
            const { file, volume: vol } = pendingSoundRef.current;
            const soundUrl = file.startsWith('http')
              ? file
              : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/uploads/${file}`;
            
            audioRef.current.volume = Math.max(0, Math.min(1, vol));
            if (audioRef.current.src !== soundUrl) {
              audioRef.current.src = soundUrl;
              audioRef.current.load();
            }
            
            try {
              await audioRef.current.play();
              console.log(`✓ Playing pending sound: ${file}`);
            } catch (err) {
              console.error('Failed to play pending sound:', err);
            }
            
            pendingSoundRef.current = null;
          }
          
          // Удаляем все обработчики после успешной разблокировки
          const events = ['click', 'touchstart', 'keydown', 'mousedown'];
          events.forEach(event => {
            document.removeEventListener(event, unlock);
          });
        }
      }
    };

    // Пытаемся разблокировать сразу при монтировании (может не сработать, но попробуем)
    if (audioRef.current && !audioUnlocked) {
      // Небольшая задержка, чтобы элемент точно был готов
      setTimeout(() => {
        unlock().catch(() => {
          // Игнорируем ошибку - разблокировка произойдет при взаимодействии
        });
      }, 100);
    }

    // Слушаем события взаимодействия для разблокировки (на всю страницу)
    // Не используем { once: true }, чтобы слушать до тех пор, пока не разблокируется
    const events = ['click', 'touchstart', 'keydown', 'mousedown'];
    events.forEach(event => {
      document.addEventListener(event, unlock, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, unlock);
      });
    };
  }, []);

  // Обработчик завершения воспроизведения - разблокирует аудио для всех последующих звуков
  const handleEnded = () => {
    // Разблокируем аудио после успешного завершения воспроизведения
    unlockAudio();
    setIsUnlocked(true);
    console.log('✓ Audio unlocked after sound ended');
    
    // Вызываем пользовательский обработчик, если он есть
    if (onEnded) {
      onEnded();
    }
  };

  useEffect(() => {
    if (!soundFile || !audioRef.current) return;

    const soundUrl = soundFile.startsWith('http')
      ? soundFile
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/uploads/${soundFile}`;

    // Останавливаем текущий звук перед запуском нового
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Устанавливаем громкость
    audioRef.current.volume = Math.max(0, Math.min(1, volume));
    
    // Всегда устанавливаем новый источник и перезагружаем
    audioRef.current.src = soundUrl;
    audioRef.current.load();

    // Функция воспроизведения с обработкой ошибок
    const attemptPlay = async () => {
      if (!audioRef.current) return;

      // Если уже разблокировано, сразу воспроизводим
      if (audioUnlocked) {
        try {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
            console.log(`▶️ Playing sound: ${soundFile}`);
          }
        } catch (error: any) {
          console.error('Error playing sound:', error.name, error.message);
          if (error.name === 'NotAllowedError') {
            audioUnlocked = false;
            pendingSoundRef.current = { file: soundFile, volume };
            console.log('⚠️ Audio lost unlock. Sound queued:', soundFile);
          }
        }
        return;
      }

      // Если не разблокировано, пытаемся разблокировать
      const unlocked = await checkAudioUnlocked(audioRef.current);
      
      if (!unlocked) {
        pendingSoundRef.current = { file: soundFile, volume };
        console.log('⏳ Audio not unlocked yet. Sound queued:', soundFile);
        return;
      }

      // Если разблокировано, воспроизводим
      try {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          console.log(`▶️ Playing sound: ${soundFile}`);
          unlockAudio();
          setIsUnlocked(true);
        }
      } catch (error: any) {
        if (error.name === 'NotAllowedError') {
          audioUnlocked = false;
          pendingSoundRef.current = { file: soundFile, volume };
          console.log('⚠️ Audio lost unlock. Sound queued:', soundFile);
        } else {
          console.error('Error playing sound:', error.name, error.message);
        }
      }
    };

    // Пытаемся воспроизвести
    attemptPlay();
  }, [soundFile, volume]);

  return (
    <audio
      ref={audioRef}
      onEnded={handleEnded}
      preload="auto"
      style={{ display: 'none' }}
    />
  );
};

