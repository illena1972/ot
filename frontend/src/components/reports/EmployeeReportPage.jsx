import { useEffect, useState } from "react";
import api from "../../api/api";
import EmployeeReportTable from "./EmployeeReportTable";
import Modal from "../ui/Modal";// путь к Modal.jsx
import EditIssueForm from "./EditIssueForm";


export default function EmployeeReportPage() {

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [reportItems, setReportItems] = useState([]);

  const [loading, setLoading] = useState(false);

  const [editItem, setEditItem] = useState(null);

  // загрузка подразделений
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

  // загрузка сотрудников
  const loadEmployees = async () => {

    const params = {};

    if (search)
      params.search = search;

    if (department)
      params.department = department;

    const res = await api.get("employees/", { params });

    const data = Array.isArray(res.data)
      ? res.data
      : res.data.results || [];

    setEmployees(data);
  };

  useEffect(() => {
    loadEmployees();
  }, [search, department]);

  // загрузка отчета
  const loadReport = async (employee) => {

    setSelectedEmployee(employee);
    setLoading(true);

    try {

      const res = await api.get(
        `employees/${employee.id}/report/`
      );

      setReportItems(res.data.items);

    } catch (err) {

      console.error(err);
      alert("Ошибка загрузки отчета");

    } finally {

      setLoading(false);

    }
  };


  const handleEdit = (item) => {
      setEditItem(item);
    };


  const handleWriteOff = async (itemId) => {

  if (!window.confirm("Списать эту позицию?"))
    return;

  try {

    await api.delete(`issue-items/${itemId}/`);

    setReportItems(prev =>
      prev.filter(item => item.id !== itemId)
    );

  } catch (err) {

    console.error(err);
    alert("Ошибка списания");

  }

};

  const handleDelete = async (itemId) => {
      if (!window.confirm("Удалить выдачу и вернуть позицию на склад?")) {
        return;
      }

      try {
        await api.delete(`issue-items/${itemId}/`);

        if (!selectedEmployee) return;

        const res = await api.get(`employees/${selectedEmployee.id}/report/`);
        setReportItems(res.data.items);

      } catch (err) {
        console.error(err);
        alert("Ошибка удаления");
      }
  };

  return (
  <div className="space-y-6">
    {/* Заголовок */}
    <div>
      <h1 className="text-3xl font-bold text-gray-800">
        Отчет по сотруднику
      </h1>
      <p className="text-base text-gray-600 mt-2">
        Просмотр выданной спецодежды сотрудникам
      </p>
    </div>

    {/* Фильтры */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          placeholder="Поиск по ФИО..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-control flex-1"
        />

        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="form-control sm:max-w-xs"
        >
          <option value="">Все подразделения</option>

          {departments.map((dep) => (
            <option key={dep.id} value={dep.id}>
              {dep.name}
            </option>
          ))}
        </select>
      </div>
    </div>

    {/* Список сотрудников */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="space-y-3">
        {employees.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            Сотрудники не найдены
          </div>
        )}

        {employees.map((emp) => (
          <div
            key={emp.id}
            onClick={() => loadReport(emp)}
            className={`p-4 rounded-2xl border cursor-pointer transition ${
              selectedEmployee?.id === emp.id
                ? "bg-blue-50 border-blue-200"
                : "bg-white border-gray-100 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <i className="fa-solid fa-user text-blue-600 text-lg"></i>
              </div>

              <div className="min-w-0">
                <div className="font-semibold text-gray-800 text-base">
                  {emp.last_name} {emp.first_name} {emp.middle_name}
                </div>

                <div className="text-sm text-gray-500 mt-1">
                  {emp.department_name}
                  {" • "}
                  {emp.position_name}
                  {" • "}
                  {emp.service_name}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Отчет по сотруднику */}
    {selectedEmployee && (
      <Modal
        isOpen={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        title={`Выдача сотруднику: ${selectedEmployee.last_name} ${selectedEmployee.first_name} ${selectedEmployee.middle_name}`}
        width="max-w-7xl"
      >
        <EmployeeReportTable
          employee={selectedEmployee}
          items={reportItems}
          loading={loading}
          onWriteOff={handleWriteOff}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Modal>
    )}

    {/* Редактирование */}
    {editItem && (
      <Modal
        isOpen={true}
        onClose={() => setEditItem(null)}
        title="Редактирование выдачи"
        width="max-w-lg"
      >
        <EditIssueForm
          item={editItem}
          onClose={() => setEditItem(null)}
          onSaved={async () => {
            if (!selectedEmployee) return;

            const res = await api.get(
              `employees/${selectedEmployee.id}/report/`
            );
            setReportItems(res.data.items);
            setEditItem(null);
          }}
        />
      </Modal>
    )}
  </div>
);

}
