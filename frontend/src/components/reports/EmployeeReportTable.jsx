import { useEffect, useState } from "react";
import api from "../../api/api";

export default function EmployeeReportTable({ employee }) {

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      load();
    }
  }, [employee]);

  const load = async () => {

    setLoading(true);

    try {

      const res = await api.get(
        `employees/${employee.id}/report/`
      );

      // ВАЖНО: items находятся внутри res.data.items
      setItems(res.data.items || []);

    } catch (err) {

      console.error("Ошибка загрузки отчета:", err);

    } finally {

      setLoading(false);

    }

  };

  const isExpired = (date_expire) => {

    if (!date_expire) return false;

    return new Date() >= new Date(date_expire);

  };

  if (!employee) return null;

  return (
    <div className="bg-white rounded-xl shadow p-4">

      <h2 className="text-lg font-semibold mb-4">
        Выдача сотруднику:
        {" "}
        {employee.full_name}
      </h2>

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

                const expired = isExpired(item.date_expire);

                return (

                  <tr key={item.id} className="border-t">

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

                      {expired ? (
                        <button className="text-red-600 underline">
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
