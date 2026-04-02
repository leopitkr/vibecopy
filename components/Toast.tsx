"use client";

import { useCallback, useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";

export type ToastData = {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
};

type ToastProps = {
  toast: ToastData;
  onClose: (id: string) => void;
};

function Toast({ toast, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 진입 애니메이션
    const showTimer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    const duration = toast.duration ?? 3000;
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(toast.id), 200);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const bgColor = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-blue-600",
  }[toast.type];

  const icon = {
    success: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }[toast.type];

  return (
    <div
      className={`flex items-center gap-2 rounded-lg ${bgColor} px-4 py-3 text-white shadow-lg transition-all duration-200 ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      }`}
      role={toast.type === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      {icon}
      <span className="text-sm font-medium">{toast.message}</span>
      <button
        type="button"
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose(toast.id), 200);
        }}
        className="ml-2 rounded p-0.5 hover:bg-white/20"
        aria-label="닫기"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

type ToastContainerProps = {
  toasts: ToastData[];
  onClose: (id: string) => void;
};

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed left-1/2 top-4 z-50 flex -translate-x-1/2 flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

// Hook for managing toasts
let toastCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback(
    (type: ToastType, message: string, duration?: number) => {
      const id = `toast-${++toastCounter}`;
      setToasts((prev) => [...prev, { id, type, message, duration }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showSuccess = useCallback(
    (message: string, duration?: number) => addToast("success", message, duration),
    [addToast]
  );

  const showError = useCallback(
    (message: string, duration?: number) => addToast("error", message, duration ?? 5000),
    [addToast]
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => addToast("info", message, duration),
    [addToast]
  );

  return {
    toasts,
    removeToast,
    showSuccess,
    showError,
    showInfo,
  };
}
