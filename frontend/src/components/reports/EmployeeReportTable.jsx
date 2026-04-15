import React from "react";

export default function EmployeeReportTable({
  employee,
  items,
  loading,
  onWriteOff,
  onEdit,
  onDelete,
}) {
  if (loading) {
    return (
      <div className="py-10 text-center text-gray-400">
        Загрузка...
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="py-10 text-center text-gray-400">
        Нет данных по выдаче
      </div>
    );
  }

  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-gray-50">
          <tr className="text-gray-500 text-sm uppercase tracking-wide">
            <th className="px-6 py-4 font-semibold">Наименование</th>
            <th className="px-6 py-4 text-center font-semibold">Кол-во</th>
            <th className="px-6 py-4 text-center font-semibold">Размер</th>
            <th className="px-6 py-4 text-center font-semibold">Рост</th>
            <th className="px-6 py-4 text-center font-semibold">Дата выдачи</th>
            <th className="px-6 py-4 text-center font-semibold">Срок окончания</th>
            <th className="px-6 py-4 text-center font-semibold">Статус</th>
            <th className="px-6 py-4 text-right font-semibold">Действия</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 transition">
              <td className="px-6 py-4">
                <div className="font-semibold text-gray-800 text-base">
                  {item.item_name}
                </div>
              </td>

              <td className="px-6 py-4 text-center text-gray-600 text-base">
                {item.quantity}
              </td>

              <td className="px-6 py-4 text-center text-gray-600 text-base">
                {item.size || "—"}
              </td>

              <td className="px-6 py-4 text-center text-gray-600 text-base">
                {item.height || "—"}
              </td>

              <td className="px-6 py-4 text-center text-gray-600 text-base">
                {item.date_received}
              </td>

              <td className="px-6 py-4 text-center text-gray-600 text-base">
                {item.date_expire}
              </td>

              <td className="px-6 py-4 text-center">
                {item.status === "expired" ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
                    Просрочено
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                    Выдано
                  </span>
                )}
              </td>

              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  {item.status !== "expired" && (
                    <>
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="icon-btn"
                        title="Редактировать"
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        className="icon-btn-danger"
                        title="Удалить и вернуть на склад"
                      >
                        <i className="fa-regular fa-trash-can"></i>
                      </button>
                    </>
                  )}

                  {item.status === "expired" && (
                    <button
                      type="button"
                      onClick={() => onWriteOff(item.id)}
                      className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition"
                    >
                      Списать
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}