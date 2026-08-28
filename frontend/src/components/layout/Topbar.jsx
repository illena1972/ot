export default function Topbar({ organization, loading }) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-800">Система учета спецодежды</h2>
        <div className="min-w-0 text-right">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Организация
          </div>
          <div className="truncate text-sm font-semibold text-blue-800">
            {loading ? "Загрузка..." : organization?.name || "Не определена"}
          </div>
        </div>
      </div>
    </header>
  );
}
