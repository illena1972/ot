import { useEffect, useState } from "react";
import api from "../../api/api";

export default function IssueForm({ onSuccess }) {
  const [employees, setEmployees] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  const [form, setForm] = useState({
    employee: "",
    item: "",
    quantity: 1,
    size: "",
    operation_life_months: 12,
    date_received: "",
    order_point: "",
    note: "",
  });

  const [errors, setErrors] = useState({});

  // 🔹 загрузка справочников
  useEffect(() => {
    api.get("employees/").then(res => setEmployees(res.data));
    api.get("clothes/").then(res => setItems(res.data));
  }, []);

  // 🔹 определяем выбранный тип одежды
  useEffect(() => {
    const found = items.find(i => i.id === Number(form.item));
    setSelectedItem(found || null);
  }, [form.item, items]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value === "" ? "" : value,
    }));
  };

  // -------------------------
  // UI-валидация
  // -------------------------
  const validateForm = () => {
    const errs = {};

    if (!form.employee) errs.employee = "Выберите сотрудника";
    if (!form.item) errs.item = "Выберите экипировку";
    if (!form.quantity || form.quantity <= 0) errs.quantity = "Количество > 0";

    if (
      selectedItem &&
      ["top", "shoes"].includes(selectedItem.type) &&
      !form.size
    ) {
      errs.size = "Укажите размер";
    }

    if (
      selectedItem &&
      selectedItem.type === "other" &&
      form.size
    ) {
      errs.size = "Размер для этой одежды не нужен";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await api.post("issues/", {
        ...form,
        size: form.size || null,
        date_received: form.date_received || null,
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      alert("Ошибка при выдаче одежды");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-bold">Выдать одежду сотруднику</h2>

      {/* Сотрудник */}
      <div>
        <label className="block text-sm font-medium mb-1">Сотрудник</label>
        <select
          name="employee"
          value={form.employee}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="">Выберите</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>
              {emp.last_name} {emp.first_name}
            </option>
          ))}
        </select>
        {errors.employee && <p className="text-red-600 text-sm">{errors.employee}</p>}
      </div>

      {/* Экипировка */}
      <div>
        <label className="block text-sm font-medium mb-1">Экипировка</label>
        <select
          name="item"
          value={form.item}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="">Выберите</option>
          {items.map(i => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
        {errors.item && <p className="text-red-600 text-sm">{errors.item}</p>}
      </div>

      {/* Размер */}
      {selectedItem && selectedItem.type !== "other" && (
        <div>
          <label className="block text-sm font-medium mb-1">Размер</label>
          <input
            type="number"
            name="size"
            value={form.size}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          />
          {errors.size && <p className="text-red-600 text-sm">{errors.size}</p>}
        </div>
      )}

      {/* Количество */}
      <div>
        <label className="block text-sm font-medium mb-1">Количество</label>
        <input
          type="number"
          name="quantity"
          min="1"
          value={form.quantity}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      {/* Срок эксплуатации */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Срок эксплуатации (мес.)
        </label>
        <input
          type="number"
          name="operation_life_months"
          min="1"
          value={form.operation_life_months}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      {/* Дата получения */}
      <div>
        <label className="block text-sm font-medium mb-1">Дата получения</label>
        <input
          type="date"
          name="date_received"
          value={form.date_received}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      {/* Пункт приказа */}
      <div>
        <label className="block text-sm font-medium mb-1">Пункт приказа</label>
        <input
          type="text"
          name="order_point"
          value={form.order_point}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      {/* Примечание */}
      <div>
        <label className="block text-sm font-medium mb-1">Примечание</label>
        <textarea
          name="note"
          rows={3}
          value={form.note}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      {/* Кнопки */}
      <div className="flex justify-end space-x-4">
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Выдать
        </button>
      </div>
    </form>
  );
}
