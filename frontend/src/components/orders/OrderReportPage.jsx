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

      const res = await api.get(
        "reports/order/",
        { params }
      );

      setItems(res.data);

    } catch (err) {

      console.error("Ошибка загрузки отчета", err);

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

    <div className="p-6 space-y-4">


      {/* HEADER */}
      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-2xl font-bold">
            Отчет для заказа спецодежды
          </h1>

          <p className="text-gray-500">
            Спецодежда с оставшимся сроком менее 6 месяцев
          </p>
        </div>


        {/* КНОПКА EXPORT */}
        <button
          onClick={handleExport}
          className="
            bg-green-600
            hover:bg-green-700
            text-white
            px-5 py-2.5
            rounded-lg
            font-semibold
            flex items-center gap-2
            transition
          "
        >
          <i className="fas fa-file-excel"></i>
          Экспорт в Excel
        </button>

      </div>



      {/* TABLE */}
      <OrderReportTable
        items={items}
        loading={loading}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        onSelectItem={setSelectedItem}
      />



      {/* MODAL DETAIL */}
      {selectedItem && (

        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={`Выдано сотрудникам: ${selectedItem.item_name}`}
          width="max-w-5xl"
        >

          <OrderReportDetail
            item={selectedItem}
          />

        </Modal>

      )}

    </div>

  );

}