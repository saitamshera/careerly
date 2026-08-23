import React from 'react';

export function Logo({ className = '', hideText = false }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Mountain & Path Icon */}
      <svg 
        width="48" 
        height="40" 
        viewBox="0 0 54 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <path d="M4 24 L14 14 L20 20 L28 8 L36 18 L42 14 L50 22" stroke="#20211E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="28" y1="8" x2="28" y2="0" stroke="#20211E" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M28 0 L40 0 L36 4 L40 8 L28 8 Z" fill="#D96A25"/>
        <path d="M12 34 Q28 26 34 32 T46 28" stroke="#20211E" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      </svg>
      
      {!hideText && (
        <>
          {/* Vertical Divider */}
          <div className="w-[1.5px] h-7 bg-[#20211E]/20 rounded-full shrink-0" />
          
          {/* Wordmark */}
          <span className="text-xl font-bold tracking-tight lowercase flex items-baseline">
            <span className="text-[#20211E]">careerl</span>
            <span className="text-[#D96A25]">y</span>
          </span>
        </>
      )}
    </div>
  );
}
