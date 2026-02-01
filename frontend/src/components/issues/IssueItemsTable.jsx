// таблица позиций

export default function IssueItemsTable({ items, onRemove }) {
  if (items.length === 0) {
    return <p className="text-gray-500">Позиции не добавлены</p>;
  }

  return (


        <table className="w-full border rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-1 py-2 text-left">Наименование</th>
              <th className="px-4 py-2">Размер</th>
              <th className="px-4 py-2">Кол-во</th>
               <th className="px-4 py-2">Срок эксплуатации (мес.)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((i, idx) => (
              <tr key={idx} className="border-t">
                <td className="font-medium text-gray-600 px-1"> {i.item_name}</td>
                <td className="px-4 py-2 text-center">{i.size || "—"}</td>
                <td className="px-4 py-2 text-center">{i.quantity}</td>
                <td className="px-4 py-2 text-center">{i.operation_life_months}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => onRemove(idx)}
                    className="text-red-600"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

  );
}
