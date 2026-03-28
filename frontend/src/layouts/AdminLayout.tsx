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
  { label: "Categories", to: "/categories" },
  { label: "Products", to: "/products" }
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
