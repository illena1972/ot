import Layout from "./components/layout/Layout";
import EmployeeList from "./components/employees/EmployeeList";
import DepartmentList from "./components/departments/DepartmentList";
import ServiceList from "./components/services/ServiceList";
import PositionList from "./components/positions/PositionList";
import ClothesList from "./components/clothes/ClothesList";
import StockList from "./components/stocks/StockList";
import IssueCreate from "./components/issues/IssueCreate";
import EmployeeReportPage from "./components/reports/EmployeeReportPage";
import OrderReportPage from "./components/orders/OrderReportPage";




function App() {
  return (
    <Layout>
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

      }}
    </Layout>
  );
}


export default App;


