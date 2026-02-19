import { useEffect, useState } from "react";
import api from "./api/api";
import Layout from "./components/layout/Layout";
import EmployeeForm from "./components/employees/EmployeeForm";
import DepartmentForm from "./components/departments/DepartmentForm";
import ServiceForm from "./components/services/ServiceForm";
import PositionForm from "./components/positions/PositionForm";
import EmployeeList from "./components/employees/EmployeeList";
import DepartmentList from "./components/departments/DepartmentList";
import ServiceList from "./components/services/ServiceList";
import PositionList from "./components/positions/PositionList";
import ClothesList from "./components/clothes/ClothesList";
import StockList from "./components/stocks/StockList";
import IssueCreate from "./components/issues/IssueCreate";
import EmployeeReportPage from "./components/reports/EmployeeReportPage";




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

      }}
    </Layout>
  );
}


export default App;


