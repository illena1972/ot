function formatDate(value) {
  if (!value) return "Не определена";
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
}

export default function EntitlementTable({ data, onIssue }) {
  if (!data) return null;

  if (!data.employee.position_id) {
    return <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">У сотрудника не указана должность.</div>;
  }

  if (!data.norm) {
    return (
      <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
        Для должности «{data.employee.position_name}» норма выдачи не назначена.
      </div>
    );
  }

  return (
    <div className="border border-gray-200 bg-white overflow-hidden">
      <div className="flex flex-col gap-1 border-b border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-semibold text-gray-800">{data.norm.name}</div>
          <div className="text-sm text-gray-500">{data.employee.position_name}</div>
        </div>
        <div className="text-sm text-gray-500">Состояние на {formatDate(data.as_of)}</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-sm text-gray-500">
            <tr>
              <th className="px-5 py-3 font-semibold">СИЗ</th>
              <th className="px-5 py-3 text-center font-semibold">Положено</th>
              <th className="px-5 py-3 text-center font-semibold">Выдано</th>
              <th className="px-5 py-3 text-center font-semibold">Не хватает</th>
              <th className="px-5 py-3 font-semibold">Срок</th>
              <th className="px-5 py-3 font-semibold">Следующая выдача</th>
              {onIssue && <th className="px-5 py-3 text-right font-semibold">Действие</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.items.map((row) => (
              <tr key={row.norm_item_id}>
                <td className="px-5 py-4 font-medium text-gray-800">{row.item_name}</td>
                <td className="px-5 py-4 text-center">{row.required_quantity}</td>
                <td className="px-5 py-4 text-center">{row.active_quantity}</td>
                <td className="px-5 py-4 text-center">
                  <span className={row.missing_quantity ? "font-semibold text-red-600" : "text-green-700"}>{row.missing_quantity}</span>
                </td>
                <td className="px-5 py-4 text-gray-600">{row.operation_life_months} мес.</td>
                <td className="px-5 py-4">
                  {row.missing_quantity ? <span className="font-semibold text-red-600">Выдать сейчас</span> : formatDate(row.next_issue_date)}
                </td>
                {onIssue && (
                  <td className="px-5 py-4 text-right">
                    {row.missing_quantity > 0 && (
                      <button type="button" onClick={() => onIssue(row)} className="inline-flex items-center gap-2 rounded-lg border border-blue-600 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
                        <i className="fa-solid fa-plus" aria-hidden="true" /> Добавить
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
