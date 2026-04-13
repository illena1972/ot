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
    return <div className="p-4 text-gray-500">Загрузка...</div>;
  }

  if (!items.length) {
    return (
      <div className="p-4 text-gray-500">
        Нет данных по выдаче
      </div>
    );
  }

  return (
    <div className="mt-4">


      <table className="w-full border border-gray-200 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Наименование</th>
            <th className="p-2 text-center">Количество</th>
            <th className="p-2 text-center">Размер</th>
            <th className="p-2 text-center">Рост</th>
            <th className="p-2 text-center">Дата выдачи</th>
            <th className="p-2 text-center">Срок окончания</th>
            <th className="p-2 text-center">Статус</th>
            <th className="p-2 text-center">Действия</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t">
              <td className="p-2">{item.item_name}</td>

              <td className="p-2 text-center">{item.quantity}</td>

              <td className="p-2 text-center">{item.size || "-"}</td>

              <td className="p-2 text-center">{item.height || "-"}</td>

              <td className="p-2 text-center">{item.date_received}</td>

              <td className="p-2 text-center">{item.date_expire}</td>

              <td className="p-2 text-center">
                {item.status === "expired" ? (
                  <span className="text-red-600 ">
                    Просрочено
                  </span>
                ) : (
                  <span className="text-green-600">
                    Выдано
                  </span>
                )}
              </td>

              <td className="p-2 text-center">
                <div className="flex justify-center gap-2">

                  {/* для активных */}
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

                  {/* для просроченных */}
                  {item.status === "expired" && (
                    <button
                      type="button"
                      onClick={() => onWriteOff(item.id)}
                      className="btn-danger"
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