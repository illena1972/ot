import { useState } from "react";
import api from "../../api/api";
import AlertModal from "../ui/AlertModal";

function ClothesForm({ clothes, onSuccess }) {
      const [form, setForm] = useState({
      name: clothes?.name || "",
      type: clothes?.type || "top",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    if (clothes) {
      // 🔄 редактирование
      await api.put(`clothes/${clothes.id}/`, form);
    } else {
      // ➕ создание
      await api.post("clothes/", form);
    }

    if (onSuccess) onSuccess();
  } catch (err) {
      console.error(err);

      if (err.response?.data?.name) {
        setErrorMessage(err.response.data.name[0]);
      } else {
        setErrorMessage("Ошибка при сохранении");
      }
    }
};


  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {clothes ? "Редактировать одежду" : "Добавить одежду"}
        </h2>

        {/* Сетка формы */}
        <div className="grid grid-cols-1 gap-6">

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




            {/* Тип одежды */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Тип одежды
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="top">Верхняя одежда</option>
                <option value="shoes">Обувь</option>
                <option value="other">Безразмерная</option>
              </select>
            </div>
            <div></div>
        </div>

        <div className="flex justify-center space-x-4 pt-4">

            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold">
              {clothes ? "Сохранить изменения" : "Добавить"}
            </button>


            </div>
       </form>

      <AlertModal
        title="Ошибка"
        message={errorMessage}
        onClose={() => setErrorMessage("")}
      />
    </>

  );
}

export default ClothesForm;
