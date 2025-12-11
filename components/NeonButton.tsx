
import React from 'react';
import { audioManager } from '../utils/audio';

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gold' | 'danger';
  fullWidth?: boolean;
}

const NeonButton: React.FC<NeonButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  onClick,
  disabled,
  ...props 
}) => {
  const baseStyle = "font-title font-bold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 select-none touch-manipulation";
  
  const variants = {
    primary: "bg-gradient-to-r from-neonDim to-neon text-background shadow-neon hover:shadow-[0_0_25px_#66FCF1]",
    secondary: "bg-panel border border-neonDim text-neon hover:bg-opacity-80",
    gold: "bg-gradient-to-r from-yellow-600 to-gold text-black shadow-neon-gold hover:shadow-[0_0_25px_#FFD700]",
    danger: "bg-danger text-white hover:bg-red-600",
  };

  const disabledStyle = "opacity-50 cursor-not-allowed grayscale shadow-none pointer-events-none";
  const activeStyle = "transform active:scale-95 cursor-pointer";

  const widthClass = fullWidth ? "w-full" : "";
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    // Sound Effect
    audioManager.play('CLICK');

    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button 
      className={`
        ${baseStyle} 
        ${variants[variant]} 
        ${widthClass} 
        ${disabled ? disabledStyle : activeStyle}
        ${className}
      `} 
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default NeonButton;
