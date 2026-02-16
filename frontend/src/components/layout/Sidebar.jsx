export default function Sidebar({ currentPage, setCurrentPage }) {
  const linkClass = (page) =>
    `flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer transition ${
      currentPage === page ? "bg-blue-800" : "hover:bg-blue-800"
    }`;

  return (

    <aside className="w-64 bg-blue-900 text-white flex flex-col lg:block hidden">
      <div className="p-6 border-b border-blue-800">
        <div className="flex items-center space-x-3">
                <i className="fas fa-hard-hat text-3xl text-blue-300"></i>
                <div>
                    <h1 className="text-xl font-bold">СпецОдежда</h1>
                    <p className="text-xs text-blue-300">Система учета</p>
                </div>
            </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <div className="text-xs uppercase text-blue-300 px-4">Справочники</div>

        <div onClick={() => setCurrentPage("employees")} className={linkClass("employees")}>
          <i className="fas fa-users w-5"></i>
          <span>Сотрудники</span>
        </div>

        <div onClick={() => setCurrentPage("departments")} className={linkClass("departments")}>
          <i className="fas fa-building w-5"></i>
          <span>Подразделения</span>
        </div>

        <div onClick={() => setCurrentPage("services")} className={linkClass("services")}>
          <i className="fas fa-briefcase w-5"></i>
          <span>Службы</span>
        </div>

        <div onClick={() => setCurrentPage("positions")} className={linkClass("positions")}>
          <i className="fas fa-id-badge w-5"></i>
          <span>Должности</span>
        </div>



        <div className="text-xs uppercase text-blue-300 px-4">Спецодежда</div>

        <div onClick={() => setCurrentPage("clothes")} className={linkClass("clothes")}>
          <i className="fas fa-tshirt w-5"></i>
          <span>Каталог одежды</span>
        </div>

        <div onClick={() => setCurrentPage("stocks")} className={linkClass("stocks")}>
          <i className="fas fa-warehouse w-5"></i>
          <span>Остатки на складе</span>
        </div>

         <div className="text-xs uppercase text-blue-300 px-4">Операции</div>

        <div onClick={() => setCurrentPage("issues")} className={linkClass("issues")}>
          <i className="fas fa-hand-holding w-5"></i>
          <span>Выдача одежды</span>
        </div>

        <div onClick={() => setCurrentPage("issues")} className={linkClass("issues")}>
          <i className="fas fa-table w-5"></i>
          <span>Отчет по выдаче</span>
        </div>

        <div onClick={() => setCurrentPage("issues")} className={linkClass("issues")}>
          <i className="fas fa-table w-5"></i>
          <span>Отчет для заказа</span>
        </div>

      </nav>
    </aside>

  );
}
