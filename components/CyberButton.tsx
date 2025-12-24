
import React from 'react';

interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}

const CyberButton: React.FC<CyberButtonProps> = ({ 
  children, 
  variant = 'primary', 
  loading = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "relative px-6 py-2 cyber-font font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-sm tracking-widest overflow-hidden";
  const primaryStyles = "bg-[#00f3ff] text-black hover:bg-white hover:shadow-[0_0_20px_#00f3ff]";
  const secondaryStyles = "bg-transparent border border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-black";

  return (
    <button 
      className={`${baseStyles} ${variant === 'primary' ? primaryStyles : secondaryStyles} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </span>
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-1 h-1 bg-white"></div>
      <div className="absolute bottom-0 right-0 w-1 h-1 bg-white"></div>
    </button>
  );
};

export default CyberButton;
