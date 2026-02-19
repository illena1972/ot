import { useEffect, useState } from "react";
import api from "../../api/api";
import EmployeeReportTable from "./EmployeeReportTable";

export default function EmployeeReportPage() {

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [reportItems, setReportItems] = useState([]);

  const [loading, setLoading] = useState(false);

  // загрузка подразделений
  useEffect(() => {
    api.get("departments/")
      .then(res => setDepartments(res.data));
  }, []);

  // загрузка сотрудников
  const loadEmployees = async () => {

    const params = {};

    if (search)
      params.search = search;

    if (department)
      params.department = department;

    const res = await api.get("employees/", { params });

    setEmployees(res.data);
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

  return (

    <div className="space-y-6">

      {/* заголовок */}
      <div>
        <h1 className="text-2xl font-bold">
          Отчет по сотруднику
        </h1>
        <p className="text-gray-500">
          Просмотр выданной спецодежды сотрудникам
        </p>
      </div>


      {/* фильтры */}
      <div className="bg-white rounded-xl shadow p-4 flex gap-4">

        <input
          placeholder="Поиск по ФИО..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-2"
        />

        <select
          value={department}
          onChange={e => setDepartment(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="">
            Все подразделения
          </option>

          {departments.map(dep => (
            <option key={dep.id} value={dep.id}>
              {dep.name}
            </option>
          ))}

        </select>

      </div>


      {/* список сотрудников */}
      <div className="bg-white rounded-xl shadow p-4 space-y-2">

        {employees.map(emp => (

          <div
            key={emp.id}
            onClick={() => loadReport(emp)}
            className={`
              p-3 border rounded-lg cursor-pointer
              hover:bg-blue-50
              ${selectedEmployee?.id === emp.id
                ? "bg-blue-100"
                : ""}
            `}
          >

            <div className="font-medium">
              {emp.last_name} {emp.first_name} {emp.middle_name}
            </div>

            <div className="text-sm text-gray-500">
              {emp.department_name}
              {" • "}
              {emp.position_name}
              {" • "}
              {emp.service_name}
            </div>

          </div>

        ))}

      </div>


      {/* таблица */}
      {selectedEmployee && (

        <EmployeeReportTable
          employee={selectedEmployee}
          items={reportItems}
          loading={loading}
        />

      )}

    </div>

  );
}
