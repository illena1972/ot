import { useEffect, useState } from "react";
import api from "../../api/api";
import AlertModal from "../ui/AlertModal";

const getEmployees = (data) => (Array.isArray(data) ? data : data.results || []);

export default function EmployeeCardPage() {
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("employees/")
      .then((response) => setEmployees(getEmployees(response.data)))
      .catch(() => setError("Не удалось загрузить список сотрудников."))
      .finally(() => setLoading(false));
  }, []);

  const selectedEmployee = employees.find(
    (employee) => String(employee.id) === employeeId,
  );

  const handleExport = async () => {
    if (!employeeId) {
      setError("Выберите сотрудника.");
      return;
    }

    setExporting(true);
    try {
      const response = await api.get("reports/employee-card/export/", {
        params: { employee_id: employeeId },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      const employeeName = [selectedEmployee.last_name, selectedEmployee.first_name]
        .filter(Boolean)
        .join("_");

      link.href = url;
      link.download = `Карточка_СИЗ_${employeeName || "сотрудник"}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (requestError) {
      console.error(requestError);
      setError("Не удалось сформировать учетную карточку.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Учетные карточки</h1>
        <p className="text-base text-gray-600 mt-2">
          Формирование личной карточки учета выдачи СИЗ сотрудника
        </p>
      </div>

      <div className="bg-white border border-gray-100 shadow-sm rounded-lg p-5 max-w-3xl">
        <label htmlFor="employee-card-employee" className="block text-sm font-medium text-gray-700 mb-2">
          Сотрудник
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            id="employee-card-employee"
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
            disabled={loading}
            className="form-control flex-1"
          >
            <option value="">Выберите сотрудника</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {[employee.last_name, employee.first_name, employee.middle_name]
                  .filter(Boolean)
                  .join(" ")}
                {employee.department_name ? ` - ${employee.department_name}` : ""}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleExport}
            disabled={!employeeId || exporting || loading}
            className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-5 py-3 rounded-lg font-semibold transition"
          >
            <i className="fa-solid fa-file-excel" />
            {exporting ? "Формирование..." : "Сформировать карточку"}
          </button>
        </div>

        {selectedEmployee && (
          <div className="mt-4 text-sm text-gray-600">
            {selectedEmployee.position_name || "Должность не указана"}
            {selectedEmployee.department_name ? `, ${selectedEmployee.department_name}` : ""}
          </div>
        )}
      </div>

      <AlertModal title="Ошибка" message={error} onClose={() => setError("")} />
    </div>
  );
}
