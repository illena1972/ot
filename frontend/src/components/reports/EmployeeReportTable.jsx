import { useEffect, useState } from "react";
import api from "../../api/api";

export default function EmployeeReportTable({
  employee,
  items,
  loading,
  onWriteOff
}) {


  if (!employee) return null;




  return (
    <div className="bg-white rounded-xl shadow p-4">

     

      {loading ? (
        <div>Загрузка...</div>
      ) : (

        <table className="w-full border">

          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Наименование</th>
              <th className="p-2">Размер</th>
              <th className="p-2">Рост</th>
              <th className="p-2">Количество</th>
              <th className="p-2">Дата выдачи</th>
              <th className="p-2">Дата списания</th>
              <th className="p-2">Статус</th>
            </tr>
          </thead>

          <tbody>

            {items.length === 0 ? (

              <tr>
                <td colSpan="7" className="text-center p-4 text-gray-500">
                  Нет данных
                </td>
              </tr>

            ) : (

              items.map(item => {

                return (

                  <tr key={item.id} className={`border-t ${ item.status === "expired" ? "bg-red-50" : "" }`}
>

                    <td className="p-2">
                      {item.item_name}
                    </td>

                    <td className="p-2 text-center">
                      {item.size || "—"}
                    </td>

                    <td className="p-2 text-center">
                      {item.height || "—"}
                    </td>

                    <td className="p-2 text-center">
                      {item.quantity}
                    </td>

                    <td className="p-2 text-center">
                      {item.date_received || "—"}
                    </td>

                    <td className="p-2 text-center">
                      {item.date_expire || "—"}
                    </td>

                    <td className="p-2 text-center">

                      {item.status === "expired" ? (
                        <button onClick={() => onWriteOff(item.id)} className="text-red-600 underline">
                          Списать
                        </button>
                      ) : (
                        <span className="text-green-600">
                          Выдано
                        </span>
                      )}

                    </td>

                  </tr>

                );

              })

            )}

          </tbody>

        </table>

      )}

    </div>
  );
}

