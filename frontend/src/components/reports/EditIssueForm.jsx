import { useState } from "react";
import api from "../../api/api";

export default function EditIssueForm({ item, onClose, onSaved }) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [operationLifeMonths, setOperationLifeMonths] = useState(
    item.operation_life_months || 12
  );
  const [note, setNote] = useState(item.note || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);

    try {
      const res = await api.patch(`issue-items/${item.id}/`, {
        quantity: Number(quantity),
        operation_life_months: Number(operationLifeMonths),
        note,
      });

      onSaved({
        ...item,
        ...res.data,
        item_name: item.item_name,
        date_received: item.date_received,
        status: item.status,
        date_expire: item.date_expire,
      });
    } catch (err) {
      console.error(err);
      alert("Ошибка обновления выдачи");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Наименование
        </label>
        <div className="border rounded-lg px-3 py-2 bg-gray-50">
          {item.item_name}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Количество
        </label>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Срок эксплуатации (мес.)
        </label>
        <input
          type="number"
          min="1"
          value={operationLifeMonths}
          onChange={(e) => setOperationLifeMonths(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Примечание
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows="3"
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg border"
        >
          Отмена
        </button>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
      </div>
    </form>
  );
}