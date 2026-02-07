// модалка добавления позиции

import { useEffect, useState } from "react";
import api from "../../api/api";

export default function IssueItemModal({ onClose, onAdd }) {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);




  const [form, setForm] = useState({
    item: "",
    quantity: 1,
    size: "",
    height: "",
    operation_life_months: 12,
    note: "",
  });

  const [errors, setErrors] = useState({});

  // загрузка одежды
  useEffect(() => {
    api.get("clothes/").then(res => setItems(res.data));
  }, []);

  // определяем выбранную одежду
  useEffect(() => {
    const found = items.find(i => i.id === Number(form.item));
    setSelectedItem(found || null);
  }, [form.item, items]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value === "" ? null : value,
    }));
  };

  // -------------------------
  // INLINE-ВАЛИДАЦИЯ
  // -------------------------
  const validate = () => {
    const errs = {};

    if (!form.item) errs.item = "Выберите экипировку";
    if (!form.quantity || form.quantity <= 0)
      errs.quantity = "Количество должно быть больше 0";

    if (selectedItem?.type === "top") {
      if (!form.size) errs.size = "Укажите размер";
      if (!form.height) errs.height = "Укажите рост";
    }

    if (selectedItem?.type === "shoes") {
      if (!form.size) errs.size = "Укажите размер";
      if (form.height) errs.height = "Рост для обуви не указывается";
    }

    if (selectedItem?.type === "other") {
      if (form.size || form.height) {
        errs.size = "Для безразмерной одежды размеры не указываются";
      }
    }

    if (available !== null && form.quantity > available) {
      errs.quantity = `Недостаточно на складе (доступно ${available})`;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onAdd({
      item: form.item,
      item_name: selectedItem.name,
      item_type: selectedItem.type,
      quantity: Number(form.quantity),
      size: form.size,
      height: form.height,
      operation_life_months: Number(form.operation_life_months),
      note: form.note,
    });

    onClose();
  };


  // для проверки хватает ли позиций для выдачи
  const [available, setAvailable] = useState(null);
  useEffect(() => {
  if (!form.item) {
    setAvailable(null);
    return;
  }

  const params = {
    item: form.item,
  };

  if (form.size) params.size = form.size;
  if (form.height) params.height = form.height;

  api
    .get("stocks/available/", { params })
    .then(res => setAvailable(res.data.available))
    .catch(() => setAvailable(0));

}, [form.item, form.size, form.height]);


  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 space-y-4">

        <h3 className="text-lg font-semibold">Добавить позицию</h3>

        {/* Наименование */}
        <div>
          <label className="block text-sm font-medium mb-1">Наименование</label>
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
              value={form.size ?? ""}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            />
            {errors.size && <p className="text-red-600 text-sm">{errors.size}</p>}
          </div>
        )}


        {/* Рост */}
      {selectedItem && selectedItem.type === "top" && (
        <div>
          <label className="block text-sm font-medium mb-1">Рост</label>
          <input
            type="number"
            name="height"
            value={form.height ?? ""}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          />
          {errors.height && <p className="text-red-600 text-sm">{errors.height}</p>}
        </div>
      )}

      {available !== null && (
          <p className="text-sm text-gray-600">
            Доступно на складе:{" "}
            <span className={available > 0 ? "font-semibold" : "text-red-600"}>
              {available}
            </span>
          </p>
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
          {errors.quantity && (
            <p className="text-red-600 text-sm">{errors.quantity}</p>
          )}
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

        {/* Примечание */}
        <div>
          <label className="block text-sm font-medium mb-1">Примечание</label>
          <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              rows={2}
            />
        </div>

        {/* Кнопки */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border"
          >
            Отмена
          </button>

          <button
              onClick={handleSubmit}
              disabled={available !== null && form.quantity > available}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:bg-gray-400">
              Добавить
            </button>
        </div>
      </div>
    </div>
  );
}
