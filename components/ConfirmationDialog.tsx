
import React from 'react';
import { LogOut, X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative glass w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-white/10 animate-orbit-in">
        <div className="p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-2">
            <LogOut size={32} />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight">{title}</h3>
            <p className="text-sm text-white/40 leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={onConfirm}
              className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all shadow-xl shadow-red-500/20 active:scale-95"
            >
              {confirmText}
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-2xl font-bold transition-all active:scale-95"
            >
              {cancelText}
            </button>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/20 hover:text-white transition-all rounded-full hover:bg-white/5"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
