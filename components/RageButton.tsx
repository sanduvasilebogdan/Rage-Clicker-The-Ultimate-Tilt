
import React, { useState, useEffect, useCallback } from 'react';

interface RageButtonProps {
  level: number;
  color: 'red' | 'blue';
  onClick: (x: number, y: number) => void;
  onMiss: (e: React.MouseEvent) => void;
}

const RageButton: React.FC<RageButtonProps> = ({ level, color, onClick, onMiss }) => {
  const [position, setPosition] = useState({ top: '50%', left: '50%' });
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(1);

  const moveRandomly = useCallback(() => {
    const padding = 120;
    const newTop = Math.random() * (window.innerHeight - padding * 2) + padding;
    const newLeft = Math.random() * (window.innerWidth - padding * 2) + padding;
    setPosition({ top: `${newTop}px`, left: `${newLeft}px` });
  }, []);

  // Initialize position
  useEffect(() => {
    moveRandomly();
  }, [moveRandomly]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(e.clientX, e.clientY);
    moveRandomly();
    // Shrink as level increases
    setScale(Math.max(0.4, 1 - (level * 0.03)));
  };

  // Periodic jitter/movement for high levels
  useEffect(() => {
    if (level >= 3) {
      const interval = setInterval(() => {
        if (Math.random() < 0.3) moveRandomly();
      }, 3000 - Math.min(2000, level * 200));
      return () => clearInterval(interval);
    }
  }, [level, moveRandomly]);

  const colorClasses = color === 'red' 
    ? 'border-red-500 bg-red-600 shadow-[0_0_40px_rgba(239,68,68,0.6)]' 
    : 'border-blue-500 bg-blue-600 shadow-[0_0_40px_rgba(59,130,246,0.6)]';

  return (
    <div 
      className="absolute transition-all duration-300 ease-out cursor-none"
      style={{ 
        top: position.top, 
        left: position.left, 
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity: opacity,
        zIndex: 50
      }}
    >
      <button
        onClick={handleClick}
        className={`
          relative w-28 h-28 rounded-full border-8
          flex items-center justify-center text-white font-black text-sm
          active:scale-90 transition-all hover:rotate-12
          retro-font ${colorClasses}
        `}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent to-white/20"></div>
        {color === 'red' ? 'P1 HIT' : 'P2 HIT'}
      </button>
      <div className={`absolute -inset-2 rounded-full border-2 animate-ping pointer-events-none opacity-20 ${color === 'red' ? 'border-red-400' : 'border-blue-400'}`}></div>
    </div>
  );
};

export default RageButton;
