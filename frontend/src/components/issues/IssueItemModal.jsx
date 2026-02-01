// модалка добавления позиции

import { useEffect, useState } from "react";
import api from "../../api/api";

export default function IssueItemModal({ onAdd, onClose }) {
  const [items, setItems] = useState([]);

  const [item, setItem] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [lifeMonths, setLifeMonths] = useState(12);
  const [note, setNote] = useState("");

  const [errors, setErrors] = useState({});

  useEffect(() => {
    api.get("clothes/").then(res => setItems(res.data));
  }, []);

  const selectedItem = items.find(i => i.id === Number(item));

  const requiresSize =
    selectedItem &&
    (selectedItem.type === "top" || selectedItem.type === "shoes");


  const validate = () => {
    const errs = {};

    if (!item) errs.item = "Выберите экипировку";
    if (!quantity || quantity <= 0) errs.quantity = "Количество должно быть больше 0";
    if (requiresSize && !size) errs.size = "Укажите размер";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onAdd({
      item: Number(item), // id — для API
      item_name: selectedItem?.name, // имя — для UI
      size: requiresSize ? Number(size) : null,
      quantity: Number(quantity),
      operation_life_months: Number(lifeMonths),
      note
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 space-y-4">

        <h3 className="text-lg font-semibold">Добавить позицию</h3>

        {/* Экипировка */}
        <div>
          <label className="block text-sm font-medium mb-1">Наименование</label>
          <select
            value={item}
            onChange={e => setItem(e.target.value)}
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
        {requiresSize && (
          <div>
            <label className="block text-sm font-medium mb-1">Размер</label>
            <input
              type="number"
              value={size}
              onChange={e => setSize(e.target.value)}
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
            min="1"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
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
            min="1"
            value={lifeMonths}
            onChange={e => setLifeMonths(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {/* Примечание */}
        <div>
          <label className="block text-sm font-medium mb-1">Примечание</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
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
            className="px-4 py-2 rounded-lg bg-blue-600 text-white"
          >
            Добавить
          </button>
        </div>
      </div>
    </div>
  );
}
