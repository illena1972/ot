import { useEffect, useState } from "react";
import api from "../../api/api";

function StockForm({ stock, onSuccess }) {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  const [form, setForm] = useState({
  item: stock?.item || "",
  size: stock?.size ?? "",
  quantity: stock?.quantity || "",
  date_income: stock?.date_income || "",
  note: stock?.note || "",
  });

  const [errors, setErrors] = useState({});



  // 🔹 загрузка одежды
  useEffect(() => {
    api.get("clothes/")
      .then(res => setItems(res.data))
      .catch(err => console.error(err));
  }, []);

  // 🔹 при выборе одежды узнаём тип
  useEffect(() => {
    const found = items.find(i => i.id === Number(form.item));
    setSelectedItem(found || null);
  }, [form.item, items]);

  useEffect(() => {
  if (stock) {
    setForm({
      item: stock.item,
      size: stock.size ?? "",
      quantity: stock.quantity,
      date_income: stock.date_income,
      note: stock.note || "",
    });
  }
}, [stock]);


  const handleChange = (e) => {
  const { name, value } = e.target;

  setForm({
    ...form,
    [name]: value === "" ? null : value,
  });
  };



  // -------------------------
  // UI-ВАЛИДАЦИЯ
  // -------------------------
  const validateForm = () => {
    const errs = {};

    if (!form.item) {
      errs.item = "Выберите одежду";
    }

    if (!form.quantity || form.quantity <= 0) {
      errs.quantity = "Укажите количество";
    }

    if (
      selectedItem &&
      ["top", "shoes"].includes(selectedItem.type) &&
      !form.size
    ) {
      errs.size = "Размер обязателен для этой одежды";
    }

    if (
      selectedItem &&
      selectedItem.type === "other" &&
      form.size
    ) {
      errs.size = "Для безразмерной одежды размер не указывается";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };


  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) return; // 👈 ВАЖНО

  try {
    if (stock) {
      await api.put(`stocks/${stock.id}/`, form);
    } else {
      await api.post("stocks/", form);
    }

    if (onSuccess) onSuccess();
  } catch (err) {
    console.error(err);
    alert("Ошибка при сохранении");
  }
};






  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-bold">
         {stock ? "Редактировать партию" : "Добавить партию"}
      </h2>

      {/* Одежда */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Наименование
        </label>
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
          <label className="block text-sm font-medium mb-1">
            Размер
          </label>
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
        <label className="block text-sm font-medium mb-1">
          Количество
        </label>
        <input
          type="number"
          name="quantity"
          min="1"
          required
          value={form.quantity}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2"
        />
        {errors.quantity && (
          <p className="text-red-600 text-sm">{errors.quantity}</p>
        )}
      </div>

      <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Дата поступления
          </label>
          <input
            type="date"
            name="date_income"
            value={form.date_income}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
          />
      </div>

      <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Примечание
          </label>
          <textarea
            name="note"
            value={form.note}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            placeholder="Например: гуманитарная помощь, срочная закупка..."
          />
        </div>

      {/* Кнопки */}
      <div className="flex justify-end space-x-4">
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Сохранить
        </button>

        <button
          type="button"
          onClick={onSuccess}
          className="border px-6 py-2 rounded-lg"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}

export default StockForm;