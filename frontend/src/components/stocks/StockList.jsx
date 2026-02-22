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
      <div className="flex justify-between items-center mb-6">

        <h2 className="text-2xl font-bold text-gray-800">
          Остатки на складе
        </h2>

        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
        >
          + Добавить
        </button>

      </div>

      {/* Фильтры */}
      <div className="flex flex-wrap gap-2 mb-4">

        <button
          onClick={() => setTypeFilter("all")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition
          ${
            typeFilter === "all"
              ? "bg-gray-800 text-white"
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          <i className="fas fa-layer-group"></i>
          Все
        </button>

        {Object.entries(CLOTHES_TYPE_UI).map(([key, ui]) => (

          <button
            key={key}
            onClick={() => setTypeFilter(key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition
            ${
              typeFilter === key
                ? `${ui.bg} ${ui.text} border-transparent`
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >

            <i className={ui.icon}></i>
            {ui.label}

          </button>

        ))}

      </div>

      {/* Таблица */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

        <div className="overflow-x-auto">

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

                <th className="px-6 py-4 text-center text-xs font-semibold uppercase">
                  Действия
                </th>

              </tr>

            </thead>

            <tbody className="divide-y">

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

                  <tr key={stock.id} className="hover:bg-gray-50">

                    {/* Наименование + значок */}
                    <td className="px-6 py-4">

                      <div className="flex items-center space-x-3">

                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${ui?.bg}`}>

                          <i className={`${ui?.icon} ${ui?.text}`}></i>

                        </div>

                        <span className="font-semibold text-gray-800">

                          {stock.item_name}

                        </span>

                      </div>

                    </td>

                    {/* Размер */}
                    <td className="px-6 py-4">

                      {renderSize(stock)}

                    </td>

                    {/* Количество */}
                    <td className="px-6 py-4 text-right font-semibold">

                      {stock.quantity}

                    </td>

                    {/* Действия */}
                    <td className="px-6 py-4">

                      <div className="flex justify-center gap-2">

                        <button
                          onClick={() => handleEdit(stock)}
                          className="px-3 py-1 text-sm rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
                        >
                          <i className="fas fa-edit"></i>
                        </button>

                        <button
                          onClick={() => setStockToDelete(stock)}
                          className="px-3 py-1 text-sm rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                        >
                          <i className="fas fa-trash"></i>
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
            Удалить запись
          </h2>

          <p className="mb-6">
            Удалить <strong>{stockToDelete.item_name}</strong>?
          </p>

          <div className="flex justify-end gap-4">

            <button
              onClick={() => setStockToDelete(null)}
              className="px-4 py-2 border rounded-lg"
            >
              Отмена
            </button>

            <button
              onClick={handleDeleteStock}
              className="px-4 py-2 bg-red-600 text-white rounded-lg"
            >
              Удалить
            </button>

          </div>

        </StockModal>
      )}

    </div>
  );
}
