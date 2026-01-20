
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        ref={modalRef}
        className="bg-white rounded-[24px] sm:rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col transform transition-all animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-gray-100 shrink-0">
          <h3 className="text-base md:text-lg font-black text-gray-900 uppercase tracking-tight">{title}</h3>
          <button 
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-500 transition-colors focus:outline-none bg-gray-50 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5 md:p-6 overflow-y-auto no-scrollbar flex-1">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 p-5 md:p-6 pt-2 shrink-0 border-t border-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
