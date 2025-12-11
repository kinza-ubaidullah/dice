import React from 'react';

interface DiceProps {
  value: number;
  isRolling: boolean;
  color?: 'neon' | 'gold' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const Dice: React.FC<DiceProps> = ({ value, isRolling, color = 'neon', size = 'md' }) => {
  
  const getColorClass = () => {
    switch(color) {
      case 'gold': return 'border-gold shadow-neon-gold bg-black text-gold';
      case 'danger': return 'border-danger shadow-[0_0_10px_#FF4C4C] bg-black text-danger';
      default: return 'border-neon shadow-neon bg-black text-neon';
    }
  };

  const getDotColor = () => {
    switch(color) {
      case 'gold': return 'bg-gold';
      case 'danger': return 'bg-danger';
      default: return 'bg-neon';
    }
  };

  const getSizeClass = () => {
    switch(size) {
      case 'sm': return 'w-12 h-12 rounded-lg border'; // Mobile/Opponent
      case 'lg': return 'w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2'; // Desktop/Hero
      default: return 'w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2'; // Default
    }
  };

  const getDotSize = () => {
     switch(size) {
        case 'sm': return 'w-2 h-2';
        case 'lg': return 'w-4 h-4';
        default: return 'w-2.5 h-2.5';
     }
  }

  // Dot positions for 1-6
  const renderDots = () => {
    const dotBase = `${getDotSize()} rounded-full ${getDotColor()} shadow-sm`;
    
    // Positioning logic (using percentages for better scaling across sizes)
    switch (value) {
      case 1:
        return <div className={dotBase} />;
      case 2:
        return (
          <>
            <div className={`${dotBase} absolute top-[15%] left-[15%]`} />
            <div className={`${dotBase} absolute bottom-[15%] right-[15%]`} />
          </>
        );
      case 3:
        return (
          <>
            <div className={`${dotBase} absolute top-[15%] left-[15%]`} />
            <div className={dotBase} />
            <div className={`${dotBase} absolute bottom-[15%] right-[15%]`} />
          </>
        );
      case 4:
        return (
          <>
            <div className={`${dotBase} absolute top-[15%] left-[15%]`} />
            <div className={`${dotBase} absolute top-[15%] right-[15%]`} />
            <div className={`${dotBase} absolute bottom-[15%] left-[15%]`} />
            <div className={`${dotBase} absolute bottom-[15%] right-[15%]`} />
          </>
        );
      case 5:
        return (
          <>
            <div className={`${dotBase} absolute top-[15%] left-[15%]`} />
            <div className={`${dotBase} absolute top-[15%] right-[15%]`} />
            <div className={dotBase} />
            <div className={`${dotBase} absolute bottom-[15%] left-[15%]`} />
            <div className={`${dotBase} absolute bottom-[15%] right-[15%]`} />
          </>
        );
      case 6:
        return (
          <>
            <div className={`${dotBase} absolute top-[15%] left-[15%]`} />
            <div className={`${dotBase} absolute top-[15%] right-[15%]`} />
            <div className={`${dotBase} absolute left-[15%] top-1/2 -translate-y-1/2`} />
            <div className={`${dotBase} absolute right-[15%] top-1/2 -translate-y-1/2`} />
            <div className={`${dotBase} absolute bottom-[15%] left-[15%]`} />
            <div className={`${dotBase} absolute bottom-[15%] right-[15%]`} />
          </>
        );
      default:
        return <div className={dotBase} />;
    }
  };

  return (
    <div 
      className={`
        relative flex items-center justify-center 
        transition-all duration-300
        ${getColorClass()}
        ${getSizeClass()}
        ${isRolling ? 'animate-bounce' : ''}
      `}
    >
      <div className={`relative w-full h-full flex items-center justify-center ${isRolling ? 'animate-spin-slow' : ''}`}>
         {renderDots()}
      </div>
      {/* Glossy overlay */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-white opacity-5 rounded-t-inherit pointer-events-none"></div>
    </div>
  );
};

export default Dice;