// основная форма
import { useState, useEffect } from "react";
import api from "../../api/api";
import IssueItemModal from "./IssueItemModal";
import IssueItemsTable from "./IssueItemsTable";
import Select from "react-select";

export default function IssueCreate() {
  const [employees, setEmployees] = useState([]);
  const [employee, setEmployee] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState(""); // общее примечание
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Загрузка сотрудников
  useEffect(() => {
    api.get("employees/").then(res => setEmployees(res.data));
  }, []);

  // Добавление позиции в список
  const handleAddItem = (item) => {
    console.log("ADD ITEM:", item);     // отладка
    setItems(prev => [...prev, item]);
  };

  // Удаление позиции
  const handleRemoveItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Оформление выдачи
  const handleSubmit = async () => {
    if (!employee || !date || items.length === 0) {
      alert("Заполните все данные");
      return;
    }

    try {
      // Отправляем только поля, которые нужны бэкенду
      const payload = {
        employee,
        date_received: date,
        note,
        items: items.map(i => ({
          item: i.item, // id одежды
          quantity: i.quantity,
          size: i.size,
          height: i.height,
          operation_life_months: i.operation_life_months,
          note: i.note,
        })),
      };

      await api.post("issues/", payload);

      alert("Выдача оформлена");
      setEmployee("");
      setDate("");
      setNote("");
      setItems([]);
    } catch (e) {
      console.error(e);
      alert("Ошибка при оформлении выдачи");
    }
  };

  const employeeOptions = employees.map((e) => ({
  value: e.id,
  label: `${e.last_name} ${e.first_name} ${e.middle_name || ""}`.trim(),
  }));

  return (
  <div className="max-w-5xl mx-auto space-y-6">

    {/* Заголовок */}
    <div>
      <h2 className="text-3xl font-bold text-gray-800">
        Выдача спецодежды
      </h2>
      <p className="text-base text-gray-600 mt-2">
        Оформление выдачи сотруднику
      </p>
    </div>

    {/* Форма */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div>
          <label className="block text-sm text-gray-500 mb-1">
            Сотрудник
          </label>

          <Select
            options={employeeOptions}
            value={employeeOptions.find((opt) => opt.value === employee) || null}
            onChange={(selected) => setEmployee(selected ? selected.value : "")}
            placeholder="Выберите сотрудника"
            isClearable
            isSearchable
            className="text-base"
            styles={{
              control: (base, state) => ({
                ...base,
                minHeight: "50px",
                borderRadius: "0.75rem",
                borderColor: state.isFocused ? "#60a5fa" : "#d1d5db",
                boxShadow: "none",
                "&:hover": {
                  borderColor: state.isFocused ? "#60a5fa" : "#9ca3af",
                },
              }),
              placeholder: (base) => ({
                ...base,
                color: "#9ca3af",
              }),
              menu: (base) => ({
                ...base,
                borderRadius: "0.75rem",
                overflow: "hidden",
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isFocused ? "#eff6ff" : "white",
                color: "#1f2937",
                cursor: "pointer",
              }),
            }}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-1">
            Дата выдачи
          </label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="form-control"
          />
        </div>

      </div>

      <div>
        <label className="block text-sm text-gray-500 mb-1">
          Примечание
        </label>
        <textarea
          rows={3}
          placeholder="Общее примечание..."
          value={note}
          onChange={e => setNote(e.target.value)}
          className="form-control"
        />
      </div>

    </div>

    {/* Позиции */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">

      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-800">
          Позиции выдачи
        </h3>

        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm"
        >
          + Добавить позицию
        </button>
      </div>

      <IssueItemsTable
        items={items}
        onRemove={handleRemoveItem}
      />

    </div>

    {/* Кнопка */}
    <div className="flex justify-end">
      <button
        onClick={handleSubmit}
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold text-base"
      >
        Оформить выдачу
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
