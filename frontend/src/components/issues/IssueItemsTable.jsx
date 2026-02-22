// таблица позиций
// таблица позиций с защитой от undefined полей
const CLOTHES_TYPE_UI = {
  top: {
    icon: "fas fa-tshirt",
    bg: "bg-blue-100",
    text: "text-blue-600",
  },
  shoes: {
    icon: "fas fa-shoe-prints",
    bg: "bg-green-100",
    text: "text-green-600",
  },
  other: {
    icon: "fas fa-box",
    bg: "bg-purple-100",
    text: "text-purple-600",
  },
};

export default function IssueItemsTable({ items, onRemove }) {
  if (!items || items.length === 0) {
    return <p className="text-gray-500">Позиции не добавлены</p>;
  }

  return (
    <table className="w-full border rounded-lg overflow-hidden">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-1 py-2 text-left">Наименование</th>
          <th className="px-4 py-2">Размер</th>
          <th className="px-4 py-2">Рост</th>
          <th className="px-4 py-2">Кол-во</th>
          <th className="px-4 py-2">Срок эксплуатации (мес.)</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {items.map((i, idx) => {
          const typeUI = CLOTHES_TYPE_UI[i.item_type] || {};
          return (
            <tr key={idx} className="border-t">
              {/* Наименование + иконка */}
              <td className="px-4 py-2">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      typeUI.bg ?? "bg-gray-200"
                    }`}
                  >
                    <i
                      className={`${typeUI.icon ?? "fas fa-box"} ${
                        typeUI.text ?? "text-gray-600"
                      }`}
                    />
                  </div>
                  <span className="font-medium text-gray-800">
                    {i.item_name ?? "—"}
                  </span>
                </div>
              </td>

              {/* Размер */}
              <td className="px-4 py-2 text-center">{i.size ?? "—"}</td>

              {/* Рост */}
              <td className="px-4 py-2 text-center">{i.height ?? "—"}</td>

              {/* Количество */}
              <td className="px-4 py-2 text-center">{i.quantity ?? "—"}</td>

              {/* Срок эксплуатации */}
              <td className="px-4 py-2 text-center">
                {i.operation_life_months ?? "—"}
              </td>

              {/* Кнопка удаления */}
              <td className="px-4 py-2 text-right">
                <button
                  onClick={() => onRemove(idx)}
                  className="text-red-600"
                >
                  ✕
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
