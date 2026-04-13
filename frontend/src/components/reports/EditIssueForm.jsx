import { useState } from "react";
import api from "../../api/api";

export default function EditIssueForm({ item, onClose, onSaved }) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [operationLifeMonths, setOperationLifeMonths] = useState(
    item.operation_life_months || 12
  );
  const [note, setNote] = useState(item.note || "");
  const [saving, setSaving] = useState(false);

  const [quantityError, setQuantityError] = useState("");
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setQuantityError("");
    setFormError("");

    try {
      const res = await api.patch(`issue-items/${item.id}/`, {
        quantity: Number(quantity),
        operation_life_months: Number(operationLifeMonths),
        note,
      });

      onSaved({
        ...item,
        ...res.data,
      });
    } catch (err) {
      console.error(err);

      const data = err.response?.data;

      if (data) {
        if (typeof data === "string") {
          setFormError(data);
        } else if (data.detail) {
          setFormError(data.detail);
        } else {
          const firstError = Object.values(data)[0];
          const errorText = Array.isArray(firstError) ? firstError[0] : firstError;

          if (
            typeof errorText === "string" &&
            errorText.toLowerCase().includes("недостаточно на складе")
          ) {
            setQuantityError(errorText);
          } else {
            setFormError(errorText || "Ошибка обновления выдачи");
          }
        }
      } else {
        setFormError("Ошибка соединения с сервером");
      }
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
        <div className="w-full border rounded-lg px-3 py-2 bg-gray-50 text-gray-700">
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
          onChange={(e) => {
            setQuantity(e.target.value);
            setQuantityError("");
            setFormError("");
          }}
          className={`w-full border rounded-lg px-3 py-2 ${
            quantityError ? "border-red-500 bg-red-50" : ""
          }`}
        />
        {quantityError && (
          <div className="mt-1 text-sm text-red-600">
            {quantityError}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Срок эксплуатации (мес.)
        </label>
        <input
          type="number"
          min="1"
          value={operationLifeMonths}
          onChange={(e) => {
            setOperationLifeMonths(e.target.value);
            setFormError("");
          }}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Примечание
        </label>
        <textarea
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setFormError("");
          }}
          rows="3"
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      {formError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </div>
      )}

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