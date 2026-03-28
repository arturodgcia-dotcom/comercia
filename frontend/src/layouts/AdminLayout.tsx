import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../app/AuthContext";

const navItems = [
  { label: "Dashboard", to: "/" },
  { label: "Tenants", to: "/tenants" },
  { label: "Plans", to: "/plans" },
  { label: "Payments", to: "/admin/payments" },
  { label: "Loyalty", to: "/admin/loyalty" },
  { label: "Memberships", to: "/admin/memberships" },
  { label: "Coupons", to: "/admin/coupons" },
  { label: "Banners", to: "/admin/banners" },
  { label: "Reviews", to: "/admin/reviews" },
  { label: "Services", to: "/admin/services" },
  { label: "Appointments", to: "/admin/appointments" },
  { label: "Dist. Apps", to: "/admin/distributor-applications" },
  { label: "Distributors", to: "/admin/distributors" },
  { label: "Contracts", to: "/admin/contracts" },
  { label: "Recurring", to: "/admin/recurring-orders" },
  { label: "Logistics", to: "/admin/logistics" },
  { label: "Categories", to: "/categories" },
  { label: "Products", to: "/products" }
];

const reinpiaItems = [
  { label: "RG Dashboard", to: "/reinpia/dashboard" },
  { label: "RG Tenants", to: "/reinpia/tenants" },
  { label: "RG Payments", to: "/reinpia/payments" },
  { label: "RG Operations", to: "/reinpia/operations" },
  { label: "RG Reports", to: "/reinpia/reports" },
  { label: "RG Agents", to: "/reinpia/commission-agents" },
  { label: "RG Alerts", to: "/reinpia/alerts" }
];

export function AdminLayout() {
  const { logout, user } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>COMERCIA</h1>
        <p className="brand-subtitle">by REINPIA</p>
        <p className="sidebar-user">{user?.full_name}</p>
        <p className="sidebar-role">{user?.role}</p>
        <nav>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              end={item.to === "/"}
            >
              {item.label}
            </NavLink>
          ))}
          {user?.role === "reinpia_admin"
            ? reinpiaItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                >
                  {item.label}
                </NavLink>
              ))
            : null}
        </nav>
        <button className="button button-outline" onClick={logout} type="button">
          Cerrar sesion
        </button>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
