import { useEffect, useState } from "react";
import api from "../../api/api";
import PositionModal from "./PositionModal";
import PositionForm from "./PositionForm";




export default function PositionList() {
  const [positions, setPositions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [positionToDelete, setPositionToDelete] = useState(null);
  const [positionToEdit, setPositionToEdit] = useState(null);

  const deletePosition = async () => {
  try {
    await api.delete(`positions/${positionToDelete.id}/`);
    setPositionToDelete(null);
    loadPositions();
  } catch (err) {
    console.error(err);
    alert("Ошибка при удалении");
  }
};



  const loadPositions = () => {
  api.get("positions/")
    .then(res => setPositions(res.data))
    .catch(err => console.error(err));
};


  useEffect(() => {
      loadPositions();
  }, []);


  return (
    <div>
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Должности
          </h2>
          <p className="text-gray-600 mt-2">
            Управление списком должностей
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
          + Добавить должность
        </button>



      </div>

      {/* Таблица */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Наименование</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase">Действия</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {positions.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold">
                    <div className="flex items-center space-x-3">

                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                             <i className="fas fa-user-tie text-purple-600 text-xl"></i>
                        </div>
                    <span className="font-semibold text-gray-800">{p.name}</span>
                    </div>




                  </td>

                  <td className="px-1 py-4 text-right">
                    <button onClick={() => setPositionToEdit(p)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 mr-1">
                         <i className="fas fa-edit"></i>
                    </button>
                    <button  onClick={() => setPositionToDelete(p)} className="p-2 rounded-lg hover:bg-red-50 text-red-600">
                         <i className="fas fa-trash"></i>
                    </button>

                  </td>
                </tr>
              ))}
            </tbody>

          </table>

          {showModal && (
              <PositionModal onClose={() => setShowModal(false)}>
                <PositionForm
                  onSuccess={() => {
                    setShowModal(false);
                    loadPositions(); // обновим таблицу
                  }}
                />
              </PositionModal>
            )}

            {positionToEdit && (
              <PositionModal onClose={() => setPositionToEdit(null)}>
                <PositionForm
                  position={positionToEdit}
                  onSuccess={() => {
                    setPositionToEdit(null);
                    loadPositions();
                  }}
                />
              </PositionModal>
            )}



            {positionToDelete && (
              <PositionModal onClose={() => setPositionToDelete(null)}>
                <h2 className="text-xl font-bold mb-4">
                  Удалить должность
                </h2>

                <p className="text-gray-600 mb-6">
                  Вы уверены, что хотите удалить должность{" "}
                  <strong>
                    {positionToDelete.name}
                  </strong>
                  ?
                </p>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setPositionToDelete(null)}
                    className="px-4 py-2 rounded-lg border"
                  >
                    Отмена
                  </button>

                  <button
                    onClick={deletePosition}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                  >
                    Удалить
                  </button>
                </div>
              </PositionModal>
            )}



        </div>
      </div>
    </div>
  );
}
