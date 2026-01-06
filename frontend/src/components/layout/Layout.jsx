import { useState } from "react";
import Sidebar from "./Sidebar";


export default function Layout({ children }) {
  const [currentPage, setCurrentPage] = useState("employees");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1">

        <main className="p-4 sm:p-6 lg:p-8">
          {children(currentPage)}
        </main>
      </div>
    </div>
  );
}
