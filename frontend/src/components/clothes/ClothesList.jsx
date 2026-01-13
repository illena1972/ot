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




  return (

   <div>
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Одежда
          </h2>
          <p className="text-gray-600 mt-2">
            Управление каталогом одежды
          </p>
        </div>

        <button onClick={() => setShowModal(true)}
          className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
          + Добавить одежду
        </button>



      </div>

      {/* Таблица */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Наименование</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Тип одежды</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase">Действия</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {clothes.map(cl => {
                const ui = CLOTHES_TYPE_UI[cl.type] || {};
                return (
                <tr key={cl.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold">
                    <div className="flex items-center space-x-3">
                       <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${ui.bg}`}>
                          <i className={`${ui.icon} ${ui.text}`}></i>
                        </div>
                    <span className="text-gray-600">{cl.name}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 ">
                    <div className="flex items-center space-x-3">

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${ui.bg} ${ui.text}`}
                    >
                      {cl.type_label}
                    </span>
                    </div>
                  </td>

                  <td className="px-1 py-4 text-right">
                    <button onClick={() => setClothesToEdit(cl)} className="text-blue-600 hover:text-blue-800 mr-1">
                         <i className="fas fa-edit"></i>
                    </button>
                    <button onClick={() => setClothesToDelete(cl)} className="text-red-600 hover:text-red-800">
                         <i className="fas fa-trash"></i>
                    </button>

                  </td>
                </tr>
                );
                })}

            </tbody>

          </table>

            {showModal && (
              <ClothesModal onClose={() => setShowModal(false)}>
                <ClothesForm
                  onSuccess={() => {
                    setShowModal(false);
                    loadClothes(); // обновим таблицу
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
                <h2 className="text-xl font-bold mb-4">
                  Удалить одежду
                </h2>

                <p className="text-gray-600 mb-6">
                  Вы уверены, что хотите удалить одежду{" "}
                  <strong>
                    {clothesToDelete.name}
                  </strong>
                  ?
                </p>

                <div className="flex justify-end space-x-4">
                  <button onClick={() => setСlothesToDelete(null)}
                    className="px-4 py-2 rounded-lg border"
                  >
                    Отмена
                  </button>

                  <button onClick={deleteСlothes}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
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
