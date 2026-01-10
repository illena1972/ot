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
    .then(res => setDepartments(res.data))
    .catch(err => console.error(err));
};


  useEffect(() => {
      loadDepartments();
  }, []);


  return (
    <div>
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Подразделения
          </h2>
          <p className="text-gray-600 mt-2">
            Управление списком подразделений
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
          + Добавить подразделение
        </button>



      </div>

      {/* Таблица */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments.map(dep => (
                <div
                  key={dep.id}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition"
                >
                  {/* Верх карточки */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-industry text-blue-600 text-xl"></i>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => setDepartmentToEdit(dep)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <i className="fas fa-edit"></i>
                      </button>

                      <button
                        onClick={() => setDepartmentToDelete(dep)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>

                  {/* Название */}
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {dep.name}
                  </h3>

                  {/* Количество сотрудников */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Сотрудников:</span>
                    <span className="font-semibold text-gray-800">
                      {dep.employee_count ?? "—"}
                    </span>
                  </div>
                </div>
              ))}
        </div>






















          {showModal && (
              <DepartmentModal onClose={() => setShowModal(false)}>
                <DepartmentForm
                  onSuccess={() => {
                    setShowModal(false);
                    loadDepartments(); // обновим таблицу
                  }}
                />
              </DepartmentModal>
            )}


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


            {departmentToDelete && (
                  <DepartmentModal onClose={() => setDepartmentToDelete(null)}>
                    <h2 className="text-xl font-bold mb-4">
                      Удалить подразделение
                    </h2>

                    <p className="text-gray-600 mb-6">
                      Вы уверены, что хотите удалить подразделение{" "}
                      <strong>
                        {departmentToDelete.name}
                      </strong>
                      ?
                    </p>

                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={() => setDepartmentToDelete(null)}
                        className="px-4 py-2 rounded-lg border"
                      >
                        Отмена
                      </button>

                      <button
                        onClick={deleteDepartment}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                      >
                        Удалить
                      </button>
                    </div>
                  </DepartmentModal>
                )}




        </div>
      </div>
    </div>
  );
}
