import { useEffect, useState } from "react";
import api from "../../api/api";

export default function OrderReportDetail({ item }) {

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [item]);

  const loadData = async () => {
    try {
      setLoading(true);

      const params = {
        item_id: item.item_id,
        size: item.size,
        height: item.height,
      };

      const res = await api.get("reports/order/detail/", { params });

      const data = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];

      setRows(data);

    } catch (err) {
      console.error(err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-10 text-center text-gray-400">
        Загрузка...
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="py-10 text-center text-gray-400">
        Нет данных
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Заголовок блока */}
      <div className="text-base text-gray-600">
        Сотрудники, у которых выдана эта позиция
      </div>

      {/* Таблица */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead className="bg-gray-50">
              <tr className="text-gray-500 text-sm uppercase tracking-wide">
                <th className="px-6 py-4 font-semibold">Сотрудник</th>
                <th className="px-6 py-4 text-center font-semibold">Кол-во</th>
                <th className="px-6 py-4 text-center font-semibold">Дата выдачи</th>
                <th className="px-6 py-4 text-center font-semibold">Дата окончания</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition">

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">

                      <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                        <i className="fa-solid fa-user text-blue-600 text-sm"></i>
                      </div>

                      <span className="font-semibold text-gray-800 text-base">
                        {row.employee_name}
                      </span>

                    </div>
                  </td>

                  <td className="px-6 py-4 text-center text-gray-600 text-base">
                    {row.quantity}
                  </td>

                  <td className="px-6 py-4 text-center text-gray-600 text-base">
                    {row.date_received}
                  </td>

                  <td className="px-6 py-4 text-center text-gray-600 text-base">
                    {row.date_expire}
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>
      </div>

    </div>
  );
}