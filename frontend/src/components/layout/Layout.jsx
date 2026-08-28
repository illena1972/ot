import { useEffect, useState } from "react";
import api from "../../api/api";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";


export default function Layout({ children }) {
  const [currentPage, setCurrentPage] = useState("employees");
  const [organization, setOrganization] = useState(null);
  const [organizationLoading, setOrganizationLoading] = useState(true);

  useEffect(() => {
    api.get("organization/current/")
      .then((response) => setOrganization(response.data))
      .catch((error) => console.error("Не удалось определить организацию", error))
      .finally(() => setOrganizationLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
      <div className="flex-1">
        <Topbar organization={organization} loading={organizationLoading} />

        <main className="p-4 sm:p-6 lg:p-8">
          {children(currentPage)}
        </main>
      </div>
    </div>
  );
}
