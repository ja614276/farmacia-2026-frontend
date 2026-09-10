import { Navigate, Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";

// Layout & Globales
import { Sidebar } from "../components/layouts/Sidebar";
import { DashboardPage } from "../components/DashboardPage.jsx";
import { SupportHelp } from "../components/SupportHelp.jsx";

// Usuarios
import { UsersPage } from "../pages/UsersPage";
import { RegisterPage } from "../pages/RegisterPage";

// Productos & Lotes
import { ProductsPage } from "../pages/ProductsPage";
import { ProductsRegisterPage } from "../pages/ProductsRegisterPage.jsx";
import { ProductLotsPage } from "../pages/ProductLotsPage.jsx";
import { ProductDetailPage } from "../pages/ProductDetailPage.jsx";

// Clientes
import { ClientsRegisterPage } from "../pages/ClientsRegisterPage.jsx";

// Métodos de Pago
import { PaymentMethodsPage } from "../pages/PaymentMethodsPage";

// Empleados (Módulo completo)
import { EmployeesPage } from "../pages/EmployeesPage";
import { EmployeesRegisterPage } from "../pages/EmployeesRegisterPage";
import { EmployeeDetailPage } from "../pages/EmployeeDetailPage";

import { PurchaseRegisterPage } from "../pages/PurchaseRegisterPage";

export const UserRoutes = () => {
  const { isAdmin } = useSelector((state) => state.auth);

  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <Sidebar />

      <main
        style={{
          flex: 1,
          padding: "32px",
          backgroundColor: "#f4f6f9",
          overflowY: "auto",
        }}
      >
        <Routes>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/register" element={<ProductsRegisterPage />} />
          <Route path="products/edit/:id" element={<ProductsRegisterPage />} />
          <Route path="clients/register" element={<ClientsRegisterPage />} />
          <Route path="clients/edit/:id" element={<ClientsRegisterPage />} />
          <Route path="products/:id/lots" element={<ProductLotsPage />} />
          <Route path="products/:id/detail" element={<ProductDetailPage />} />
          <Route path="payment-methods" element={<PaymentMethodsPage />} />
          <Route path="help" element={<SupportHelp />} />

          {/* Listado de Empleados accesible */}
          <Route path="/employees" element={<EmployeesPage />} />
          <Route
            path="/employees/detail/:id"
            element={<EmployeeDetailPage />}
          />
          <Route
            path="/employees/register"
            element={<EmployeesRegisterPage />}
          />
          <Route
            path="/employees/edit/:id"
            element={<EmployeesRegisterPage />}
          />
          <Route
            path="/purchases/register"
            element={<PurchaseRegisterPage />}
          />

          {/* Rutas administrativas protegidas */}
          {isAdmin && (
            <>
              <Route path="users/register" element={<RegisterPage />} />
              <Route path="users/edit/:id" element={<RegisterPage />} />
            </>
          )}

          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
    </div>
  );
};
