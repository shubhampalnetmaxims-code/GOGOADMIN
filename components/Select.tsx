
import React, { useState } from 'react';
import { Info, ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  info?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({ label, info, options, placeholder, className = '', ...props }) => {
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
      <div className="relative">
        <select
          className={`w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm appearance-none text-gray-900 transition-all ${className}`}
          {...props}
          defaultValue=""
        >
          <option value="" disabled hidden>
            {placeholder || 'Select...'}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
          <ChevronDown size={18} />
        </div>
      </div>
    </div>
  );
};
