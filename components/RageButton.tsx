
import React, { useState, useEffect, useCallback } from 'react';

interface RageButtonProps {
  level: number;
  onClick: (x: number, y: number) => void;
  onMiss: () => void;
}

const RageButton: React.FC<RageButtonProps> = ({ level, onClick, onMiss }) => {
  const [position, setPosition] = useState({ top: '50%', left: '50%' });
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(1);
  const [isHovering, setIsHovering] = useState(false);

  const moveRandomly = useCallback(() => {
    // Generate new position within viewport bounds with safe padding
    // Padding ensures the button doesn't go off-screen
    const padding = 100;
    const newTop = Math.random() * (window.innerHeight - padding * 2) + padding;
    const newLeft = Math.random() * (window.innerWidth - padding * 2) + padding;
    
    setPosition({ top: `${newTop}px`, left: `${newLeft}px` });
  }, []);

  const handleMouseEnter = () => {
    setIsHovering(true);
    // Move on hover if level is high enough - adds "rage" factor
    if (level >= 2) {
      const probability = Math.min(0.05 + (level * 0.05), 0.7);
      if (Math.random() < probability) {
        moveRandomly();
      }
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    // CRITICAL: Prevent the click from bubbling up to the background "Miss" handler
    e.stopPropagation();
    
    // Pass coordinates for floating feedback
    onClick(e.clientX, e.clientY);
    
    // Always move to a new random location on hit
    moveRandomly();
    
    // Difficulty scaling: shrink button over time
    const newScale = Math.max(0.4, 1 - (level * 0.025));
    setScale(newScale);
  };

  // Periodic random movement for higher levels even without interaction
  useEffect(() => {
    if (level >= 5) {
      const intervalTime = Math.max(1000, 4000 - (level * 300));
      const interval = setInterval(() => {
        if (!isHovering) moveRandomly();
      }, intervalTime);
      return () => clearInterval(interval);
    }
  }, [level, isHovering, moveRandomly]);

  // Visual "Glitch" effect at high levels
  useEffect(() => {
    if (level >= 10) {
      const interval = setInterval(() => {
        if (Math.random() < 0.2) {
          setOpacity(0.3);
          setTimeout(() => setOpacity(1), 100);
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [level]);

  return (
    <div 
      className="absolute transition-all duration-200 ease-out cursor-none"
      style={{ 
        top: position.top, 
        left: position.left, 
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity: opacity,
        zIndex: 50
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={handleClick}
        className={`
          relative w-32 h-32 rounded-full border-8 border-red-500 bg-red-600
          flex items-center justify-center text-white font-black text-xl
          shadow-[0_0_40px_rgba(239,68,68,0.7)]
          active:scale-90 active:bg-red-800
          transition-all hover:rotate-6 hover:brightness-110
          retro-font
        `}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent to-white/20"></div>
        HIT ME
      </button>
      
      {/* Decorative ping */}
      <div className="absolute -inset-2 rounded-full border-4 border-red-400/30 animate-ping pointer-events-none"></div>
    </div>
  );
};

export default RageButton;
