import { useEffect, useState } from "react";
import api from "./api/api";
import Layout from "./components/layout/Layout";
import EmployeeForm from "./components/employees/EmployeeForm";
import DepartmentForm from "./components/departments/DepartmentForm";
import ServiceForm from "./components/services/ServiceForm";
import PositionForm from "./components/positions/PositionForm";
import EmployeeList from "./components/employees/EmployeeList";

function App() {
  return (
    <Layout>
      {(page) => {
        //if (page === "employees") return <EmployeeForm />;
        if (page === "employees") return <EmployeeList />;
        if (page === "departments") return <DepartmentForm />;
        if (page === "services") return <ServiceForm />;
        if (page === "positions") return <PositionForm />;
      }}
    </Layout>
  );
}

export default App;


