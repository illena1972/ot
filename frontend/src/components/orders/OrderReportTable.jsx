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

    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">

      {/* FILTER */}
      <div className="flex flex-wrap gap-2 p-4 border-b">

        <button
          onClick={() => setTypeFilter("all")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition
          ${
            typeFilter === "all"
              ? "bg-gray-800 text-white"
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          <i className="fas fa-layer-group"></i>
          Все
        </button>

        {Object.entries(CLOTHES_TYPE_UI).map(([key, ui]) => (

          <button
            key={key}
            onClick={() => setTypeFilter(key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition
            ${
              typeFilter === key
                ? `${ui.bg} ${ui.text} border-transparent`
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            <i className={ui.icon}></i>
            {ui.label}
          </button>

        ))}

      </div>

      {/* TABLE */}
      <table className="w-full">

        <thead className="bg-gray-50 border-b">

          <tr>

            <th className="p-3 text-left font-semibold">
              Наименование
            </th>

            <th className="p-3 text-center font-semibold">
              Размер
            </th>

            <th className="p-3 text-center font-semibold">
              Рост
            </th>

            <th className="p-3 text-center font-semibold">
              Количество
            </th>

          </tr>

        </thead>

        <tbody>

          {loading && (
            <tr>
              <td colSpan="4" className="text-center p-6">
                Загрузка...
              </td>
            </tr>
          )}

          {!loading && items.length === 0 && (
            <tr>
              <td colSpan="4" className="text-center p-6 text-gray-400">
                Нет данных
              </td>
            </tr>
          )}

          {items.map(item => (

            <tr
              key={`${item.item_id}-${item.size}-${item.height}`}
              className="border-b hover:bg-gray-50"
            >

              <td className="p-3">

                <button
                  onClick={() => onSelectItem(item)}
                  className="text-blue-600 font-semibold"
                >
                  {item.item_name}
                </button>

              </td>

              <td className="p-3 text-center">
                {item.size || "—"}
              </td>

              <td className="p-3 text-center">
                {item.height || "—"}
              </td>

              <td className="p-3 text-center font-semibold">
                {item.total_quantity}
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}