import { useEffect, useState } from "react";
import api from "../../api/api";
import DepartmentModal from "./DepartmentModal";
import DepartmentForm from "./DepartmentForm";




export default function DepartmentList() {
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [departmentToEdit, setDepartmentToEdit] = useState(null);


  const deleteDepartment = async () => {
  try {
    await api.delete(`departments/${departmentToDelete.id}/`);
    setDepartmentToDelete(null);
    loadDepartments();
  } catch (err) {
    console.error(err);
    alert("Ошибка при удалении");
  }
};


  const loadDepartments = () => {
  api.get("departments/")
    .then(res => {
      const data = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];
      setDepartments(data);
    })
    .catch(err => {
      console.error(err);
      setDepartments([]);
    });
};


  useEffect(() => {
      loadDepartments();
  }, []);


  return (
  <div>
    {/* Заголовок */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">
          Подразделения
        </h2>
        <p className="text-base text-gray-600 mt-2">
          Управление списком подразделений
        </p>
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold text-base"
      >
        + Добавить подразделение
      </button>
    </div>

    {/* Карточки */}
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {departments.map((dep) => (
        <div
          key={dep.id}
          className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition"
        >
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <i className="fa-solid fa-industry text-blue-600 text-xl"></i>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setDepartmentToEdit(dep)}
                className="icon-btn"
              >
                <i className="fa-solid fa-pen"></i>
              </button>

              <button
                onClick={() => setDepartmentToDelete(dep)}
                className="icon-btn-danger"
              >
                <i className="fa-regular fa-trash-can"></i>
              </button>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mb-3">
            {dep.name}
          </h3>

          <div className="flex items-center justify-between text-base">
            <span className="text-gray-500">Сотрудников:</span>
            <span className="font-semibold text-gray-800">
              {dep.employee_count ?? "—"}
            </span>
          </div>
        </div>
      ))}
    </div>

    {/* Модалка добавления */}
    {showModal && (
      <DepartmentModal onClose={() => setShowModal(false)}>
        <DepartmentForm
          onSuccess={() => {
            setShowModal(false);
            loadDepartments();
          }}
        />
      </DepartmentModal>
    )}

    {/* Модалка редактирования */}
    {departmentToEdit && (
      <DepartmentModal onClose={() => setDepartmentToEdit(null)}>
        <DepartmentForm
          department={departmentToEdit}
          onSuccess={() => {
            setDepartmentToEdit(null);
            loadDepartments();
          }}
        />
      </DepartmentModal>
    )}

    {/* Модалка удаления */}
    {departmentToDelete && (
      <DepartmentModal onClose={() => setDepartmentToDelete(null)}>
        <h2 className="text-2xl font-bold mb-4">
          Удалить подразделение
        </h2>

        <p className="text-base text-gray-600 mb-6">
          Вы уверены, что хотите удалить подразделение{" "}
          <strong>{departmentToDelete.name}</strong>?
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDepartmentToDelete(null)}
            className="px-5 py-3 rounded-xl border border-gray-300 text-base hover:bg-gray-50"
          >
            Отмена
          </button>

          <button
            onClick={deleteDepartment}
            className="px-5 py-3 rounded-xl bg-red-600 text-white text-base hover:bg-red-700"
          >
            Удалить
          </button>
        </div>
      </DepartmentModal>
    )}
  </div>
  );
}
