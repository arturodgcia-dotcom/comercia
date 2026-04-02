/* ═══════════════════════════════════════════════════════════
   MERCAPLUS DEMO — Layout compartido: Topbar + Header + CatNav + Footer
   ═══════════════════════════════════════════════════════════ */

import { useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useMp } from "./MpContext";
import { MP_BRAND, MP_CATEGORIES } from "./data";
import "./mercaplus.css";
import "./mp-additions.css";

/* ── Topbar ── */
function MpTopbar() {
  const { user, login, logout, channel, setChannel } = useMp();
  return (
    <div className="mp-topbar">
      <div className="mp-topbar-left">
        <span>Tel: {MP_BRAND.phone}</span>
        <span>Email: {MP_BRAND.email}</span>
        <span className="mp-topbar-badge">ENVÍO GRATIS $999+</span>
      </div>
      <div className="mp-topbar-right">
        <span
          style={{ cursor: "pointer", color: channel === "dist" ? "#fbbf24" : undefined }}
          onClick={() => {
            if (channel !== "dist") {
              setChannel("dist");
              login({ type: "dist", name: "Carlos Díaz", company: "Distribuidora Del Norte S.A.", email: "carlos@distnorte.mx", tier: "oro" });
            } else {
              setChannel("public");
              logout();
            }
          }}
        >
          🏭 Canal Distribuidores
        </span>
        <span style={{ color: "#334" }}>|</span>
        {user.type === "guest" ? (
          <span
            style={{ cursor: "pointer" }}
            onClick={() => login({ type: "public", name: "María García", email: "maria@email.com", loyaltyPoints: 1240 })}
          >
            👤 Iniciar sesión
          </span>
        ) : (
          <span style={{ cursor: "pointer", color: "#a5f3fc" }} onClick={logout}>
            👤 {"name" in user ? user.name : "Usuario"} · Salir
          </span>
        )}
        <span>🌐 MX</span>
      </div>
    </div>
  );
}

