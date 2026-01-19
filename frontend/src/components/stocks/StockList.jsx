import { useEffect, useState } from "react";
import api from "../../api/api";
import StockModal from "./StockModal";
import StockForm from "./StockForm";

export default function StockList() {
  const [stocks, setStocks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingStock, setEditingStock] = useState(null);

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

  useEffect(() => {
    loadStocks();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Остатки на складе
            </h2>

          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            + Добавить партию
          </button>
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

                          <div>
                            <div className="font-semibold text-gray-800">
                              {stock.item_name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Размер */}
                      <td className="px-6 py-4">
                        {stock.size ?? "—"}
                      </td>

                      {/* Количество */}
                      <td className="px-6 py-4 text-right font-semibold">
                        {stock.quantity}
                      </td>

                      {/* Дата */}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {stock.date_income}
                      </td>

                      {/* Действия */}
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


          {showModal && (
              <StockModal onClose={() => setShowModal(false)}>
                <StockForm
                  onSuccess={() => {
                    setShowModal(false);
                    loadStocks(); // обновляем таблицу
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
                    loadStocks(); // обновляем список
                  }}
                />
              </StockModal>
            )}


        </div>
      </div>
    </div>
  );
}
