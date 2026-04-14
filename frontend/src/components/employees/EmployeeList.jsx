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
    .then(res => {
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setEmployees(data);
    })
    .catch(err => {
      console.error(err);
      setEmployees([]);
    });
};

const filteredEmployees = Array.isArray(employees)
  ? employees.filter(emp => {
      const matchesSearch =
        emp.last_name.toLowerCase().includes(search.toLowerCase());

      const matchesDepartment =
        !selectedDepartment || emp.department === Number(selectedDepartment);

      return matchesSearch && matchesDepartment;
    })
  : [];

  useEffect(() => {
      loadEmployees();
  }, []);

  useEffect(() => {
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
}, []);



   return (
  <div>

    {/* Заголовок */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">
          Сотрудники
        </h2>
        <p className="text-base text-gray-600 mt-2">
          Управление списком сотрудников
        </p>
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold text-base"
      >
        + Добавить сотрудника
      </button>
    </div>

    {/* Таблица */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">

        {/* Фильтры */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">

            <input
              type="text"
              placeholder="Поиск по фамилии сотрудника"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
            />

            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="select"
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

        {/* Таблица */}
        <table className="w-full text-left">

          <thead className="bg-gray-50">
            <tr className="text-gray-500 text-sm uppercase tracking-wide">
              <th className="px-6 py-4 font-semibold">Сотрудник</th>
              <th className="px-6 py-4 font-semibold">Должность</th>
              <th className="px-6 py-4 font-semibold">Служба</th>
              <th className="px-6 py-4 font-semibold">Подразделение</th>
              <th className="px-6 py-4 text-right font-semibold">Действия</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {filteredEmployees.map(emp => (
              <tr key={emp.id} className="hover:bg-gray-50 transition">

                {/* Сотрудник */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center">
                      <i className="fa-solid fa-user text-blue-600 text-lg"></i>
                    </div>

                    <div>
                      <div className="font-semibold text-gray-800 text-base">
                        {emp.last_name} {emp.first_name} {emp.middle_name}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Должность */}
                <td className="px-6 py-4 text-gray-600 text-base">
                  {emp.position_name}
                </td>

                {/* Служба */}
                <td className="px-6 py-4 text-gray-600 text-base">
                  {emp.service_name}
                </td>

                {/* Подразделение */}
                <td className="px-6 py-4 text-gray-600 text-base">
                  {emp.department_name}
                </td>

                {/* Действия */}
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEmployeeToEdit(emp)}
                      className="icon-btn"
                    >
                      <i className="fa-solid fa-pen"></i>
                    </button>

                    <button
                      onClick={() => setEmployeeToDelete(emp)}
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
          <EmployeeModal onClose={() => setShowModal(false)}>
            <EmployeeForm
              onSuccess={() => {
                setShowModal(false);
                loadEmployees();
              }}
            />
          </EmployeeModal>
        )}

        {/* Модалка редактирования */}
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

        {/* Модалка удаления */}
        {employeeToDelete && (
          <EmployeeModal onClose={() => setEmployeeToDelete(null)}>
            <h2 className="text-2xl font-bold mb-4">
              Удалить сотрудника
            </h2>

            <p className="text-base text-gray-600 mb-6">
              Вы уверены, что хотите удалить сотрудника{" "}
              <strong>
                {employeeToDelete.last_name} {employeeToDelete.first_name} {employeeToDelete.middle_name}
              </strong>
              ?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEmployeeToDelete(null)}
                className="px-5 py-3 rounded-xl border border-gray-300 text-base hover:bg-gray-50"
              >
                Отмена
              </button>

              <button
                onClick={deleteEmployee}
                className="px-5 py-3 rounded-xl bg-red-600 text-white text-base hover:bg-red-700"
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



