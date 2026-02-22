import { useEffect } from "react";

export default function Modal({ isOpen, onClose, children, title, width = "max-w-3xl" }) {
  // блокируем скролл при открытой модалке
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // закрытие по ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* фон */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* контент модалки */}
      <div className={`relative bg-white rounded-xl shadow-lg w-full ${width} max-h-[80vh] overflow-auto p-6 transform transition-all scale-95 opacity-0 animate-modalShow`}>
        {/* Заголовок */}
        {title && (
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-black text-2xl font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Тело */}
        <div>{children}</div>
      </div>

      {/* Анимация */}
      <style>
        {`
          @keyframes modalShow {
            0% { opacity: 0; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
          }
          .animate-modalShow {
            animation: modalShow 0.2s ease-out forwards;
          }
        `}
      </style>
    </div>
  );
}