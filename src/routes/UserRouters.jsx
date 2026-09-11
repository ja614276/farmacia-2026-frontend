import { Navigate, Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";

// Layout & Globales
import { Sidebar } from "../components/layouts/sidebar";
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

// Categorías
import { CategoriesPage } from "../pages/CategoriesPage";
import { CategoriesRegisterPage } from "../pages/CategoriesRegisterPage";

// Proveedores
import { SuppliersPage } from "../pages/SuppliersPage";
import { SupplierRegisterPage } from "../pages/SupplierRegisterPage";

// Laboratorios
import { LaboratoriesPage } from "../pages/LaboratoriesPage";
import { LaboratoryRegisterPage } from "../pages/LaboratoryRegisterPage";

// Ubicaciones
import { LocationsPage } from "../pages/LocationsPage";
import { LocationRegisterPage } from "../pages/LocationRegisterPage";

// Clientes
import { ClientsPage } from "../pages/ClientsPage";
import { ClientsRegisterPage } from "../pages/ClientsRegisterPage.jsx";

// Ventas
import { SalesPage } from "../pages/SalesPage";
import { SalesRegisterPage } from "../pages/SalesRegisterPage";

// Cobranzas
import { CollectionsPage } from "../pages/CollectionsPage";
import { PaymentRegisterPage } from "../pages/PaymentRegisterPage";

// Métodos de Pago
import { PaymentMethodsPage } from "../pages/PaymentMethodsPage";

// Empleados (Módulo completo)
import { EmployeesPage } from "../pages/EmployeesPage";
import { EmployeesRegisterPage } from "../pages/EmployeesRegisterPage";
import { EmployeeDetailPage } from "../pages/EmployeeDetailPage";

// Sesiones de Caja
import { CashSessionsPage } from "../pages/CashSessionsPage.jsx";
import { CashSessionOpenPage } from "../pages/CashSessionOpenPage.jsx";
import { CashSessionClosePage } from "../pages/CashSessionClosePage.jsx";

// Ajustes de Inventarios
import { InventoryAdjustmentsPage } from "../pages/InventoryAdjustmentsPage.jsx";
import { InventoryAdjustmentRegisterPage } from "../pages/InventoryAdjustmentRegisterPage.jsx";

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
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="categories/register" element={<CategoriesRegisterPage />} />
          <Route path="categories/edit/:id" element={<CategoriesRegisterPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="suppliers/register" element={<SupplierRegisterPage />} />
          <Route path="suppliers/edit/:id" element={<SupplierRegisterPage />} />
          <Route path="laboratories" element={<LaboratoriesPage />} />
          <Route path="laboratories/register" element={<LaboratoryRegisterPage />} />
          <Route path="laboratories/edit/:id" element={<LaboratoryRegisterPage />} />
          <Route path="locations" element={<LocationsPage />} />
          <Route path="locations/register" element={<LocationRegisterPage />} />
          <Route path="locations/edit/:id" element={<LocationRegisterPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="clients/register" element={<ClientsRegisterPage />} />
          <Route path="clients/edit/:id" element={<ClientsRegisterPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="sales/register" element={<SalesRegisterPage />} />
          <Route path="sales/edit/:id" element={<SalesRegisterPage />} />
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="collections/register" element={<PaymentRegisterPage />} />
          <Route path="cobranzas" element={<CollectionsPage />} />
          <Route path="cobranzas/register" element={<PaymentRegisterPage />} />
          <Route path="cash-sessions" element={<CashSessionsPage />} />
          <Route path="cash-sessions/open" element={<CashSessionOpenPage />} />
          <Route path="cash-sessions/close" element={<CashSessionClosePage />} />
          <Route path="inventory-adjustments" element={<InventoryAdjustmentsPage />} />
          <Route path="inventory-adjustments/register" element={<InventoryAdjustmentRegisterPage />} />
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
