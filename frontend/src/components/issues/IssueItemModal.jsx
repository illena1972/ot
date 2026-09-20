import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";

export default function IssueItemModal({
  onClose,
  onAdd,
  entitlementItems = [],
  initialItemId = "",
  initialQuantity = 1,
}) {
  const [items, setItems] = useState([]);
  const [available, setAvailable] = useState(null);
  const initialNormItem = entitlementItems.find(
    row => row.item === Number(initialItemId)
  );

  const [form, setForm] = useState({
    item: initialItemId || "",
    quantity: initialQuantity || 1,
    size: null,
    height: null,
    operation_life_months: initialNormItem?.operation_life_months || 12,
    note: "",
  });

  const [errors, setErrors] = useState({});

  // 🔹 Загрузка одежды
  useEffect(() => {
    api.get("clothes/")
      .then(res => setItems(res.data))
      .catch(err => console.error(err));
  }, []);

  const selectedItem = useMemo(
    () => items.find(i => i.id === Number(form.item)) || null,
    [form.item, items]
  );

  const selectedNormItem = useMemo(
    () => entitlementItems.find(row => row.item === Number(form.item)) || null,
    [entitlementItems, form.item]
  );

  const canCheckAvailability = Boolean(
    selectedItem &&
    (selectedItem.type === "other" ||
      (selectedItem.type === "shoes" && form.size) ||
      (selectedItem.type === "top" && form.size && form.height))
  );

  // 🔹 Проверка доступного количества на складе
  useEffect(() => {
    if (!canCheckAvailability) {
      return;
    }

    let active = true;
    const params = { item: form.item };
    if (form.size) params.size = form.size;
    if (form.height) params.height = form.height;

    api.get("stocks/available/", { params })
      .then(res => {
        if (active) setAvailable(res.data.available);
      })
      .catch(() => {
        if (active) setAvailable(0);
      });

    return () => {
      active = false;
    };
  }, [canCheckAvailability, form.item, form.size, form.height]);

  // 🔹 Обработка изменений полей
  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = value === "" ? null : value;

    if (["item", "size", "height"].includes(name)) {
      setAvailable(null);
    }

    setForm(prev => {
      const nextForm = {
        ...prev,
        [name]: nextValue,
      };

      if (name === "item") {
        const nextItem = items.find(i => i.id === Number(nextValue));
        const nextNormItem = entitlementItems.find(
          row => row.item === Number(nextValue)
        );

        nextForm.operation_life_months = nextNormItem
          ? nextNormItem.operation_life_months
          : 12;

        if (nextItem?.type === "other") {
          nextForm.size = null;
          nextForm.height = null;
        } else if (nextItem?.type === "shoes") {
          nextForm.height = null;
        }
      }

      return nextForm;
    });
  };

  // 🔹 Валидация
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
    }

    if (selectedItem?.type === "other") {
      if (form.size || form.height) errs.size = "Для безразмерной одежды размеры не указываются";
    }

    if (canCheckAvailability && available === null) {
      errs.quantity = "Дождитесь проверки наличия на складе";
    } else if (available !== null && form.quantity > available) {
      errs.quantity = `Недостаточно на складе (доступно ${available})`;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // 🔹 Отправка формы
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
              <option key={i.id} value={i.id}>{i.name}</option>
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

        {/* Рост только для верхней одежды */}
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

        {/* Доступно на складе */}
        {available !== null && (
          <p className="text-sm text-gray-600">
            Доступно на складе:{" "}
            <span className={available > 0 ? "font-semibold" : "text-red-600"}>
              {available}
            </span>
          </p>
        )}

        {canCheckAvailability && available === null && (
          <p className="text-sm text-gray-500">Проверяем наличие на складе...</p>
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
          {errors.quantity && <p className="text-red-600 text-sm">{errors.quantity}</p>}
        </div>

        {/* Срок эксплуатации */}
        <div>
          <label className="block text-sm font-medium mb-1">Срок эксплуатации (мес.)</label>
          <input
            type="number"
            name="operation_life_months"
            min="1"
            value={form.operation_life_months}
            onChange={handleChange}
            disabled={Boolean(selectedNormItem)}
            className="w-full border rounded-lg px-3 py-2"
          />
          {selectedNormItem && (
            <p className="mt-1 text-sm text-gray-500">
              Срок установлен нормой «{selectedNormItem.operation_life_months} мес.»
            </p>
          )}
        </div>

        {/* Примечание */}
        <div>
          <label className="block text-sm font-medium mb-1">Примечание</label>
          <textarea
            name="note"
            value={form.note}
            onChange={handleChange}
            rows={2}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {/* Кнопки */}
        <div className="flex justify-end space-x-3 pt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border">Отмена</button>
          <button
            onClick={handleSubmit}
            disabled={
              !canCheckAvailability ||
              available === null ||
              Number(form.quantity) > available
            }
            className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:bg-gray-400"
          >
            Добавить
          </button>
        </div>
      </div>
    </div>
  );
}














