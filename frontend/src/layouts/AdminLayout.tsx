import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/" },
  { label: "Tenants", to: "/tenants" },
  { label: "Plans", to: "/plans" },
  { label: "Stripe", to: "/stripe-config" },
  { label: "Categories", to: "/categories" },
  { label: "Products", to: "/products" }
];

export function AdminLayout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>COMERCIA</h1>
        <p className="brand-subtitle">by REINPIA</p>
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
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
