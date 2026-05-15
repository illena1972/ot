export default function AlertModal({ title = "Ошибка", message, onClose }) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-lg">
        <h3 className="text-xl font-semibold text-gray-800 mb-3">
          {title}
        </h3>

        <p className="text-base text-gray-600 mb-6">
          {message}
        </p>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
