import { useEffect, useState } from "react";
import api from "../../api/api";
import EmployeeModal from "./EmployeeModal";
import EmployeeForm from "./EmployeeForm";




export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);  // для удаления
  const [employeeToEdit, setEmployeeToEdit] = useState(null);      // для редактирования

  const [search, setSearch] = useState("");   // для поиска
  const [departments, setDepartments] = useState([]);   // для загрузки в select

  const [selectedDepartment, setSelectedDepartment] = useState("");   // для фильтра по подразделениям




// функция удаления
const deleteEmployee = async () => {
  try {
    await api.delete(`employees/${employeeToDelete.id}/`);
    setEmployeeToDelete(null);
    loadEmployees();
  } catch (err) {
    console.error(err);
    alert("Ошибка при удалении");
  }
};


  const loadEmployees = () => {
  api.get("employees/")
    .then(res => setEmployees(res.data))
    .catch(err => console.error(err));
  };

  const filteredEmployees = employees.filter(emp => {
      const matchesSearch =
        emp.last_name.toLowerCase().includes(search.toLowerCase());

      const matchesDepartment =
        !selectedDepartment || emp.department === Number(selectedDepartment);

      return matchesSearch && matchesDepartment;
  });


  useEffect(() => {
      loadEmployees();
  }, []);

  useEffect(() => {
    api.get("departments/").then(res => setDepartments(res.data));
  }, []);


  return (
    <div>
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Сотрудники
          </h2>
          <p className="text-gray-600 mt-2">
            Управление списком сотрудников
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
          + Добавить сотрудника
        </button>



      </div>

      {/* Таблица */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">


        <div className="p-4 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">

                {/* Поиск */}
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Поиск по фамилии сотрудника"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Фильтр по подразделению */}
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Все подразделения</option>
                  {departments.map(dep => (
                    <option key={dep.id} value={dep.id}>
                      {dep.name}
                    </option>
                  ))}
                </select>

              </div>
            </div>












          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase">ФИО</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Должность</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Служба</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Подразделение</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase">Действия</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {filteredEmployees.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                             <i className="fas fa-user text-blue-600"></i>
                        </div>
                    <span className="font-semibold text-gray-800">{emp.last_name} {emp.first_name} {emp.middle_name}</span>
                    </div>




                  </td>
                  <td className="px-6 py-4">{emp.position_name}</td>
                  <td className="px-6 py-4">{emp.service_name}</td>
                  <td className="px-6 py-4">{emp.department_name}</td>
                  <td className="px-1 py-4 text-right">
                    <button onClick={() => setEmployeeToEdit(emp)} className="text-blue-600 hover:text-blue-800 mr-1">
                         <i className="fas fa-edit"></i>
                    </button>
                    <button  onClick={() => setEmployeeToDelete(emp)} title="Удалить" className="text-red-600 hover:text-red-800">
                         <i className="fas fa-trash"></i>
                    </button>

                  </td>
                </tr>
              ))}
            </tbody>

          </table>

           {/* модальное окно для добавления */}
          {showModal && (
              <EmployeeModal onClose={() => setShowModal(false)}>
                <EmployeeForm
                  onSuccess={() => {
                    setShowModal(false);
                    loadEmployees(); // обновим таблицу
                  }}
                />
              </EmployeeModal>
            )}

            {/* модальное окно для редактирования */}
            {employeeToEdit && (
                  <EmployeeModal onClose={() => setEmployeeToEdit(null)}>
                    <EmployeeForm
                      employee={employeeToEdit}
                      onSuccess={() => {
                        setEmployeeToEdit(null);
                        loadEmployees();
                      }}
                    />
                  </EmployeeModal>
                )}


            {/* модальное окно для удаления */}

            {employeeToDelete && (
                  <EmployeeModal onClose={() => setEmployeeToDelete(null)}>
                    <h2 className="text-xl font-bold mb-4">
                      Удалить сотрудника
                    </h2>

                    <p className="text-gray-600 mb-6">
                      Вы уверены, что хотите удалить сотрудника{" "}
                      <strong>
                        {employeeToDelete.last_name} {employeeToDelete.first_name} {employeeToDelete.middle_name}
                      </strong>
                      ?
                    </p>

                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={() => setEmployeeToDelete(null)}
                        className="px-4 py-2 rounded-lg border"
                      >
                        Отмена
                      </button>

                      <button
                        onClick={deleteEmployee}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                      >
                        Удалить
                      </button>
                    </div>
                  </EmployeeModal>
                )}



        </div>
      </div>
    </div>
  );
}



