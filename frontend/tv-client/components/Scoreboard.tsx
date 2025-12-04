import React from 'react';

interface ScoreboardProps {
  expertsScore: number;
  viewersScore: number;
}

/**
 * Компонент табло счета в стиле телевизионного шоу
 * Дизайн максимально похож на оригинальное табло
 */
export const Scoreboard: React.FC<ScoreboardProps> = ({ 
  expertsScore, 
  viewersScore 
}) => {
  return (
    <div className="w-full h-full bg-black flex items-center justify-center relative overflow-hidden">
      {/* Основное табло */}
      <div className="relative w-full max-w-[1600px] mx-auto px-16">
        <div className="flex justify-around items-center gap-24">
          
          {/* Левая сторона - ЗНАТОКИ */}
          <div className="flex flex-col items-center">
            {/* Заголовок */}
            <div 
              className="text-6xl font-bold mb-12 tracking-wider"
              style={{
                color: '#FFD700',
                textShadow: '0 0 30px rgba(255, 215, 0, 0.6), 0 0 60px rgba(255, 215, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.8)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                letterSpacing: '0.15em',
                fontWeight: '700'
              }}
            >
              ЗНАТОКИ
            </div>
            
            {/* Число в рамке */}
            <div
              className="relative"
              style={{
                perspective: '1200px',
              }}
            >
              {/* Глянцевая красная рамка */}
              <div
                className="relative flex items-center justify-center"
                style={{
                  width: '380px',
                  height: '380px',
                  borderRadius: '32px',
                  padding: '32px',
                  background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 30%, #7F1D1D 50%, #B91C1C 70%, #EF4444 100%)',
                  boxShadow: `
                    inset 0 0 60px rgba(0, 0, 0, 0.6),
                    inset 0 0 120px rgba(0, 0, 0, 0.4),
                    inset -20px -20px 40px rgba(0, 0, 0, 0.7),
                    inset 20px 20px 40px rgba(255, 255, 255, 0.15),
                    0 15px 80px rgba(239, 68, 68, 0.7),
                    0 0 120px rgba(239, 68, 68, 0.4),
                    0 0 0 6px rgba(0, 0, 0, 0.3)
                  `,
                  transform: 'perspective(1200px) rotateX(3deg) rotateY(-3deg)',
                  border: '3px solid rgba(255, 255, 255, 0.15)',
                  position: 'relative',
                }}
              >
                {/* Золотое число с 3D эффектом */}
                <div
                  className="font-black leading-none"
                  style={{
                    fontSize: '200px',
                    color: '#FFD700',
                    textShadow: `
                      4px 4px 0px rgba(0, 0, 0, 0.9),
                      8px 8px 0px rgba(0, 0, 0, 0.7),
                      12px 12px 30px rgba(0, 0, 0, 0.5),
                      0 0 40px rgba(255, 215, 0, 0.8),
                      0 0 80px rgba(255, 215, 0, 0.4),
                      inset 0 0 30px rgba(255, 255, 255, 0.2)
                    `,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    filter: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.9))',
                    lineHeight: '1',
                    letterSpacing: '0',
                  }}
                >
                  {expertsScore}
                </div>
                
                {/* Блики для глянцевого эффекта */}
                <div
                  className="absolute top-6 left-6 w-32 h-32 rounded-full opacity-50"
                  style={{
                    background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 40%, transparent 70%)',
                    filter: 'blur(15px)',
                  }}
                />
                <div
                  className="absolute bottom-6 right-6 w-24 h-24 rounded-full opacity-30"
                  style={{
                    background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 60%)',
                    filter: 'blur(12px)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Правая сторона - ТЕЛЕЗРИТЕЛИ */}
          <div className="flex flex-col items-center">
            {/* Заголовок */}
            <div 
              className="text-6xl font-bold mb-12 tracking-wider"
              style={{
                color: '#FFD700',
                textShadow: '0 0 30px rgba(255, 215, 0, 0.6), 0 0 60px rgba(255, 215, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.8)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                letterSpacing: '0.15em',
                fontWeight: '700'
              }}
            >
              ТЕЛЕЗРИТЕЛИ
            </div>
            
            {/* Число в рамке */}
            <div
              className="relative"
              style={{
                perspective: '1200px',
              }}
            >
              {/* Глянцевая темно-синяя/серая рамка */}
              <div
                className="relative flex items-center justify-center"
                style={{
                  width: '380px',
                  height: '380px',
                  borderRadius: '32px',
                  padding: '32px',
                  background: 'linear-gradient(135deg, #334155 0%, #1E293B 30%, #0F172A 50%, #1E293B 70%, #334155 100%)',
                  boxShadow: `
                    inset 0 0 60px rgba(0, 0, 0, 0.6),
                    inset 0 0 120px rgba(0, 0, 0, 0.4),
                    inset -20px -20px 40px rgba(0, 0, 0, 0.7),
                    inset 20px 20px 40px rgba(255, 255, 255, 0.15),
                    0 15px 80px rgba(51, 65, 85, 0.7),
                    0 0 120px rgba(51, 65, 85, 0.4),
                    0 0 0 6px rgba(0, 0, 0, 0.3)
                  `,
                  transform: 'perspective(1200px) rotateX(3deg) rotateY(3deg)',
                  border: '3px solid rgba(255, 255, 255, 0.15)',
                  position: 'relative',
                }}
              >
                {/* Золотое число с 3D эффектом */}
                <div
                  className="font-black leading-none"
                  style={{
                    fontSize: '200px',
                    color: '#FFD700',
                    textShadow: `
                      4px 4px 0px rgba(0, 0, 0, 0.9),
                      8px 8px 0px rgba(0, 0, 0, 0.7),
                      12px 12px 30px rgba(0, 0, 0, 0.5),
                      0 0 40px rgba(255, 215, 0, 0.8),
                      0 0 80px rgba(255, 215, 0, 0.4),
                      inset 0 0 30px rgba(255, 255, 255, 0.2)
                    `,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    filter: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.9))',
                    lineHeight: '1',
                    letterSpacing: '0',
                  }}
                >
                  {viewersScore}
                </div>
                
                {/* Блики для глянцевого эффекта */}
                <div
                  className="absolute top-6 left-6 w-32 h-32 rounded-full opacity-50"
                  style={{
                    background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 40%, transparent 70%)',
                    filter: 'blur(15px)',
                  }}
                />
                <div
                  className="absolute bottom-6 right-6 w-24 h-24 rounded-full opacity-30"
                  style={{
                    background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 60%)',
                    filter: 'blur(12px)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

