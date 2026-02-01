// основная форма

import { useState, useEffect } from "react";
import api from "../../api/api";
import IssueItemModal from "./IssueItemModal";
import IssueItemsTable from "./IssueItemsTable";

export default function IssueCreate() {
  const [employees, setEmployees] = useState([]);
  const [employee, setEmployee] = useState("");
  const [date, setDate] = useState("");
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.get("employees/").then(res => setEmployees(res.data));
  }, []);

  const handleAddItem = (item) => {
    setItems(prev => [...prev, item]);
  };

  const handleRemoveItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!employee || !date || items.length === 0) {
      alert("Заполните все данные");
      return;
    }

    try {
      await api.post("issues/", {
        employee,
        date_received: date,
        items,
      });

      alert("Выдача оформлена");
      setEmployee("");
      setDate("");
      setItems([]);
    } catch (e) {
      console.error(e);
      alert("Ошибка при оформлении выдачи");
    }
  };


  return (
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Заголовок */}
        <div>
          <h2 className="text-2xl font-bold">Выдача спецодежды</h2>
          <p className="text-gray-500">
            Оформление выдачи спецодежды сотруднику
          </p>
        </div>

        {/* Сотрудник + Дата */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Сотрудник</label>
            <select
              value={employee}
              onChange={e => setEmployee(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Выберите сотрудника</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.last_name} {e.first_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Дата выдачи
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {/* Общее примечание */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Примечание
          </label>
          <textarea
            rows={3}
            placeholder="Общее примечание к выдаче…"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {/* Разделитель */}
        <hr className="my-6" />

        {/* Заголовок + кнопка */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Позиции выдачи</h3>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 text-blue-600 font-medium "
          >
            <span className="text-xl leading-none">+</span>
            Добавить позицию
          </button>
        </div>

        {/* Таблица позиций */}
        <IssueItemsTable
          items={items}
          onRemove={handleRemoveItem}
        />

        {/* Кнопка оформления */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
          >
            ✓ Оформить выдачу
          </button>
        </div>

        {/* Модалка */}
        {showModal && (
          <IssueItemModal
            onClose={() => setShowModal(false)}
            onAdd={handleAddItem}
          />
        )}
      </div>
    );


}
