import { useEffect, useState } from "react";
import api from "../../api/api";
import StockModal from "./StockModal";
import StockForm from "./StockForm";

export default function StockList() {
  const [stocks, setStocks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [stockToDelete, setStockToDelete] = useState(null);

  // для разных вкладок
  const [viewMode, setViewMode] = useState("batches");
  // "batches" | "summary"



  const CLOTHES_TYPE_UI = {
  top: {
    bg: "bg-blue-100",
    text: "text-blue-600",
    icon: "fas fa-tshirt",
    label: "Верхняя одежда",
  },
  shoes: {
    bg: "bg-green-100",
    text: "text-green-600",
    icon: "fas fa-shoe-prints",
    label: "Обувь",
  },
  other: {
    bg: "bg-purple-100",
    text: "text-purple-600",
    icon: "fas fa-box",
    label: "Безразмерная",
  },
};

  const loadStocks = () => {
    api.get("stocks/")
      .then(res => setStocks(res.data))
      .catch(err => console.error(err));
  };

  const handleEdit = (stock) => {
  setEditingStock(stock);
  };

  const handleDeleteStock = async () => {
  try {
    await api.delete(`stocks/${stockToDelete.id}/`);
    setStockToDelete(null);
    loadStocks(); // обновляем таблицу
  } catch (err) {
    console.error(err);
    alert("Ошибка при удалении партии");
  }
  };

  useEffect(() => {
    loadStocks();
  }, []);



    // -------------------------
    // АГРЕГАЦИЯ ОСТАТКОВ
    // -------------------------
    const stockSummaryMap = {};

    stocks.forEach(stock => {
      const key = `${stock.item}-${stock.size ?? "none"}`;

      if (!stockSummaryMap[key]) {
        stockSummaryMap[key] = {
          item_name: stock.item_name,
          item_type: stock.item_type,
          size: stock.size,
          quantity: 0,
        };
      }

      stockSummaryMap[key].quantity += stock.quantity;
    });

    const stockSummary = Object.values(stockSummaryMap);

    return (
  <div>
    {/* Заголовок + кнопка */}
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold text-gray-800">
        Остатки на складе
      </h2>

      <button
        onClick={() => setShowModal(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
      >
        + Добавить партию
      </button>
    </div>

    {/* Переключатель режимов */}
    <div className="flex space-x-2 mb-4">
      <button
        onClick={() => setViewMode("batches")}
        className={`px-4 py-2 rounded-lg ${
          viewMode === "batches"
            ? "bg-blue-600 text-white"
            : "border"
        }`}
      >
        Партии
      </button>

      <button
        onClick={() => setViewMode("summary")}
        className={`px-4 py-2 rounded-lg ${
          viewMode === "summary"
            ? "bg-blue-600 text-white"
            : "border"
        }`}
      >
        Остатки
      </button>
    </div>

    {/* Контейнер таблиц */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">

        {/* ================= ПАРТИИ ================= */}
        {viewMode === "batches" && (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                  Наименование
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                  Размер
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase">
                  Количество
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                  Дата поступления
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase">
                  Действия
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {stocks.map(stock => {
                const ui = CLOTHES_TYPE_UI[stock.item_type];

                return (
                  <tr key={stock.id} className="hover:bg-gray-50">
                    {/* Наименование + иконка */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${ui?.bg}`}
                        >
                          <i className={`${ui?.icon} ${ui?.text}`}></i>
                        </div>

                        <div className="font-semibold text-gray-800">
                          {stock.item_name}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {stock.size ?? "—"}
                    </td>

                    <td className="px-6 py-4 text-right font-semibold">
                      {stock.quantity}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {stock.date_income}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        className="text-blue-600 hover:text-blue-800 mr-3"
                        onClick={() => handleEdit(stock)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>

                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={() => setStockToDelete(stock)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {stocks.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    Нет данных
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* ================= ОСТАТКИ ================= */}
        {viewMode === "summary" && (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                  Наименование
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase">
                  Размер
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase">
                  Всего на складе
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {stockSummary.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold">
                    {row.item_name}
                  </td>

                  <td className="px-6 py-4">
                    {row.size ?? "—"}
                  </td>

                  <td className="px-6 py-4 text-right font-semibold">
                    {row.quantity}
                  </td>
                </tr>
              ))}

              {stockSummary.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center py-8 text-gray-500">
                    Нет данных
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>

    {/* ================= МОДАЛКИ ================= */}
    {showModal && (
      <StockModal onClose={() => setShowModal(false)}>
        <StockForm
          onSuccess={() => {
            setShowModal(false);
            loadStocks();
          }}
        />
      </StockModal>
    )}

    {editingStock && (
      <StockModal onClose={() => setEditingStock(null)}>
        <StockForm
          stock={editingStock}
          onSuccess={() => {
            setEditingStock(null);
            loadStocks();
          }}
        />
      </StockModal>
    )}

    {stockToDelete && (
      <StockModal onClose={() => setStockToDelete(null)}>
        <h2 className="text-xl font-bold mb-4">
          Удалить партию
        </h2>

        <p className="text-gray-600 mb-6">
          Вы уверены, что хотите удалить партию одежды{" "}
          <strong>{stockToDelete.item_name}</strong>
          {stockToDelete.size && <> (размер {stockToDelete.size})</>}
          ?
        </p>

        <div className="flex justify-end space-x-4">
          <button
            onClick={() => setStockToDelete(null)}
            className="px-4 py-2 rounded-lg border"
          >
            Отмена
          </button>

          <button
            onClick={handleDeleteStock}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            Удалить
          </button>
        </div>
      </StockModal>
    )}
  </div>
);

}
