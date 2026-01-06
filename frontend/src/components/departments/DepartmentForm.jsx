import { useState } from "react";
import api from "../../api/api";

function DepartmentForm({ onCreated }) {

  // хранит то, что пользователь вводит
  const [name, setName] = useState("");

  // отправляет POST в Django
  //  👉 { name } = { name: "Отдел кадров" }
  const handleSubmit = async (e) => {
    e.preventDefault();

    await api.post("departments/", { name });
    setName("");
    alert("Подразделение добавлено");

    // это callback от родителя, чтобы обновить список
    if (onCreated) {
      onCreated();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Добавить подразделение</h3>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Название подразделения"
      />

      <button type="submit">Сохранить</button>
    </form>
  );
}

export default DepartmentForm;
