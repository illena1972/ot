import { useEffect, useState } from "react";
import api from "./api/api";
import Layout from "./components/layout/Layout";
import LoginPage from "./components/auth/LoginPage";
import EmployeeList from "./components/employees/EmployeeList";
import DepartmentList from "./components/departments/DepartmentList";
import ServiceList from "./components/services/ServiceList";
import PositionList from "./components/positions/PositionList";
import ClothesList from "./components/clothes/ClothesList";
import StockList from "./components/stocks/StockList";
import IssueCreate from "./components/issues/IssueCreate";
import EmployeeReportPage from "./components/reports/EmployeeReportPage";
import OrderReportPage from "./components/orders/OrderReportPage";
import EmployeeCardPage from "./components/cards/EmployeeCardPage";




function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    api.get("auth/me/")
      .then((response) => setUser(response.data.user))
      .catch(() => setUser(null));
  }, []);

  const handleLogout = async () => {
    await api.post("auth/logout/");
    setUser(null);
  };

  if (user === undefined) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">Загрузка...</div>;
  }

  if (user === null) {
    return <LoginPage onAuthenticated={setUser} />;
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      {(page) => {
        if (page === "employees") return <EmployeeList />;
        if (page === "departments") return <DepartmentList />;
        if (page === "services") return <ServiceList />;
        if (page === "positions") return <PositionList />;
        if (page === "clothes") return <ClothesList />;
        if (page === "stocks") return <StockList />;
        if (page === "issues") return <IssueCreate />;
        if (page === "employee-report") return <EmployeeReportPage />;
        if (page === "order-report") return <OrderReportPage />;
        if (page === "employee-card") return <EmployeeCardPage />;

      }}
    </Layout>
  );
}


export default App;


