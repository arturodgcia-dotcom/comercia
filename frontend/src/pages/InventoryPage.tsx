import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { Product } from "../types/domain";

type StockMap = Record<number, { general: number; publico: number; distribuidor: number; pos: number; almacenPrincipal: number }>;

function getStorageKey(tenantId: number) {
  return `comercia_inventory_${tenantId}`;
}

export function InventoryPage() {
  const { token, user } = useAuth();
  const tenantId = user?.tenant_id ?? 0;
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [stockMap, setStockMap] = useState<StockMap>({});

  useEffect(() => {
    if (!token || !tenantId) return;
    api.getProductsByTenant(token, tenantId)
      .then((data) => {
        setProducts(data);
        const stored = localStorage.getItem(getStorageKey(tenantId));
        if (stored) {
          setStockMap(JSON.parse(stored) as StockMap);
          return;
        }
        const defaults: StockMap = {};
        data.forEach((product) => {
          const base = product.is_active ? 120 : 0;
          defaults[product.id] = {
            general: base,
            publico: Math.floor(base * 0.5),
            distribuidor: Math.floor(base * 0.3),
            pos: Math.floor(base * 0.2),
            almacenPrincipal: base,
          };
        });
        setStockMap(defaults);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar inventario."));
  }, [token, tenantId]);

  useEffect(() => {
    if (!tenantId || Object.keys(stockMap).length === 0) return;
    localStorage.setItem(getStorageKey(tenantId), JSON.stringify(stockMap));
  }, [stockMap, tenantId]);

  const totals = useMemo(() => {
    return Object.values(stockMap).reduce(
      (acc, row) => {
        acc.general += row.general;
        acc.publico += row.publico;
        acc.distribuidor += row.distribuidor;
        acc.pos += row.pos;
        return acc;
      },
      { general: 0, publico: 0, distribuidor: 0, pos: 0 }
    );
  }, [stockMap]);

  const applyMovement = (productId: number, field: keyof StockMap[number], delta: number) => {
    setStockMap((previous) => {
      const current = previous[productId] ?? { general: 0, publico: 0, distribuidor: 0, pos: 0, almacenPrincipal: 0 };
      const nextValue = Math.max(0, (current[field] ?? 0) + delta);
      const next = { ...current, [field]: nextValue };
      if (field !== "general") {
        next.general = next.publico + next.distribuidor + next.pos;
      }
      if (field === "general") {
        next.publico = Math.floor(next.general * 0.5);
        next.distribuidor = Math.floor(next.general * 0.3);
        next.pos = Math.max(0, next.general - next.publico - next.distribuidor);
      }
      next.almacenPrincipal = next.general;
      return { ...previous, [productId]: next };
    });
  };

  return (
    <section>
      <PageHeader
        title="Inventario y surtido"
        subtitle="Control visible de stock general, por canal, por almacén y ajustes rápidos de movimiento."
      />
      {error ? <p className="error">{error}</p> : null}

      <div className="card-grid">
        <article className="card"><h3>Stock general</h3><p>{totals.general}</p></article>
        <article className="card"><h3>Canal público</h3><p>{totals.publico}</p></article>
        <article className="card"><h3>Canal distribuidor</h3><p>{totals.distribuidor}</p></article>
        <article className="card"><h3>Canal POS</h3><p>{totals.pos}</p></article>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>SKU</th>
              <th>Stock general</th>
              <th>Público</th>
              <th>Distribuidor</th>
              <th>POS</th>
              <th>Almacén principal</th>
              <th>Movimientos</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const stock = stockMap[product.id] ?? { general: 0, publico: 0, distribuidor: 0, pos: 0, almacenPrincipal: 0 };
              return (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.slug.toUpperCase()}</td>
                  <td>{stock.general}</td>
                  <td>{stock.publico}</td>
                  <td>{stock.distribuidor}</td>
                  <td>{stock.pos}</td>
                  <td>{stock.almacenPrincipal}</td>
                  <td>
                    <div className="row-gap">
                      <button className="button button-outline" onClick={() => applyMovement(product.id, "general", 10)} type="button">+10</button>
                      <button className="button button-outline" onClick={() => applyMovement(product.id, "general", -10)} type="button">-10</button>
                      <button className="button button-outline" onClick={() => applyMovement(product.id, "distribuidor", 5)} type="button">+5 dist</button>
                      <button className="button button-outline" onClick={() => applyMovement(product.id, "pos", 5)} type="button">+5 POS</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
