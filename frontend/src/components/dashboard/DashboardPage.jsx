import { useEffect, useState } from "react";
import api from "../../api/api";


const STATUS = {
  overdue: {
    label: "Просрочено",
    badge: "bg-red-100 text-red-700",
  },
  due_soon: {
    label: "Срок заканчивается",
    badge: "bg-amber-100 text-amber-800",
  },
  missing: {
    label: "Не выдано",
    badge: "bg-gray-100 text-gray-700",
  },
};

const STATUS_FILTERS = [
  { key: "overdue", label: "Просрочено", active: "bg-red-100 text-red-700 border-red-200" },
  { key: "due_soon", label: "Срок заканчивается", active: "bg-amber-100 text-amber-800 border-amber-200" },
  { key: "missing", label: "Не выдано", active: "bg-gray-200 text-gray-800 border-gray-300" },
];

const formatDate = (value) => {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
};

function SummaryTile({ label, value, tone, icon }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-gray-500">{label}</div>
          <div className={`mt-2 text-3xl font-bold ${tone}`}>{value}</div>
          <div className="mt-1 text-xs text-gray-500">сотрудников</div>
        </div>
        <i className={`${icon} text-2xl ${tone}`} aria-hidden="true"></i>
      </div>
    </div>
  );
}

export default function DashboardPage({ onNavigate }) {
  const [dashboard, setDashboard] = useState(null);
  const [warningDays, setWarningDays] = useState(60);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("dashboard/");
      setDashboard(response.data);
      setWarningDays(response.data.warning_days);
    } catch {
      setError("Не удалось загрузить данные главной страницы.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const saveWarningDays = async () => {
    const value = Number(warningDays);
    if (![30, 60, 90, 180, 360].includes(value)) {
      setError("Выберите период предупреждения.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.patch("organization/current/", { ppe_warning_days: value });
      await loadDashboard();
    } catch (requestError) {
      const message = requestError.response?.data?.ppe_warning_days?.[0];
      setError(message || "Не удалось сохранить период предупреждения.");
    } finally {
      setSaving(false);
    }
  };

  const counts = dashboard?.counts || { overdue: 0, due_soon: 0, missing: 0 };
  const filteredTasks = dashboard?.tasks.filter(
    (task) => statusFilter === "all" || task.status === statusFilter
  ) || [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Контроль СИЗ</h2>
          <p className="mt-2 text-base text-gray-600">Задачи по обеспеченности сотрудников СИЗ</p>
        </div>
        <button
          type="button"
          onClick={loadDashboard}
          className="icon-btn"
          title="Обновить данные"
          aria-label="Обновить данные"
        >
          <i className="fa-solid fa-rotate" aria-hidden="true"></i>
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryTile label="Просрочено" value={counts.overdue} tone="text-red-600" icon="fa-solid fa-circle-exclamation" />
        <SummaryTile label={`Заканчивается за ${dashboard?.warning_days || warningDays} дней`} value={counts.due_soon} tone="text-amber-600" icon="fa-solid fa-clock" />
        <SummaryTile label="Не выдано по норме" value={counts.missing} tone="text-gray-700" icon="fa-solid fa-clipboard-list" />
      </div>

      <section className="border-y border-gray-200 bg-white py-5">
        <div className="flex flex-col gap-4 px-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Период предупреждения</h3>
            <p className="mt-1 text-sm text-gray-500">Настройка применяется ко всей организации.</p>
          </div>
          <div className="flex items-end gap-3">
            <label className="block">
              <span className="mb-1 block text-sm text-gray-500">Период</span>
              <select
                value={warningDays}
                onChange={(event) => setWarningDays(event.target.value)}
                className="select w-36"
              >
                {[30, 60, 90, 180, 360].map((days) => (
                  <option key={days} value={days}>{days} дней</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={saveWarningDays}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300"
            >
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </div>
      </section>

      {error && <div className="border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

      <section className="overflow-hidden border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Требуют внимания</h3>
            <p className="mt-1 text-sm text-gray-500">Состояние на {formatDate(dashboard?.as_of)}</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("order-report")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            Открыть отчет для заказа
            <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-gray-200 px-5 py-4">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              statusFilter === "all"
                ? "border-gray-800 bg-gray-800 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            Все · {counts.total || 0}
          </button>
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setStatusFilter(filter.key)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                statusFilter === filter.key
                  ? filter.active
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {filter.label} · {counts[filter.key] || 0}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="px-5 py-12 text-center text-gray-500">Загрузка...</div>
        ) : !filteredTasks.length ? (
          <div className="px-5 py-12 text-center text-gray-500">
            {statusFilter === "all" ? "Задач по СИЗ нет." : "В выбранной группе задач нет."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-sm text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Статус</th>
                  <th className="px-5 py-3 font-semibold">Сотрудник</th>
                  <th className="px-5 py-3 font-semibold">Подразделение</th>
                  <th className="px-5 py-3 font-semibold">СИЗ</th>
                  <th className="px-5 py-3 text-center font-semibold">Необходимо</th>
                  <th className="px-5 py-3 font-semibold">Дата окончания</th>
                  <th className="px-5 py-3 text-right font-semibold">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${STATUS[task.status].badge}`}>
                        {STATUS[task.status].label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-800">{task.employee_name}</div>
                      <div className="mt-1 text-sm text-gray-500">{task.position_name}</div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{task.department_name || "—"}</td>
                    <td className="px-5 py-4 font-medium text-gray-800">{task.item_name}</td>
                    <td className="px-5 py-4 text-center text-gray-700">{task.quantity}</td>
                    <td className="px-5 py-4 text-gray-700">
                      <div>{formatDate(task.due_date)}</div>
                      {task.days_remaining !== null && (
                        <div className="mt-1 text-sm text-gray-500">
                          {task.days_remaining < 0
                            ? `${Math.abs(task.days_remaining)} дн. просрочено`
                            : task.days_remaining === 0
                              ? "Сегодня"
                              : `Осталось ${task.days_remaining} дн.`}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onNavigate("issues")}
                        className="inline-flex items-center gap-2 rounded-lg border border-blue-600 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        <i className="fa-solid fa-plus" aria-hidden="true"></i>
                        Выдать
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
