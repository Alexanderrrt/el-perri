"use client";
import { AdminLoginForm } from "@/app/components/AdminLoginForm";

export default function AdminLoginPage() {
  const handleAdminLogin = async (data) => {
    console.log("Admin authentication successful", data);
  };

  return (
    <main className="admin-login-page">
      <div className="admin-login-container">
        <AdminLoginForm onSubmit={handleAdminLogin} isLoading={false} />
      </div>
    </main>
  );
}
