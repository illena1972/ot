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

      const res = await api.get(
        "reports/order/detail/",
        { params }
      );

      setRows(res.data);

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }

  };

  if (loading)
    return <div>Загрузка...</div>;

  return (

    <table className="w-full">

      <thead>

        <tr className="bg-gray-50">

          <th className="p-3 text-left">
            Сотрудник
          </th>

          <th className="p-3 text-center">
            Количество
          </th>

          <th className="p-3 text-center">
            Дата выдачи
          </th>

          <th className="p-3 text-center">
            Дата окончания
          </th>

        </tr>

      </thead>

      <tbody>

        {rows.map(row => (

          <tr key={row.id} className="border-b">

            <td className="p-3">
              {row.employee_name}
            </td>

            <td className="p-3 text-center">
              {row.quantity}
            </td>

            <td className="p-3 text-center">
              {row.date_received}
            </td>

            <td className="p-3 text-center">
              {row.date_expire}
            </td>

          </tr>

        ))}

      </tbody>

    </table>

  );

}