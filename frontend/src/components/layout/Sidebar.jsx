export default function Sidebar({ currentPage, setCurrentPage }) {
  const linkClass = (page) =>
    `flex items-center gap-4 px-5 py-3.5 rounded-xl cursor-pointer transition-all ${
      currentPage === page
        ? "bg-blue-800 text-white shadow-sm"
        : "text-white hover:bg-blue-800/70"
    }`;

  return (
    <aside className="w-80 bg-blue-900 text-white hidden lg:flex lg:flex-col min-h-screen">

      {/* HEADER */}
      <div className="p-6 border-b border-blue-800">
        <div className="flex items-center gap-4">

          <i className="fa-solid fa-helmet-safety text-4xl text-blue-300 shrink-0"></i>

          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight">
              СпецОдежда
            </h1>
            <p className="text-sm text-blue-300">
              Система учета
            </p>
          </div>
        </div>
      </div>

      {/* MENU */}
      <nav className="flex-1 p-5 space-y-3">

        <div className="text-sm uppercase text-blue-300 px-2 font-semibold tracking-wide">
          Справочники
        </div>

        <div onClick={() => setCurrentPage("employees")} className={linkClass("employees")}>
          <i className="fa-solid fa-users text-lg w-6 shrink-0"></i>
          <span className="text-base font-medium">Сотрудники</span>
        </div>

        <div onClick={() => setCurrentPage("departments")} className={linkClass("departments")}>
          <i className="fa-solid fa-building text-lg w-6 shrink-0"></i>
          <span className="text-base font-medium">Подразделения</span>
        </div>

        <div onClick={() => setCurrentPage("services")} className={linkClass("services")}>
          <i className="fa-solid fa-briefcase text-lg w-6 shrink-0"></i>
          <span className="text-base font-medium">Службы</span>
        </div>

        <div onClick={() => setCurrentPage("positions")} className={linkClass("positions")}>
          <i className="fa-solid fa-id-badge text-lg w-6 shrink-0"></i>
          <span className="text-base font-medium">Должности</span>
        </div>

        <div className="text-sm uppercase text-blue-300 px-2 pt-5 font-semibold tracking-wide">
          Спецодежда
        </div>

        <div onClick={() => setCurrentPage("clothes")} className={linkClass("clothes")}>
          <i className="fa-solid fa-shirt text-lg w-6 shrink-0"></i>
          <span className="text-base font-medium">Каталог одежды</span>
        </div>

        <div onClick={() => setCurrentPage("stocks")} className={linkClass("stocks")}>
          <i className="fa-solid fa-warehouse text-lg w-6 shrink-0"></i>
          <span className="text-base font-medium">Остатки на складе</span>
        </div>

        <div className="text-sm uppercase text-blue-300 px-2 pt-5 font-semibold tracking-wide">
          Операции
        </div>

        <div onClick={() => setCurrentPage("issues")} className={linkClass("issues")}>
          <i className="fa-solid fa-hand-holding text-lg w-6 shrink-0"></i>
          <span className="text-base font-medium">Выдача одежды</span>
        </div>

        <div onClick={() => setCurrentPage("employee-report")} className={linkClass("employee-report")}>
          <i className="fa-solid fa-table text-lg w-6 shrink-0"></i>
          <span className="text-base font-medium">Отчет по выдаче</span>
        </div>

        <div onClick={() => setCurrentPage("order-report")} className={linkClass("order-report")}>
          <i className="fa-solid fa-table text-lg w-6 shrink-0"></i>
          <span className="text-base font-medium">Отчет для заказа</span>
        </div>

      </nav>
    </aside>
  );
}