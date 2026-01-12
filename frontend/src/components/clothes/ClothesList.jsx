import { useEffect, useState } from "react";
import api from "../../api/api";
import ClothesModal from "./ClothesModal";
import ClothesForm from "./ClothesForm";

export default function ClothesList() {
  const [clothes, setClothes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [clothesToEdit, setClothesToEdit] = useState(null);
  //const [itemToDelete, setItemToDelete] = useState(null);


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
              {clothes.map(cl => (
                <tr key={cl.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                             <i className="fas fa-tshirt text-blue-600"></i>
                        </div>
                    <span className="text-gray-600">{cl.name}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 ">
                    <div className="flex items-center space-x-3">

                    <span className="text-gray-600">{cl.type_label}</span>
                    </div>
                  </td>

                  <td className="px-1 py-4 text-right">
                    <button onClick={() => setClothesToEdit(cl)} className="text-blue-600 hover:text-blue-800 mr-1">
                         <i className="fas fa-edit"></i>
                    </button>
                    <button  className="text-red-600 hover:text-red-800">
                         <i className="fas fa-trash"></i>
                    </button>

                  </td>
                </tr>
              ))}
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

        </div>
      </div>
    </div>
  );

}
