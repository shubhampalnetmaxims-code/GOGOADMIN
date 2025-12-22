
import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  info?: string;
}

export const Input: React.FC<InputProps> = ({ label, info, className = '', ...props }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="mb-4 relative">
      {label && (
        <div className="flex items-center space-x-2 mb-1">
          <label className="block text-sm font-semibold text-gray-700">
            {label}
          </label>
          {info && (
            <div 
              className="relative cursor-help"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <Info size={14} className="text-gray-400 hover:text-blue-500 transition-colors" />
              {showTooltip && (
                <div className="absolute z-[60] left-0 md:left-full ml-0 md:ml-2 bottom-full md:bottom-auto mb-2 md:mb-0 w-56 p-3 bg-gray-900 text-white text-[11px] rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-1 border border-white/10 leading-relaxed">
                  {info}
                  <div className="hidden md:block absolute top-2 -left-1 w-2 h-2 bg-gray-900 rotate-45" />
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <input
        className={`w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm placeholder-gray-400 transition-all ${className}`}
        {...props}
      />
    </div>
  );
};
