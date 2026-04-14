import { useEffect, useState } from "react";
import api from "../../api/api";
import ServiceModal from "./ServiceModal";
import ServiceForm from "./ServiceForm";




export default function ServiceList() {
  const [services, setServices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [serviceToEdit, setServiceToEdit] = useState(null);

  const deleteService = async () => {
  try {
    await api.delete(`services/${serviceToDelete.id}/`);
    setServiceToDelete(null);
    loadServices();
  } catch (err) {
    console.error(err);
    alert("Ошибка при удалении");
  }
};


  const loadServices = () => {
  api.get("services/")
    .then(res => {
      const data = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];
      setServices(data);
    })
    .catch(err => {
      console.error(err);
      setServices([]);
    });
  };


  useEffect(() => {
      loadServices();
  }, []);


  return (
  <div>
    {/* Заголовок */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">
          Службы
        </h2>
        <p className="text-base text-gray-600 mt-2">
          Управление списком служб
        </p>
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold text-base"
      >
        + Добавить службу
      </button>
    </div>

    {/* Таблица */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr className="text-gray-500 text-sm uppercase tracking-wide">
              <th className="px-6 py-4 font-semibold">Служба</th>
              <th className="px-6 py-4 text-right font-semibold">Действия</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {services.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-users-gear text-green-600 text-lg"></i>
                    </div>

                    <div>
                      <div className="font-semibold text-gray-800 text-base">
                        {s.name}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setServiceToEdit(s)}
                      className="icon-btn"
                    >
                      <i className="fa-solid fa-pen"></i>
                    </button>

                    <button
                      onClick={() => setServiceToDelete(s)}
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
          <ServiceModal onClose={() => setShowModal(false)}>
            <ServiceForm
              onSuccess={() => {
                setShowModal(false);
                loadServices();
              }}
            />
          </ServiceModal>
        )}

        {/* Модалка редактирования */}
        {serviceToEdit && (
          <ServiceModal onClose={() => setServiceToEdit(null)}>
            <ServiceForm
              service={serviceToEdit}
              onSuccess={() => {
                setServiceToEdit(null);
                loadServices();
              }}
            />
          </ServiceModal>
        )}

        {/* Модалка удаления */}
        {serviceToDelete && (
          <ServiceModal onClose={() => setServiceToDelete(null)}>
            <h2 className="text-2xl font-bold mb-4">
              Удалить службу
            </h2>

            <p className="text-base text-gray-600 mb-6">
              Вы уверены, что хотите удалить службу{" "}
              <strong>{serviceToDelete.name}</strong>?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setServiceToDelete(null)}
                className="px-5 py-3 rounded-xl border border-gray-300 text-base hover:bg-gray-50"
              >
                Отмена
              </button>

              <button
                onClick={deleteService}
                className="px-5 py-3 rounded-xl bg-red-600 text-white text-base hover:bg-red-700"
              >
                Удалить
              </button>
            </div>
          </ServiceModal>
        )}
      </div>
    </div>
  </div>
);


  }
