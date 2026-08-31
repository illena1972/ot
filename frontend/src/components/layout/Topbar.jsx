import { LogOut } from "lucide-react";

export default function Topbar({ organization, loading, user, onLogout }) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-800">Система учета спецодежды</h2>
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0 text-right">
            <div className="flex justify-end gap-1 text-xs">
              <span className="font-medium text-gray-500">Организация:</span>
              <span className="truncate font-semibold text-blue-800">
                {loading ? "Загрузка..." : organization?.name || "Не определена"}
              </span>
            </div>
            <div className="truncate text-xs text-gray-500">{user?.username}</div>
          </div>
          <button
            type="button"
            className="icon-btn"
            title="Выйти"
            aria-label="Выйти"
            onClick={onLogout}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
