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
    .then(res => {
      const data = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];
      setPositions(data);
    })
    .catch(err => {
      console.error(err);
      setPositions([]);
    });
};

  useEffect(() => {
      loadPositions();
  }, []);


  return (
  <div>
    {/* Заголовок */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">
          Должности
        </h2>
        <p className="text-base text-gray-600 mt-2">
          Управление списком должностей
        </p>
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold text-base"
      >
        + Добавить должность
      </button>
    </div>

    {/* Таблица */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr className="text-gray-500 text-sm uppercase tracking-wide">
              <th className="px-6 py-4 font-semibold">Должность</th>
              <th className="px-6 py-4 text-right font-semibold">Действия</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {positions.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-user-tie text-purple-600 text-lg"></i>
                    </div>

                    <div>
                      <div className="font-semibold text-gray-800 text-base">
                        {p.name}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setPositionToEdit(p)}
                      className="icon-btn"
                    >
                      <i className="fa-solid fa-pen"></i>
                    </button>

                    <button
                      onClick={() => setPositionToDelete(p)}
                      className="icon-btn-danger"
                    >
                      <i className="fa-regular fa-trash-can"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Модалка добавления */}
        {showModal && (
          <PositionModal onClose={() => setShowModal(false)}>
            <PositionForm
              onSuccess={() => {
                setShowModal(false);
                loadPositions();
              }}
            />
          </PositionModal>
        )}

        {/* Модалка редактирования */}
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

        {/* Модалка удаления */}
        {positionToDelete && (
          <PositionModal onClose={() => setPositionToDelete(null)}>
            <h2 className="text-2xl font-bold mb-4">
              Удалить должность
            </h2>

            <p className="text-base text-gray-600 mb-6">
              Вы уверены, что хотите удалить должность{" "}
              <strong>{positionToDelete.name}</strong>?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPositionToDelete(null)}
                className="px-5 py-3 rounded-xl border border-gray-300 text-base hover:bg-gray-50"
              >
                Отмена
              </button>

              <button
                onClick={deletePosition}
                className="px-5 py-3 rounded-xl bg-red-600 text-white text-base hover:bg-red-700"
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
