import { useCallback, useEffect, useState } from "react";
import api from "../../api/api";
import AlertModal from "../ui/AlertModal";

const newRow = () => ({ item: "", quantity: 1, operation_life_months: 12 });
const newForm = () => ({ name: "", description: "", position_ids: [], items: [newRow()] });
const asList = (data) => (Array.isArray(data) ? data : data.results || []);

function errorMessage(error) {
  return Object.values(error.response?.data || {}).flat(Infinity).find(
    (value) => typeof value === "string",
  ) || "Не удалось сохранить норму";
}

export default function IssueNormsPage() {
  const [norms, setNorms] = useState([]);
  const [positions, setPositions] = useState([]);
  const [clothes, setClothes] = useState([]);
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deleteNorm, setDeleteNorm] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [normResponse, positionResponse, clothesResponse] = await Promise.all([
        api.get("issue-norms/"), api.get("positions/"), api.get("clothes/"),
      ]);
      setNorms(asList(normResponse.data));
      setPositions(asList(positionResponse.data));
      setClothes(asList(clothesResponse.data));
    } catch {
      setError("Не удалось загрузить нормы выдачи");
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openEdit = (norm) => {
    setEditingId(norm.id);
    setForm({
      name: norm.name,
      description: norm.description || "",
      position_ids: norm.position_ids,
      items: norm.items.map((row) => ({
        item: row.item,
        quantity: row.quantity,
        operation_life_months: row.operation_life_months,
      })),
    });
  };

  const updateItem = (index, field, value) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row),
    }));
  };

  const saveNorm = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        items: form.items.map((row) => ({
          item: Number(row.item),
          quantity: Number(row.quantity),
          operation_life_months: Number(row.operation_life_months),
        })),
      };
      if (editingId) await api.put(`issue-norms/${editingId}/`, payload);
      else await api.post("issue-norms/", payload);
      setForm(null);
      await loadData();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const removeNorm = async () => {
    try {
      await api.delete(`issue-norms/${deleteNorm.id}/`);
      setDeleteNorm(null);
      await loadData();
    } catch {
      setError("Не удалось удалить норму");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Нормы выдачи</h2>
          <p className="mt-2 text-base text-gray-600">Состав СИЗ и сроки по должностям</p>
        </div>
        <button type="button" onClick={() => { setEditingId(null); setForm(newForm()); }} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">
          <i className="fa-solid fa-plus" aria-hidden="true" /> Добавить норму
        </button>
      </div>

      <div className="overflow-hidden border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-sm text-gray-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Норма</th>
                <th className="px-6 py-4 font-semibold">Должности</th>
                <th className="px-6 py-4 font-semibold">Состав</th>
                <th className="px-6 py-4 text-right font-semibold">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {norms.map((norm) => (
                <tr key={norm.id}>
                  <td className="px-6 py-4 align-top">
                    <div className="font-semibold text-gray-800">{norm.name}</div>
                    {norm.description && <div className="mt-1 text-sm text-gray-500">{norm.description}</div>}
                  </td>
                  <td className="px-6 py-4 align-top text-gray-700">{norm.position_names.length ? norm.position_names.join(", ") : "Не назначена"}</td>
                  <td className="px-6 py-4 align-top text-sm text-gray-700">
                    {norm.items.map((row) => <div key={row.id}>{row.item_name}: {row.quantity} шт., {row.operation_life_months} мес.</div>)}
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex justify-end gap-2">
                      <button type="button" title="Редактировать" onClick={() => openEdit(norm)} className="icon-btn"><i className="fa-solid fa-pen" aria-hidden="true" /></button>
                      <button type="button" title="Удалить" onClick={() => setDeleteNorm(norm)} className="icon-btn-danger"><i className="fa-regular fa-trash-can" aria-hidden="true" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!norms.length && <tr><td colSpan="4" className="px-6 py-10 text-center text-gray-500">Нормы пока не созданы</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={saveNorm} className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">{editingId ? "Редактирование нормы" : "Новая норма"}</h3>
              <button type="button" title="Закрыть" onClick={() => setForm(null)} className="icon-btn"><i className="fa-solid fa-xmark" aria-hidden="true" /></button>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="text-sm font-medium text-gray-700">Наименование нормы
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-control mt-1" />
              </label>
              <label className="text-sm font-medium text-gray-700">Примечание
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="form-control mt-1" />
              </label>
            </div>

            <fieldset className="mt-6">
              <legend className="mb-2 font-semibold text-gray-800">Должности</legend>
              <div className="grid max-h-40 gap-2 overflow-y-auto border border-gray-200 p-3 sm:grid-cols-2 lg:grid-cols-3">
                {positions.map((position) => (
                  <label key={position.id} className="flex items-start gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={form.position_ids.includes(position.id)} onChange={(e) => setForm({
                      ...form,
                      position_ids: e.target.checked ? [...form.position_ids, position.id] : form.position_ids.filter((id) => id !== position.id),
                    })} className="mt-1" />
                    {position.name}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-semibold text-gray-800">Положенные СИЗ</h4>
                <button type="button" onClick={() => setForm({ ...form, items: [...form.items, newRow()] })} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
                  <i className="fa-solid fa-plus" aria-hidden="true" /> Добавить позицию
                </button>
              </div>
              <div className="space-y-3">
                {form.items.map((row, index) => (
                  <div key={index} className="grid items-end gap-3 border-b border-gray-100 pb-3 md:grid-cols-[1fr_120px_170px_44px]">
                    <label className="text-sm text-gray-600">СИЗ
                      <select required value={row.item} onChange={(e) => updateItem(index, "item", e.target.value)} className="form-control mt-1">
                        <option value="">Выберите</option>
                        {clothes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                      </select>
                    </label>
                    <label className="text-sm text-gray-600">Количество
                      <input required min="1" type="number" value={row.quantity} onChange={(e) => updateItem(index, "quantity", e.target.value)} className="form-control mt-1" />
                    </label>
                    <label className="text-sm text-gray-600">Срок, месяцев
                      <input required min="1" type="number" value={row.operation_life_months} onChange={(e) => updateItem(index, "operation_life_months", e.target.value)} className="form-control mt-1" />
                    </label>
                    <button type="button" title="Удалить позицию" disabled={form.items.length === 1} onClick={() => setForm({ ...form, items: form.items.filter((_, rowIndex) => rowIndex !== index) })} className="icon-btn-danger disabled:cursor-not-allowed disabled:opacity-40">
                      <i className="fa-regular fa-trash-can" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setForm(null)} className="rounded-lg border border-gray-300 px-5 py-2.5">Отмена</button>
              <button disabled={saving} type="submit" className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white disabled:bg-gray-400">{saving ? "Сохранение..." : "Сохранить"}</button>
            </div>
          </form>
        </div>
      )}

      {deleteNorm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-gray-800">Удалить норму?</h3>
            <p className="mt-3 text-gray-600">Норма «{deleteNorm.name}» будет снята со всех должностей.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteNorm(null)} className="rounded-lg border border-gray-300 px-5 py-2.5">Отмена</button>
              <button type="button" onClick={removeNorm} className="rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white">Удалить</button>
            </div>
          </div>
        </div>
      )}

      <AlertModal title="Ошибка" message={error} onClose={() => setError("")} />
    </div>
  );
}
