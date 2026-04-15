import { useEffect, useState } from "react";
import api from "../../api/api";
import ClothesModal from "./ClothesModal";
import ClothesForm from "./ClothesForm";

export default function ClothesList() {
  const [clothes, setClothes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [clothesToEdit, setClothesToEdit] = useState(null);
  const [clothesToDelete, setClothesToDelete] = useState(null);

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




    // функция удаления
    const deleteСlothes = async () => {
      try {
        await api.delete(`clothes/${clothesToDelete.id}/`);
        setClothesToDelete(null);
        loadClothes();
      } catch (err) {
        console.error(err);
        alert("Ошибка при удалении");
      }
    };

  useEffect(() => {
    api.get("clothes/")
      .then(res => setClothes(res.data))
      .catch(err => console.error(err));
  }, []);

  const loadClothes = () => {
  api.get("clothes/")
    .then(res => setClothes(res.data))
    .catch(err => console.error(err));
  };

  useEffect(() => {
    loadClothes();
  }, []);

  const [typeFilter, setTypeFilter] = useState("all");

  const filteredClothes =
  typeFilter === "all"
    ? clothes
    : clothes.filter(cl => cl.type === typeFilter);

   return (
  <div>
    {/* Заголовок */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">
          Одежда
        </h2>
        <p className="text-base text-gray-600 mt-2">
          Управление каталогом одежды
        </p>
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold text-base"
      >
        + Добавить одежду
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
          <i className={`${ui.icon} mr-2 text-sm`}></i>
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
              <th className="px-6 py-4 font-semibold">Тип</th>
              <th className="px-6 py-4 text-right font-semibold">Действия</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {filteredClothes.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center py-10 text-gray-400">
                  Нет одежды
                </td>
              </tr>
            )}

            {filteredClothes.map((cl) => {
              const ui = CLOTHES_TYPE_UI[cl.type] || {};

              return (
                <tr key={cl.id} className="hover:bg-gray-50 transition">
                  {/* Наименование */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${ui.bg}`}>
                        <i className={`${ui.icon} ${ui.text} text-lg`}></i>
                      </div>

                      <span className="font-semibold text-gray-800 text-base">
                        {cl.name}
                      </span>
                    </div>
                  </td>

                  {/* Тип */}
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${ui.bg} ${ui.text}`}>
                      {cl.type_label}
                    </span>
                  </td>

                  {/* Действия */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setClothesToEdit(cl)}
                        className="icon-btn"
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>

                      <button
                        onClick={() => setClothesToDelete(cl)}
                        className="icon-btn-danger"
                      >
                        <i className="fa-regular fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Модалки */}
        {showModal && (
          <ClothesModal onClose={() => setShowModal(false)}>
            <ClothesForm
              onSuccess={() => {
                setShowModal(false);
                loadClothes();
              }}
            />
          </ClothesModal>
        )}

        {clothesToEdit && (
          <ClothesModal onClose={() => setClothesToEdit(null)}>
            <ClothesForm
              clothes={clothesToEdit}
              onSuccess={() => {
                setClothesToEdit(null);
                loadClothes();
              }}
            />
          </ClothesModal>
        )}

        {clothesToDelete && (
          <ClothesModal onClose={() => setClothesToDelete(null)}>
            <h2 className="text-2xl font-bold mb-4">
              Удалить одежду
            </h2>

            <p className="text-base text-gray-600 mb-6">
              Вы уверены, что хотите удалить{" "}
              <strong>{clothesToDelete.name}</strong>?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setClothesToDelete(null)}
                className="px-5 py-3 rounded-xl border border-gray-300 hover:bg-gray-50"
              >
                Отмена
              </button>

              <button
                onClick={deleteСlothes}
                className="px-5 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700"
              >
                Удалить
              </button>
            </div>
          </ClothesModal>
        )}
      </div>
    </div>
  </div>
);


}
