import { useEffect, useState } from "react";
import api from "../../api/api";
import StockModal from "./StockModal";
import StockForm from "./StockForm";

export default function StockList() {
  const [stocks, setStocks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [stockToDelete, setStockToDelete] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");

  // UI настройки типов одежды (как в старом)
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

  useEffect(() => {
    loadStocks();
  }, []);

  const handleEdit = (stock) => {
    setEditingStock(stock);
  };

  const handleDeleteStock = async () => {
    try {
      await api.delete(`stocks/${stockToDelete.id}/`);
      setStockToDelete(null);
      loadStocks();
    } catch (err) {
      console.error(err);
      alert("Ошибка при удалении");
    }
  };

  // ПРАВИЛЬНОЕ отображение размера (как было раньше)
  const renderSize = (stock) => {

    // Безразмерная одежда
    if (stock.item_type === "other") {
      return (
        <span className="text-gray-400 font-semibold">
          —
        </span>
      );
    }

    // Верхняя одежда → размер / рост
    if (stock.item_type === "top") {
      if (stock.size && stock.height) {
        return (
          <span className="font-semibold">
            {stock.size} / {stock.height}
          </span>
        );
      }
      return <span className="text-gray-400">—</span>;
    }

    // Обувь → только размер
    if (stock.item_type === "shoes") {
      return (
        <span className="font-semibold">
          {stock.size ?? "—"}
        </span>
      );
    }

    return "—";
  };

  // фильтр
  const filteredStocks =
    typeFilter === "all"
      ? stocks
      : stocks.filter(s => s.item_type === typeFilter);

  return (
  <div>
    {/* Заголовок */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <h2 className="text-3xl font-bold text-gray-800">
        Остатки на складе
      </h2>

      <button
        onClick={() => setShowModal(true)}
        className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold text-base"
      >
        + Добавить
      </button>
    </div>

    {/* Фильтр */}
    <div className="flex flex-wrap gap-2 mb-5">
      <button
        onClick={() => setTypeFilter("all")}
        className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
          typeFilter === "all"
            ? "bg-gray-800 text-white"
            : "bg-white text-gray-600 hover:bg-gray-100"
        }`}
      >
        Все
      </button>

      {Object.entries(CLOTHES_TYPE_UI).map(([key, ui]) => (
        <button
          key={key}
          onClick={() => setTypeFilter(key)}
          className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
            typeFilter === key
              ? `${ui.bg} ${ui.text} border-transparent`
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          <i className={`${ui.icon} mr-2`}></i>
          {ui.label}
        </button>
      ))}
    </div>

    {/* Таблица */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr className="text-gray-500 text-sm uppercase tracking-wide">
              <th className="px-6 py-4 font-semibold">Наименование</th>
              <th className="px-6 py-4 font-semibold">Размер</th>
              <th className="px-6 py-4 text-right font-semibold">Количество</th>
              <th className="px-6 py-4 text-right font-semibold">Действия</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {filteredStocks.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-10 text-gray-400">
                  Нет данных на складе
                </td>
              </tr>
            )}

            {filteredStocks.map((stock) => {
              const ui = CLOTHES_TYPE_UI[stock.item_type];

              return (
                <tr key={stock.id} className="hover:bg-gray-50 transition">
                  {/* Наименование */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${ui?.bg}`}>
                        <i className={`${ui?.icon} ${ui?.text} text-lg`}></i>
                      </div>

                      <span className="font-semibold text-gray-800 text-base">
                        {stock.item_name}
                      </span>
                    </div>
                  </td>

                  {/* Размер */}
                  <td className="px-6 py-4 text-gray-600 text-base">
                    {renderSize(stock)}
                  </td>

                  {/* Количество */}
                  <td className="px-6 py-4 text-right font-semibold text-gray-800">
                    {stock.quantity}
                  </td>

                  {/* Действия */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(stock)} className="icon-btn">
                        <i className="fa-solid fa-pen"></i>
                      </button>

                      <button onClick={() => setStockToDelete(stock)} className="icon-btn-danger">
                        <i className="fa-regular fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

    {/* Модалки */}
    {showModal && (
      <StockModal onClose={() => setShowModal(false)}>
        <StockForm onSuccess={() => {
          setShowModal(false);
          loadStocks();
        }} />
      </StockModal>
    )}

    {editingStock && (
      <StockModal onClose={() => setEditingStock(null)}>
        <StockForm stock={editingStock} onSuccess={() => {
          setEditingStock(null);
          loadStocks();
        }} />
      </StockModal>
    )}

    {stockToDelete && (
      <StockModal onClose={() => setStockToDelete(null)}>
        <h2 className="text-2xl font-bold mb-4">
          Удалить запись
        </h2>

        <p className="text-base text-gray-600 mb-6">
          Удалить <strong>{stockToDelete.item_name}</strong>?
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => setStockToDelete(null)}
            className="px-5 py-3 rounded-xl border border-gray-300 hover:bg-gray-50"
          >
            Отмена
          </button>

          <button
            onClick={handleDeleteStock}
            className="px-5 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700"
          >
            Удалить
          </button>
        </div>
      </StockModal>
    )}
  </div>
);
}
