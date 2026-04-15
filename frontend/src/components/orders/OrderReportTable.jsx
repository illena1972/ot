const CLOTHES_TYPE_UI = {
  top: {
    bg: "bg-blue-100",
    text: "text-blue-600",
    icon: "fas fa-tshirt",
    label: "Верхняя одежда",
  },
  shoes: {
    bg: "bg-green-100",
    text: "text-green-600",
    icon: "fas fa-shoe-prints",
    label: "Обувь",
  },
  other: {
    bg: "bg-purple-100",
    text: "text-purple-600",
    icon: "fas fa-box",
    label: "Безразмерная",
  },
};

export default function OrderReportTable({
  items,
  loading,
  typeFilter,
  setTypeFilter,
  onSelectItem,
}) {
  return (
    <div className="space-y-4">

      {/* FILTER */}
      <div className="flex flex-wrap gap-2">

        <button
          onClick={() => setTypeFilter("all")}
          className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
            typeFilter === "all"
              ? "bg-gray-800 text-white"
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          <i className="fas fa-layer-group mr-2"></i>
          Все
        </button>

        {Object.entries(CLOTHES_TYPE_UI).map(([key, ui]) => (
          <button
            key={key}
            onClick={() => setTypeFilter(key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
              typeFilter === key
                ? `${ui.bg} ${ui.text} border-transparent`
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            <i className={`${ui.icon} mr-2 text-sm`}></i>
            {ui.label}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead className="bg-gray-50">
              <tr className="text-gray-500 text-sm uppercase tracking-wide">
                <th className="px-6 py-4 font-semibold">Наименование</th>
                <th className="px-6 py-4 text-center font-semibold">Размер</th>
                <th className="px-6 py-4 text-center font-semibold">Рост</th>
                <th className="px-6 py-4 text-center font-semibold">Количество</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {loading && (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-gray-400">
                    Загрузка...
                  </td>
                </tr>
              )}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-gray-400">
                    Нет данных
                  </td>
                </tr>
              )}

              {items.map((item) => {
                const ui = CLOTHES_TYPE_UI[item.item_type] || CLOTHES_TYPE_UI[item.type] || {
                  bg: "bg-gray-100",
                  text: "text-gray-600",
                  icon: "fas fa-box",
                };

                return (
                  <tr
                    key={`${item.item_id}-${item.size}-${item.height}`}
                    className="hover:bg-gray-50 transition"
                  >
                    {/* Наименование */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ui.bg}`}>
                          <i className={`${ui.icon} ${ui.text} text-sm`}></i>
                        </div>

                        <button
                          onClick={() => onSelectItem(item)}
                          className="font-semibold text-gray-800 text-base hover:text-blue-600 transition"
                        >
                          {item.item_name}
                        </button>
                      </div>
                    </td>

                    {/* Размер */}
                    <td className="px-6 py-4 text-center text-gray-600 text-base">
                      {item.size || "—"}
                    </td>

                    {/* Рост */}
                    <td className="px-6 py-4 text-center text-gray-600 text-base">
                      {item.height || "—"}
                    </td>

                    {/* Количество */}
                    <td className="px-6 py-4 text-center font-semibold text-gray-800">
                      {item.total_quantity}
                    </td>
                  </tr>
                );
              })}

            </tbody>
          </table>

        </div>
      </div>

    </div>
  );
}