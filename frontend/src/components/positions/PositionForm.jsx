import { useEffect, useState } from "react";
import api from "../../api/api";

function PositionForm({ position, onSuccess }) {
  const [form, setForm] = useState({
    name: position?.name || "",
  });

  useEffect(() => {
  if (position) {
    setForm({
      name: position.name || "",
    });
  }
}, [position]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    if (position) {
      // 🔄 редактирование
      await api.put(`positions/${position.id}/`, form);
    } else {
      // ➕ создание
      await api.post("positions/", form);
    }

    if (onSuccess) onSuccess();
  } catch (err) {
    console.error(err);
    alert("Ошибка при сохранении");
  }
};


  return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {position ? "Редактировать должность" : "Добавить должность"}
        </h2>

        {/* Сетка формы */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">

             {/* Наименование */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
               Наименование
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

        </div>

        <div className="flex justify-center space-x-4 pt-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
              >
               {position ? "Сохранить изменения" : "Добавить"}
              </button>
            </div>
       </form>


  );
}

export default PositionForm;