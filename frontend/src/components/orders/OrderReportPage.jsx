import { useEffect, useState } from "react";
import api from "../../api/api";

import OrderReportTable from "./OrderReportTable";
import OrderReportDetail from "./OrderReportDetail";

import Modal from "../ui/Modal";// путь к Modal.jsx

export default function OrderReportPage() {

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [typeFilter, setTypeFilter] = useState("all");

  const [selectedItem, setSelectedItem] = useState(null);


  // загрузка отчета
  const loadReport = async () => {
      setLoading(true);

      try {
        const params =
          typeFilter === "all"
            ? {}
            : { type: typeFilter };

        const res = await api.get("reports/order/", { params });

        const data = Array.isArray(res.data)
          ? res.data
          : res.data.results || [];

        setItems(data);
      } catch (err) {
        console.error("Ошибка загрузки отчета", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {

    loadReport();

  }, [typeFilter]);


  // ✅ экспорт Excel
  const handleExport = async () => {

    try {

      const params =
        typeFilter === "all"
          ? {}
          : { type: typeFilter };

      const response = await api.get(
        "reports/order/export/",
        {
          params,
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data])
      );

      const link = document.createElement("a");

      link.href = url;
      link.setAttribute(
        "download",
        "order_report.xlsx"
      );

      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (err) {

      console.error("Ошибка экспорта", err);
      alert("Ошибка экспорта Excel");

    }

  };

  return (

  <div className="space-y-6">
    {/* Заголовок */}

    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Отчет для заказа спецодежды
        </h1>

        <p className="text-base text-gray-600 mt-2">
          Спецодежда с оставшимся сроком менее 6 месяцев
        </p>
      </div>

      <button
        onClick={handleExport}
        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-semibold text-base transition"
      >
        <i className="fa-solid fa-file-excel"></i>
        Экспорт в Excel
      </button>
    </div>

    {/* Таблица */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <OrderReportTable
        items={items}
        loading={loading}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        onSelectItem={setSelectedItem}
      />
    </div>

    {/* Детализация */}
    {selectedItem && (
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={`Выдано сотрудникам: ${selectedItem.item_name}`}
        width="max-w-6xl"
      >
        <OrderReportDetail item={selectedItem} />
      </Modal>
    )}
  </div>
);


}