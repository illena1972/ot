import { useEffect, useState } from "react";
import api from "../../api/api";

function DepartmentForm({ department, onSuccess }) {
  const [form, setForm] = useState({
    name: department?.name || "",
  });


  useEffect(() => {
  if (department) {
    setForm({
      name: department.name || "",
    });
  }
}, [department]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    if (department) {
      // 🔄 редактирование
      await api.put(`departments/${department.id}/`, form);
    } else {
      // ➕ создание
      await api.post("departments/", form);
    }

    if (onSuccess) onSuccess();
  } catch (err) {
      console.error(err);

      if (err.response?.data?.name) {
        alert(err.response.data.name[0]);
      } else {
        alert("Ошибка при сохранении");
      }
    }
};


  return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {department ? "Редактировать подразделение" : "Добавить подразделение"}
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
                {department ? "Сохранить изменения" : "Добавить"}
              </button>
            </div>
       </form>


  );
}

export default DepartmentForm;
