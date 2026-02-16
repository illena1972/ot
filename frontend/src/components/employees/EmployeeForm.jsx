import { useEffect, useState } from "react";
import api from "../../api/api";

function EmployeeForm({ employee, onSuccess }) {
      const [form, setForm] = useState({
      last_name: employee?.last_name || "",
      first_name: employee?.first_name || "",
      middle_name: employee?.middle_name || "",
      sex: employee?.sex || "M",
      department: employee?.department ? String(employee.department) : "",
      service: employee?.service ? String(employee.service) : "",
      position: employee?.position ? String(employee.position) : "",
      clothes_size: employee?.clothes_size || "",
      height: employee?.height || "",
      shoe_size: employee?.shoe_size || "",
  });

  useEffect(() => {
  if (employee) {
    setForm({
      last_name: employee.last_name || "",
      first_name: employee.first_name || "",
      middle_name: employee.middle_name || "",
      sex: employee.sex || "M",
      department: employee?.department ? String(employee.department) : "",
      service: employee?.service ? String(employee.service) : "",
      position: employee?.position ? String(employee.position) : "",
      clothes_size: employee.clothes_size || "",
      height: employee.height || "",
      shoe_size: employee.shoe_size || "",
    });
  }
}, [employee]);


  const [departments, setDepartments] = useState([]);
  const [services, setServices] = useState([]);
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    api.get("departments/").then(res => setDepartments(res.data));
    api.get("services/").then(res => setServices(res.data));
    api.get("positions/").then(res => setPositions(res.data));
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    if (employee) {
      // 🔄 редактирование
      await api.put(`employees/${employee.id}/`, form);
    } else {
      // ➕ создание
      await api.post("employees/", form);
    }

    if (onSuccess) onSuccess();
  } catch (err) {
      console.error(err);

      if (err.response?.data) {
          const data = err.response.data;

          if (data.non_field_errors) {
            alert(data.non_field_errors[0]);
            return;
          }
      }

      alert("Ошибка при сохранении");
    }

};


  return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {employee ? "Редактировать сотрудника" : "Добавить сотрудника"}
        </h2>

        {/* Сетка формы */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

             {/* Фамилия */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Фамилия
              </label>
              <input
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>


             {/* Имя */}
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Имя
              </label>
              <input
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

             {/* Отчество */}
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Отчество
              </label>
              <input
                name="middle_name"
                value={form.middle_name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>



            {/* Пол */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Пол
              </label>
              <select
                name="sex"
                value={form.sex}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="M">Мужской</option>
                <option value="F">Женский</option>
              </select>
            </div>

             <div></div>
             <div></div>


            {/* Подразделение */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Подразделение
              </label>
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Выберите</option>
                {departments.map(dep => (
                  <option key={dep.id} value={dep.id}>
                    {dep.name}
                  </option>
                ))}
              </select>
            </div>


             {/* Служба */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Служба
              </label>
              <select
                name="service"
                value={form.service}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Выберите</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

             {/* Должность */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Должность
              </label>
              <select
                name="position"
                value={form.position}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Выберите</option>
                {positions.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Рост */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Рост
              </label>
              <input
                type="number"
                name="height"
                value={form.height}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>

             {/* Размер одежды */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Размер одежды
              </label>
              <input
                type="number"
                name="clothes_size"
                value={form.clothes_size}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>



             {/* Размер обуви */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Размер обуви
              </label>
              <input
                type="number"
                name="shoe_size"
                value={form.shoe_size}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>

            <div></div>



        </div>

        <div className="flex justify-center space-x-4 pt-4">

            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold">
              {employee ? "Сохранить изменения" : "Добавить"}
            </button>


            </div>
       </form>


  );
}

export default EmployeeForm;
