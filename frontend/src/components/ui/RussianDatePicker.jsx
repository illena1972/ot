import { useMemo, useRef, useState, useEffect } from "react";

const MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const parseDate = (value) => {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
};

const formatDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (value) => {
  const date = parseDate(value);

  if (!date) return "";

  return date.toLocaleDateString("ru-RU");
};

const getMonthDays = (monthDate) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmptyDays = (firstDay.getDay() + 6) % 7;
  const days = [];

  for (let index = 0; index < leadingEmptyDays; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(new Date(year, month, day));
  }

  return days;
};

export default function RussianDatePicker({ value, onChange, placeholder = "Выберите дату" }) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [monthDate, setMonthDate] = useState(() => parseDate(value) || new Date());

  const selectedDate = parseDate(value);
  const days = useMemo(() => getMonthDays(monthDate), [monthDate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openCalendar = () => {
    setMonthDate(parseDate(value) || new Date());
    setOpen(true);
  };

  const changeMonth = (offset) => {
    setMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const selectDate = (date) => {
    onChange(formatDateValue(date));
    setOpen(false);
  };

  const selectToday = () => {
    selectDate(new Date());
  };

  const clearDate = () => {
    onChange("");
    setOpen(false);
  };

  const isSelected = (date) =>
    selectedDate &&
    date.getFullYear() === selectedDate.getFullYear() &&
    date.getMonth() === selectedDate.getMonth() &&
    date.getDate() === selectedDate.getDate();

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={openCalendar}
        className="form-control text-left flex items-center justify-between gap-3"
      >
        <span className={value ? "text-gray-800" : "text-gray-400"}>
          {formatDisplayDate(value) || placeholder}
        </span>
        <i className="fa-regular fa-calendar text-gray-400"></i>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg z-50 p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="icon-btn"
              aria-label="Предыдущий месяц"
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>

            <div className="font-semibold text-gray-800">
              {MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}
            </div>

            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="icon-btn"
              aria-label="Следующий месяц"
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500 mb-2">
            {WEEKDAYS.map(day => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => (
              date ? (
                <button
                  key={formatDateValue(date)}
                  type="button"
                  onClick={() => selectDate(date)}
                  className={`h-9 rounded-lg text-sm transition ${
                    isSelected(date)
                      ? "bg-blue-600 text-white font-semibold"
                      : "text-gray-700 hover:bg-blue-50"
                  }`}
                >
                  {date.getDate()}
                </button>
              ) : (
                <div key={`empty-${index}`} />
              )
            ))}
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={clearDate}
              className="text-sm font-semibold text-gray-500 hover:text-gray-800"
            >
              Очистить
            </button>

            <button
              type="button"
              onClick={selectToday}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Сегодня
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
