
import React, { useEffect, useState } from 'react';
import { Info, AlertCircle, CheckCircle2, X } from 'lucide-react';

export type ToastType = 'info' | 'error' | 'success';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    info: <Info className="text-blue-500" size={18} />,
    error: <AlertCircle className="text-red-500" size={18} />,
    success: <CheckCircle2 className="text-green-500" size={18} />,
  };

  const bgColors = {
    info: 'bg-blue-500/10 border-blue-500/20',
    error: 'bg-red-500/10 border-red-500/20',
    success: 'bg-green-500/10 border-green-500/20',
  };

  return (
    <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 transform ${isExiting ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}>
      <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border backdrop-blur-3xl shadow-2xl ${bgColors[type]}`}>
        {icons[type]}
        <span className="text-sm font-bold tracking-tight text-white/90">{message}</span>
        <button onClick={() => { setIsExiting(true); setTimeout(onClose, 300); }} className="ml-2 text-white/20 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
