import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { ToastMessage } from "../types";

interface ToastContextType {
  showToast: (type: ToastMessage["type"], title: string, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: ToastMessage["type"], title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(6)}`;
    const newToast: ToastMessage = { id, type, title, message };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-md w-full pointer-events-none px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 transform translate-y-0 ${
              toast.type === "success"
                ? "bg-emerald-50/95 border-emerald-200 text-emerald-900"
                : toast.type === "error"
                ? "bg-rose-50/95 border-rose-200 text-rose-900"
                : toast.type === "warning"
                ? "bg-amber-50/95 border-amber-200 text-amber-900"
                : "bg-blue-50/95 border-blue-200 text-blue-900"
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-600" />}
              {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              {toast.type === "info" && <Info className="w-5 h-5 text-blue-600" />}
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <h4 className="text-sm font-semibold leading-tight">{toast.title}</h4>
              <p className="text-xs mt-1 leading-relaxed opacity-90">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