/* ── Header principal ── */
function MpHeader() {
  const { cartCount, user, channel } = useMp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCat, setSearchCat] = useState("all");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/demo/mercaplus/catalogo?q=${encodeURIComponent(searchQuery)}&cat=${searchCat}`);
  };

  return (
    <header className="mp-header">
      {/* Logo */}
      <Link to="/demo/mercaplus" className="mp-logo">
        <span className="mp-logo-main">Merca<span>Plus</span></span>
        <span className="mp-logo-sub">Demo</span>
      </Link>

      {/* Buscador */}
      <form className="mp-search-wrap" onSubmit={handleSearch}>
        <select
          className="mp-search-category"
          value={searchCat}
          onChange={(e) => setSearchCat(e.target.value)}
        >
          <option value="all">Todas las categorías</option>
          {MP_CATEGORIES.filter((c) => c.id !== "c8").map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <input
          className="mp-search-input"
          type="text"
          placeholder="Buscar productos, marcas y más..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className="mp-search-btn" type="submit">🔍</button>
      </form>

      {/* Acciones */}
      <div className="mp-header-actions">
        {user.type !== "guest" && (
          <Link to="/demo/mercaplus/cuenta" className="mp-header-action">
            <span className="mp-header-action-icon">👤</span>
            <span className="mp-header-action-label">{"name" in user ? user.name.split(" ")[0] : "Cuenta"}</span>
          </Link>
        )}
        {channel === "dist" && (
          <Link to="/demo/mercaplus/dist/dashboard" className="mp-header-action">
            <span className="mp-header-action-icon">📊</span>
            <span className="mp-header-action-label">Mi Portal</span>
          </Link>
        )}
        <Link to="/demo/mercaplus/carrito" className="mp-header-action mp-cart-action">
          <span className="mp-header-action-icon">🛒</span>
          <span className="mp-header-action-label">Carrito</span>
          {cartCount > 0 && <span className="mp-cart-badge">{cartCount}</span>}
        </Link>
      </div>
    </header>
  );
}

/* ── Barra de categorías ── */
function MpCatNav() {
  return (
    <nav className="mp-catnav">
      <div className="mp-catnav-inner">
        <Link to="/demo/mercaplus/catalogo" className="mp-catnav-link mp-catnav-all">
          ☰ Todas las categorías
        </Link>
        {MP_CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            to={`/demo/mercaplus/catalogo?cat=${cat.slug}`}
            className="mp-catnav-link"
          >
            {cat.icon} {cat.name}
          </Link>
        ))}
        <Link to="/demo/mercaplus/promos" className="mp-catnav-link" style={{ color: "#f59e0b", fontWeight: 700 }}>
          🏷️ Promociones
        </Link>
      </div>
    </nav>
  );
}

/* ── Footer ── */
function MpFooter() {
  return (
    <footer className="mp-footer">
      <div className="mp-footer-grid">
        <div>
          <p className="mp-footer-logo">Merca<span>Plus</span></p>
          <p className="mp-footer-tagline">{MP_BRAND.tagline}</p>
          <p style={{ marginTop: "12px", fontSize: "13px", color: "#7a9ac8" }}>
            Tel: {MP_BRAND.phone}<br />
            Email: {MP_BRAND.email}<br />
            Dirección: {MP_BRAND.address}
          </p>
        </div>

        <div>
          <p className="mp-footer-heading">Compra</p>
          <Link to="/demo/mercaplus/catalogo" className="mp-footer-link">Catálogo</Link>
          <Link to="/demo/mercaplus/categorias" className="mp-footer-link">Categorías</Link>
          <Link to="/demo/mercaplus/promos" className="mp-footer-link">Promociones</Link>
          <Link to="/demo/mercaplus/catalogo?new=true" className="mp-footer-link">Novedades</Link>
        </div>

        <div>
          <p className="mp-footer-heading">Empresas</p>
          <Link to="/demo/mercaplus/dist" className="mp-footer-link">Canal Distribuidores</Link>
          <Link to="/demo/mercaplus/dist/catalogo" className="mp-footer-link">Catálogo Mayoreo</Link>
          <Link to="/demo/mercaplus/contacto" className="mp-footer-link">Hablar con ejecutivo IA</Link>
        </div>

        <div>
          <p className="mp-footer-heading">Ayuda</p>
          <Link to="/demo/mercaplus/faq" className="mp-footer-link">Preguntas frecuentes</Link>
          <Link to="/demo/mercaplus/contacto" className="mp-footer-link">Contacto</Link>
          <Link to="/demo/mercaplus/politicas" className="mp-footer-link">Políticas</Link>
        </div>
      </div>
      <div className="mp-footer-bottom">
        <span>© 2025 MercaPlus Demo — Powered by COMERCIA</span>
        <span style={{ display: "flex", gap: "16px" }}>
          <Link to="/demo/mercaplus/politicas" className="mp-footer-link" style={{ margin: 0 }}>Privacidad</Link>
          <Link to="/demo/mercaplus/politicas" className="mp-footer-link" style={{ margin: 0 }}>Términos</Link>
        </span>
      </div>
    </footer>
  );
}

/* ── Layout raíz ── */
export function MpLayout() {
  return (
    <div className="mp">
      <MpTopbar />
      <MpHeader />
      <MpCatNav />
      <main style={{ minHeight: "60vh" }}>
        <Outlet />
      </main>
      <MpFooter />
    </div>
  );
}

/* ── Layout distribuidores (header oscuro con badge) ── */
export function MpDistLayout() {
  return (
    <div className="mp">
      <MpTopbar />
      <MpHeader />
      <div className="mp-dist-channel-bar">
        <span>🏭 Canal Exclusivo Distribuidores</span>
        <Link to="/demo/mercaplus" style={{ color: "#93c5fd", fontSize: "13px" }}>← Tienda pública</Link>
      </div>
      <main style={{ minHeight: "60vh" }}>
        <Outlet />
      </main>
      <MpFooter />
    </div>
  );
}

/* ── Layout POS (sin header público, full-screen) ── */
export function MpPosLayout() {
  return (
    <div className="mp">
      <Outlet />
    </div>
  );
}
