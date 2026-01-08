import { useEffect, useState } from "react";
import api from "../../api/api";
import DepartmentModal from "./DepartmentModal";
import DepartmentForm from "./DepartmentForm";




export default function DepartmentList() {
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);

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
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Наименование</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase">Действия</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {departments.map(dep => (
                <tr key={dep.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                             <i className="fas fa-user text-blue-600"></i>
                        </div>
                    <span className="font-semibold text-gray-800">{dep.name}</span>
                    </div>




                  </td>

                  <td className="px-1 py-4 text-right">
                    <button  className="text-blue-600 hover:text-blue-800 mr-1">
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
              <DepartmentModal onClose={() => setShowModal(false)}>
                <DepartmentForm
                  onSuccess={() => {
                    setShowModal(false);
                    loadDepartments(); // обновим таблицу
                  }}
                />
              </DepartmentModal>
            )}



        </div>
      </div>
    </div>
  );
}
