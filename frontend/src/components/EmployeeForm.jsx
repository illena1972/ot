import { useEffect, useState } from "react";
import api from "../api/api";

function EmployeeForm() {
  const [form, setForm] = useState({
    last_name: "",
    first_name: "",
    middle_name: "",
    sex: "M",
    department: "",
    service: "",
    position: "",
    clothes_size: "",
    height: "",
    shoe_size: "",
  });

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

  await api.post("employees/", form);
  alert("Сотрудник добавлен");
};




  return (
  <form onSubmit={handleSubmit}>

    <h2>Добавить сотрудника</h2>

    <input
      name="last_name"
      placeholder="Фамилия"
      value={form.last_name}
      onChange={handleChange}
    />

    <input
      name="first_name"
      placeholder="Имя"
      value={form.first_name}
      onChange={handleChange}
    />

    <input
      name="middle_name"
      placeholder="Отчество"
      value={form.middle_name}
      onChange={handleChange}
    />

    <select name="sex" value={form.sex} onChange={handleChange}>
      <option value="M">Мужской</option>
      <option value="F">Женский</option>
    </select>

    <select name="department" value={form.department} onChange={handleChange}>
      <option value="">Подразделение</option>
      {departments.map(dep => (
        <option key={dep.id} value={dep.id}>
          {dep.name}
        </option>
      ))}
    </select>

    <select name="service" value={form.service} onChange={handleChange}>
      <option value="">Служба</option>
      {services.map(s => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>

    <select name="position" value={form.position} onChange={handleChange}>
      <option value="">Должность</option>
      {positions.map(p => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>

    <input
        name="clothes_size"
        type="number"
        placeholder="Размер одежды"
        value={form.clothes_size}
        onChange={handleChange}
      />

    <input
      type="number"
      name="height"
      placeholder="Рост"
      value={form.height}
      onChange={handleChange}
    />

    <input
        name="shoe_size"
        type="number"
        placeholder="Размер обуви"
        value={form.shoe_size}
        onChange={handleChange}
     />




    <button type="submit">Сохранить</button>
  </form>
);

}

export default EmployeeForm;
