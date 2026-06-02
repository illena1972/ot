import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";

const getInitialForm = (stock) => ({
  item: stock?.item || "",
  size: stock?.item_type === "other" ? null : stock?.size ?? "",
  height: ["shoes", "other"].includes(stock?.item_type) ? null : stock?.height ?? "",
  quantity: stock?.quantity || "",
  note: stock?.note || "",
});

const normalizeFormByType = (form, itemType) => {
  const normalizedForm = {
    ...form,
    size: form.size === "" ? null : form.size,
    height: form.height === "" ? null : form.height,
  };

  if (itemType === "shoes") {
    normalizedForm.height = null;
  }

  if (itemType === "other") {
    normalizedForm.size = null;
    normalizedForm.height = null;
  }

  return normalizedForm;
};

function StockForm({ stock, onSuccess }) {
  const [items, setItems] = useState([]);

  const [form, setForm] = useState(() => getInitialForm(stock));
  const [errors, setErrors] = useState({});



  // 🔹 загрузка одежды
  useEffect(() => {
    api.get("clothes/")
      .then(res => setItems(res.data))
      .catch(err => console.error(err));
  }, []);

  const selectedItem = useMemo(
    () => items.find(i => i.id === Number(form.item)) || null,
    [form.item, items]
  );
  const selectedItemType = selectedItem?.type || stock?.item_type;

  const handleChange = (e) => {
  const { name, value } = e.target;
  const nextValue = value === "" ? null : value;

  setForm(prev => {
    const nextForm = {
      ...prev,
      [name]: nextValue,
    };

    if (name === "item") {
      const nextItem = items.find(i => i.id === Number(nextValue));

      if (nextItem?.type === "other") {
        nextForm.size = null;
        nextForm.height = null;
      }

      if (nextItem?.type === "shoes") {
        nextForm.height = null;
      }
    }

    return nextForm;
  });
  };



  // -------------------------
  // UI-ВАЛИДАЦИЯ
  // -------------------------
  const validateForm = () => {
    const errs = {};
    const normalizedForm = normalizeFormByType(form, selectedItemType);

    if (!normalizedForm.item) {
      errs.item = "Выберите одежду";
    }

    if (!normalizedForm.quantity || normalizedForm.quantity <= 0) {
      errs.quantity = "Укажите количество";
    }

    if (selectedItemType === "top") {
      if (!normalizedForm.size) errs.size = "Укажите размер";
      if (!normalizedForm.height) errs.height = "Укажите рост";
    }

    if (selectedItemType === "shoes") {
      if (!normalizedForm.size) errs.size = "Укажите размер";
      if (normalizedForm.height) errs.height = "Рост для обуви не указывается";
    }

    if (selectedItemType === "other") {
      if (normalizedForm.size || normalizedForm.height) {
        errs.size = "Для безразмерной одежды размеры не указываются";
      }
    }


    if (
      selectedItemType === "other" &&
      normalizedForm.size
    ) {
      errs.size = "Для безразмерной одежды размер не указывается";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };


  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) return; // 👈 ВАЖНО

  const payload = normalizeFormByType(form, selectedItemType);

  try {
    if (stock) {
      await api.put(`stocks/${stock.id}/`, payload);
    } else {
      await api.post("stocks/", payload);
    }

    if (onSuccess) onSuccess();
  } catch (err) {
      console.error("FULL ERROR:", err);
      console.error("RESPONSE:", err.response);
      console.error("DATA:", err.response?.data);

      alert(JSON.stringify(err.response?.data, null, 2));
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
      {selectedItemType && selectedItemType !== "other" && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Размер
          </label>
          <input
            type="number"
            name="size"
            value={form.size ?? ""}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          />
          {errors.size && <p className="text-red-600 text-sm">{errors.size}</p>}
        </div>
      )}


      {/* Рост — только для верхней одежды */}
        {selectedItemType && selectedItemType === "top" && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Рост
            </label>
            <input
              type="number"
              name="height"
              value={form.height ?? ""}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            />
            {errors.height && (
              <p className="text-red-600 text-sm">{errors.height}</p>
            )}
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
