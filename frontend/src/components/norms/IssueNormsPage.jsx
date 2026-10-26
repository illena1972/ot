import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import api from "../../api/api";
import AlertModal from "../ui/AlertModal";

const newRow = () => ({ item: "", quantity: 1, operation_life_months: 12 });
const newForm = () => ({ name: "", description: "", position_ids: [], items: [newRow()] });
const asList = (data) => (Array.isArray(data) ? data : data.results || []);

function formSnapshot(form) {
  if (!form) return "";
  return JSON.stringify({
    name: form.name,
    description: form.description,
    position_ids: [...form.position_ids].map(Number).sort((a, b) => a - b),
    items: form.items.map((row) => ({
      item: String(row.item),
      quantity: String(row.quantity),
      operation_life_months: String(row.operation_life_months),
    })),
  });
}

function positionCountLabel(count) {
  const lastTwoDigits = count % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return `${count} позиций`;
  const lastDigit = count % 10;
  if (lastDigit === 1) return `${count} позиция`;
  if (lastDigit >= 2 && lastDigit <= 4) return `${count} позиции`;
  return `${count} позиций`;
}

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
  const [search, setSearch] = useState("");
  const [expandedNormIds, setExpandedNormIds] = useState(() => new Set());
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const firstItemSelectRef = useRef(null);
  const formElementRef = useRef(null);
  const initialFormSnapshotRef = useRef("");

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

  const openCreate = () => {
    const nextForm = newForm();
    setEditingId(null);
    initialFormSnapshotRef.current = formSnapshot(nextForm);
    setForm(nextForm);
  };

  const openEdit = (norm) => {
    const nextForm = {
      name: norm.name,
      description: norm.description || "",
      position_ids: norm.position_ids,
      items: norm.items.map((row) => ({
        item: row.item,
        quantity: row.quantity,
        operation_life_months: row.operation_life_months,
      })),
    };
    setEditingId(norm.id);
    initialFormSnapshotRef.current = formSnapshot(nextForm);
    setForm(nextForm);
  };

  const closeForm = () => {
    setShowUnsavedConfirm(false);
    setForm(null);
    setEditingId(null);
    initialFormSnapshotRef.current = "";
  };

  const requestCloseForm = () => {
    if (formSnapshot(form) === initialFormSnapshotRef.current) closeForm();
    else setShowUnsavedConfirm(true);
  };

  const saveBeforeClose = () => {
    setShowUnsavedConfirm(false);
    requestAnimationFrame(() => formElementRef.current?.requestSubmit());
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
      closeForm();
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

  const toggleNorm = (normId) => {
    setExpandedNormIds((current) => {
      const next = new Set(current);
      if (next.has(normId)) next.delete(normId);
      else next.add(normId);
      return next;
    });
  };

  const addItem = () => {
    setForm((current) => ({ ...current, items: [newRow(), ...current.items] }));
    requestAnimationFrame(() => firstItemSelectRef.current?.focus());
  };

  const normalizedSearch = search.trim().toLocaleLowerCase("ru-RU");
  const filteredNorms = norms.filter((norm) => {
    if (!normalizedSearch) return true;
    return [norm.name, norm.description, ...norm.position_names]
      .filter(Boolean)
      .some((value) => value.toLocaleLowerCase("ru-RU").includes(normalizedSearch));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Нормы выдачи</h2>
          <p className="mt-2 text-base text-gray-600">Состав СИЗ и сроки по должностям</p>
        </div>
        <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">
          <i className="fa-solid fa-plus" aria-hidden="true" /> Добавить норму
        </button>
      </div>

      <div className="border-y border-gray-200 bg-white px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-md">
            <span className="sr-only">Поиск нормы или должности</span>
            <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Найти норму или должность"
              className="form-control pl-10"
            />
          </label>
          <div className="text-sm text-gray-500">
            Показано норм: <span className="font-semibold text-gray-800">{filteredNorms.length}</span>
            {filteredNorms.length !== norms.length && ` из ${norms.length}`}
          </div>
        </div>
      </div>

      <div className="overflow-hidden border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] table-fixed text-left">
            <thead className="bg-gray-50 text-sm text-gray-500">
              <tr>
                <th className="w-16 px-5 py-4 text-center font-semibold">№</th>
                <th className="w-[29%] px-5 py-4 font-semibold">Норма</th>
                <th className="w-[37%] px-5 py-4 font-semibold">Должности</th>
                <th className="w-44 px-5 py-4 font-semibold">Состав</th>
                <th className="w-28 px-5 py-4 text-right font-semibold">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredNorms.map((norm, index) => (
                <Fragment key={norm.id}>
                  <tr className="hover:bg-gray-50/70">
                    <td className="px-5 py-5 text-center align-top font-semibold text-gray-500">{index + 1}</td>
                    <td className="px-5 py-5 align-top">
                      <button
                        type="button"
                        onClick={() => toggleNorm(norm.id)}
                        className="text-left"
                        aria-expanded={expandedNormIds.has(norm.id)}
                        aria-controls={`norm-details-${norm.id}`}
                      >
                        <span className="text-lg font-bold text-gray-900 hover:text-blue-700">{norm.name}</span>
                      </button>
                      {norm.description && <div className="mt-2 text-sm leading-5 text-gray-500">{norm.description}</div>}
                    </td>
                    <td className="px-5 py-5 align-top text-gray-700">
                      {norm.position_names.length ? (
                        <div className="space-y-1.5">
                          {norm.position_names.map((positionName) => (
                            <div key={positionName} className="leading-5">{positionName}</div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">Не назначена</span>
                      )}
                    </td>
                    <td className="px-5 py-5 align-top">
                      <button
                        type="button"
                        onClick={() => toggleNorm(norm.id)}
                        className="inline-flex items-center gap-2 font-semibold text-blue-700 hover:text-blue-900"
                        aria-expanded={expandedNormIds.has(norm.id)}
                        aria-controls={`norm-details-${norm.id}`}
                      >
                        {positionCountLabel(norm.items.length)}
                        <i className={`fa-solid fa-chevron-down text-xs transition-transform ${expandedNormIds.has(norm.id) ? "rotate-180" : ""}`} aria-hidden="true" />
                      </button>
                    </td>
                    <td className="px-5 py-5 align-top">
                      <div className="flex justify-end gap-2">
                        <button type="button" title="Редактировать" onClick={() => openEdit(norm)} className="icon-btn"><i className="fa-solid fa-pen" aria-hidden="true" /></button>
                        <button type="button" title="Удалить" onClick={() => setDeleteNorm(norm)} className="icon-btn-danger"><i className="fa-regular fa-trash-can" aria-hidden="true" /></button>
                      </div>
                    </td>
                  </tr>
                  {expandedNormIds.has(norm.id) && (
                    <tr id={`norm-details-${norm.id}`}>
                      <td colSpan="5" className="bg-gray-50 px-5 py-5">
                        <div className="mb-3 flex items-center justify-between gap-4">
                          <h3 className="font-semibold text-gray-800">Состав нормы «{norm.name}»</h3>
                          <span className="text-sm text-gray-500">Всего позиций: {norm.items.length}</span>
                        </div>
                        <div className="overflow-hidden border border-gray-200 bg-white">
                          <table className="w-full table-fixed text-left">
                            <thead className="bg-gray-100 text-sm text-gray-600">
                              <tr>
                                <th className="w-16 px-4 py-3 text-center font-semibold">№</th>
                                <th className="px-4 py-3 font-semibold">Наименование СИЗ</th>
                                <th className="w-36 px-4 py-3 text-center font-semibold">Количество</th>
                                <th className="w-48 px-4 py-3 text-center font-semibold">Срок эксплуатации</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {norm.items.map((row, itemIndex) => (
                                <tr key={row.id}>
                                  <td className="px-4 py-3 text-center font-medium text-gray-500">{itemIndex + 1}</td>
                                  <td className="px-4 py-3 font-medium leading-5 text-gray-800">{row.item_name}</td>
                                  <td className="px-4 py-3 text-center text-gray-700">{row.quantity} шт.</td>
                                  <td className="px-4 py-3 text-center text-gray-700">{row.operation_life_months} мес.</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {!filteredNorms.length && (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                    {norms.length ? "Нормы по заданному поиску не найдены" : "Нормы пока не созданы"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form ref={formElementRef} onSubmit={saveNorm} className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">{editingId ? "Редактирование нормы" : "Новая норма"}</h3>
              <button type="button" title="Закрыть" onClick={requestCloseForm} disabled={saving} className="icon-btn disabled:cursor-not-allowed disabled:opacity-40"><i className="fa-solid fa-xmark" aria-hidden="true" /></button>
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
                <button type="button" onClick={addItem} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
                  <i className="fa-solid fa-plus" aria-hidden="true" /> Добавить позицию
                </button>
              </div>
              <div className="space-y-3">
                {form.items.map((row, index) => (
                  <div key={index} className="grid items-end gap-3 border-b border-gray-100 pb-3 md:grid-cols-[1fr_120px_170px_44px]">
                    <label className="text-sm text-gray-600">СИЗ
                      <select ref={index === 0 ? firstItemSelectRef : undefined} required value={row.item} onChange={(e) => updateItem(index, "item", e.target.value)} className="form-control mt-1">
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

            <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 flex justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4 shadow-[0_-8px_18px_rgba(15,23,42,0.08)]">
              <button type="button" onClick={requestCloseForm} disabled={saving} className="rounded-lg border border-gray-300 px-5 py-2.5 disabled:cursor-not-allowed disabled:opacity-40">Отмена</button>
              <button disabled={saving} type="submit" className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white disabled:bg-gray-400">{saving ? "Сохранение..." : "Сохранить"}</button>
            </div>
          </form>
        </div>
      )}

      {showUnsavedConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="unsaved-norm-title" className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 id="unsaved-norm-title" className="text-xl font-semibold text-gray-800">Есть несохраненные изменения</h3>
            <p className="mt-3 text-gray-600">Сохранить изменения нормы перед закрытием?</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setShowUnsavedConfirm(false)} className="rounded-lg border border-gray-300 px-5 py-2.5">Продолжить редактирование</button>
              <button type="button" onClick={closeForm} className="rounded-lg border border-red-300 px-5 py-2.5 font-semibold text-red-700 hover:bg-red-50">Выйти без сохранения</button>
              <button type="button" onClick={saveBeforeClose} className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700">Сохранить</button>
            </div>
          </div>
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
