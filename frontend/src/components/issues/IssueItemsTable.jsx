// таблица позиций
// таблица позиций с защитой от undefined полей
export default function IssueItemsTable({ items, onRemove }) {

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

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        Позиции не добавлены
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">

      <table className="w-full text-left">

        <thead className="bg-gray-50">
          <tr className="text-gray-500 text-sm uppercase tracking-wide">

            <th className="px-6 py-4 font-semibold">Наименование</th>
            <th className="px-6 py-4 font-semibold">Размер</th>
            <th className="px-6 py-4 font-semibold">Рост</th>
            <th className="px-6 py-4 font-semibold">Кол-во</th>
            <th className="px-6 py-4 font-semibold">Срок (мес.)</th>
            <th className="px-6 py-4 text-right font-semibold">Действия</th>

          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">

          {items.map((i, idx) => {

            const typeUI = CLOTHES_TYPE_UI[i.item_type] || {};

            return (
              <tr key={idx} className="hover:bg-gray-50 transition">

                {/* Наименование */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">

                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${typeUI.bg || "bg-gray-100"}`}>
                      <i className={`${typeUI.icon || "fas fa-box"} ${typeUI.text || "text-gray-600"} text-sm`} />
                    </div>

                    <span className="font-semibold text-gray-800">
                      {i.item_name || "—"}
                    </span>

                  </div>
                </td>

                <td className="px-6 py-4 text-gray-600">{i.size || "—"}</td>
                <td className="px-6 py-4 text-gray-600">{i.height || "—"}</td>
                <td className="px-6 py-4 text-gray-600">{i.quantity || "—"}</td>
                <td className="px-6 py-4 text-gray-600">
                  {i.operation_life_months || "—"}
                </td>

                {/* Действия */}
                <td className="px-6 py-4 text-right">

                  <button
                    onClick={() => onRemove(idx)}
                    className="icon-btn-danger"
                  >
                    <i className="fa-regular fa-trash-can"></i>
                  </button>

                </td>

              </tr>
            );

          })}

        </tbody>

      </table>

    </div>
  );
}
