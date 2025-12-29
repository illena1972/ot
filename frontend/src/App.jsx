import { useEffect, useState } from "react";
import api from "./api/api";
import DepartmentForm from "./components/DepartmentForm";
import ServiceForm from "./components/ServiceForm";
import PositionForm from "./components/PositionForm";
import EmployeeForm from "./components/EmployeeForm";

function App() {
  const [departments, setDepartments] = useState([]);

  const loadDepartments = () => {
    api.get("departments/")
      .then(res => setDepartments(res.data));
  };

   useEffect(() => {
    loadDepartments();
  }, []);

  return (
    <div>


      <DepartmentForm />
      <ServiceForm />
      <PositionForm />
      <EmployeeForm />

      <h2>Подразделения</h2>

      <ul>
        {departments.map(dep => (
          <li key={dep.id}>{dep.name}</li>
        ))}
      </ul>
    </div>



  );
}

export default App;
