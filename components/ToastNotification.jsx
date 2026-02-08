"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { animate } from "animejs";

const ToastContext = createContext(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const toastIdRef = useRef(0);

    const addToast = useCallback((message, type = "info", duration = 5000) => {
        const id = ++toastIdRef.current;
        const newToast = { id, message, type, duration };

        setToasts(prev => {
            // Limit to 5 toasts max
            const updated = [...prev, newToast];
            if (updated.length > 5) {
                return updated.slice(-5);
            }
            return updated;
        });

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = {
        info: (message, duration) => addToast(message, "info", duration),
        success: (message, duration) => addToast(message, "success", duration),
        warning: (message, duration) => addToast(message, "warning", duration),
        error: (message, duration) => addToast(message, "error", duration),
        critical: (message, duration) => addToast(message, "critical", duration),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
}

function ToastContainer({ toasts, onRemove }) {
    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map((toast) => (
                <Toast key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
}

function Toast({ toast, onRemove }) {
    const toastRef = useRef(null);

    const typeStyles = {
        info: {
            bg: "bg-blue-500/10 border-blue-500/30",
            icon: "ℹ️",
            text: "text-blue-400",
        },
        success: {
            bg: "bg-green-500/10 border-green-500/30",
            icon: "✅",
            text: "text-green-400",
        },
        warning: {
            bg: "bg-yellow-500/10 border-yellow-500/30",
            icon: "⚠️",
            text: "text-yellow-400",
        },
        error: {
            bg: "bg-red-500/10 border-red-500/30",
            icon: "❌",
            text: "text-red-400",
        },
        critical: {
            bg: "bg-red-600/20 border-red-500/50",
            icon: "🚨",
            text: "text-red-500",
        },
    };

    const style = typeStyles[toast.type] || typeStyles.info;

    useEffect(() => {
        if (toastRef.current) {
            // Entrance animation
            animate(toastRef.current, {
                translateX: [100, 0],
                opacity: [0, 1],
                scale: [0.9, 1],
                duration: 400,
                easing: "easeOutBack",
            });
        }
    }, []);

    const handleRemove = () => {
        if (toastRef.current) {
            animate(toastRef.current, {
                translateX: [0, 100],
                opacity: [1, 0],
                scale: [1, 0.9],
                duration: 300,
                easing: "easeInBack",
                complete: () => onRemove(toast.id),
            });
        } else {
            onRemove(toast.id);
        }
    };

    return (
        <div
            ref={toastRef}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border backdrop-blur-xl px-4 py-3 shadow-2xl min-w-[280px] max-w-[380px] ${style.bg}`}
        >
            <span className="text-lg shrink-0">{style.icon}</span>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${style.text}`}>
                    {toast.message}
                </p>
            </div>
            <button
                onClick={handleRemove}
                className="shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}
