import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import api from "../../api/api";
import RussianDatePicker from "../ui/RussianDatePicker";
import AlertModal from "../ui/AlertModal";
import EntitlementTable from "./EntitlementTable";

function today() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export default function EmployeeEntitlementsPage() {
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState(today());
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("employees/").then((response) => {
      setEmployees(Array.isArray(response.data) ? response.data : response.data.results || []);
    }).catch(() => setError("Не удалось загрузить сотрудников"));
  }, []);

  useEffect(() => {
    if (!employeeId || !date) {
      return;
    }
    api.get(`employees/${employeeId}/entitlements/`, { params: { date } })
      .then((response) => setData(response.data))
      .catch(() => setError("Не удалось рассчитать обеспеченность сотрудника"));
  }, [employeeId, date]);

  const options = useMemo(() => employees.map((employee) => ({
    value: employee.id,
    label: `${employee.last_name} ${employee.first_name} ${employee.middle_name || ""}`.trim(),
  })), [employees]);

  const handleEmployeeChange = (option) => {
    setEmployeeId(option?.value || "");
    if (!option) setData(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Обеспеченность СИЗ</h2>
        <p className="mt-2 text-base text-gray-600">Положенные и фактически действующие выдачи сотрудника</p>
      </div>

      <div className="grid gap-4 border border-gray-200 bg-white p-6 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-600">Сотрудник</label>
          <Select options={options} value={options.find((option) => option.value === employeeId) || null} onChange={handleEmployeeChange} placeholder="Выберите сотрудника" isClearable isSearchable />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600">Дата проверки</label>
          <RussianDatePicker value={date} onChange={setDate} />
        </div>
      </div>

      {data ? <EntitlementTable data={data} /> : (
        <div className="border border-gray-200 bg-white px-6 py-12 text-center text-gray-500">Выберите сотрудника, чтобы увидеть его обеспеченность.</div>
      )}

      <AlertModal title="Ошибка" message={error} onClose={() => setError("")} />
    </div>
  );
}
