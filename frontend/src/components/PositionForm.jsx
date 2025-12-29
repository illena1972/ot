import { useState } from "react";
import api from "../api/api";

function PositionForm({ onCreated }) {

  // хранит то, что пользователь вводит
  const [name, setName] = useState("");

  // отправляет POST в Django
  //  👉 { name } = { name: "Отдел кадров" }
  const handleSubmit = async (e) => {
    e.preventDefault();

    // берем из url
    await api.post("positions/", { name });
    setName("");
    alert("Должность добавлена");

    // это callback от родителя, чтобы обновить список
    if (onCreated) {
      onCreated();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Добавить должность</h3>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Название должности"
      />

      <button type="submit">Сохранить</button>
    </form>
  );
}

export default PositionForm;
